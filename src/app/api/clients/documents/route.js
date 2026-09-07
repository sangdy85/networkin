import db from '@/lib/db';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// GET /api/clients/documents?clientId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId가 필요합니다.' }, { status: 400 });
    }

    const rows = db.prepare('SELECT * FROM client_documents WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    const items = rows.map(r => ({
      ...r,
      fileName: r.file_name,
      filePath: r.file_path,
      fileSize: r.file_size,
      uploadedBy: r.uploaded_by,
      createdAt: r.created_at
    }));

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients/documents
export async function POST(req) {
  try {
    const body = await req.json();
    const { clientId, title, category, fileName, filePath, fileSize, uploadedBy, description } = body;

    if (!clientId || !title || !filePath) {
      return NextResponse.json({ error: '필수 입력 항목(고객사, 문서 제목, 파일)이 누락되었습니다.' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO client_documents (client_id, title, category, file_name, file_path, file_size, uploaded_by, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      clientId,
      title.trim(),
      category || '기타',
      fileName || 'document.pdf',
      filePath,
      fileSize || '0 KB',
      uploadedBy || '담당자',
      description ? description.trim() : ''
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/documents?id=X
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '문서 ID가 필요합니다.' }, { status: 400 });
    }

    // Get document file path to delete file from disk if it exists
    const doc = db.prepare('SELECT * FROM client_documents WHERE id = ?').get(id);
    if (doc && doc.file_path && doc.file_path.startsWith('/uploads/client_docs/')) {
      const diskPath = path.join(process.cwd(), 'public', doc.file_path);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn('Failed to delete file from disk:', e.message);
        }
      }
    }

    db.prepare('DELETE FROM client_documents WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
