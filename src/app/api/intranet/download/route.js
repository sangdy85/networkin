import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

const getMimeType = (filePath = '') => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    case '.gif': return 'image/gif';
    case '.pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'doc'; // 'doc' | 'preview'
    const mode = searchParams.get('mode') || (type === 'preview' ? 'inline' : 'attachment');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const doc = db.prepare('SELECT * FROM intranet_docs WHERE id = ?').get(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Determine target file path
    let targetRelativePath = type === 'preview' ? (doc.preview_img_path || doc.file_path) : doc.file_path;
    let targetFileName = type === 'preview' ? `preview_${doc.file_name}` : doc.file_name;

    // Fallback: If preview requested but preview_img_path is empty, check if doc.file_path is an image
    if (type === 'preview' && !doc.preview_img_path) {
      if (doc.file_path && getMimeType(doc.file_path).startsWith('image/')) {
        targetRelativePath = doc.file_path;
      } else {
        return NextResponse.json({ error: 'No preview image available for this document' }, { status: 404 });
      }
    }

    if (!targetRelativePath) {
      return NextResponse.json({ error: 'File path not set' }, { status: 404 });
    }

    // Resolve file path on disk
    const cleanPath = targetRelativePath.replace(/^\//, '');
    const absolutePath = path.join(process.cwd(), 'public', cleanPath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found on server disk' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const mimeType = getMimeType(targetRelativePath);
    const encodedFileName = encodeURIComponent(targetFileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    const headers = {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    };

    if (mode === 'inline' || mimeType.startsWith('image/')) {
      headers['Content-Disposition'] = `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
    } else {
      headers['Content-Disposition'] = `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
    }

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
