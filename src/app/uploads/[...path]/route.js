import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.hwp': 'application/x-hwp',
  '.hwpx': 'application/x-hwp'
};

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams?.path || [];
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'File path not provided' }, { status: 400 });
    }

    const safeSubPath = path.normalize(pathSegments.join('/')).replace(/^(\.\.[\\/])+/, '');
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', safeSubPath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = path.basename(absolutePath);
    const encodedFileName = encodeURIComponent(fileName);

    const isInlineViewable = mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('text/');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Content-Disposition': isInlineViewable
          ? `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
          : `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
