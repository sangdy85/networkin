import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'doc'; // 'doc' | 'preview'

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const doc = db.prepare('SELECT * FROM intranet_docs WHERE id = ?').get(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const targetRelativePath = type === 'preview' ? doc.preview_img_path : doc.file_path;
    const targetFileName = type === 'preview' ? `preview_${doc.file_name}` : doc.file_name;

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
    const encodedFileName = encodeURIComponent(targetFileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
