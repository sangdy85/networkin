import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/documents - Fetch all Documents
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    const items = rows.map(r => ({
      ...r,
      fileSize: r.file_size,
      fileName: r.file_name
    }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/documents - Create new Document
export async function POST(req) {
  try {
    const body = await req.json();
    const { code, title, category, author, version, date, fileSize, fileName, description } = body;

    const stmt = db.prepare(`
      INSERT INTO documents (code, title, category, author, version, date, file_size, file_name, downloads, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      code || `DOC-2026-${Date.now().toString().slice(-4)}`,
      title,
      category,
      author || '담당자',
      version || 'v1.0',
      date || new Date().toISOString().split('T')[0],
      fileSize || '4.2 MB',
      fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      0,
      description || ''
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/documents - Update Document
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, code, title, category, author, version, date, fileSize, fileName, description } = body;

    const stmt = db.prepare(`
      UPDATE documents
      SET code = ?, title = ?, category = ?, author = ?, version = ?, date = ?, file_size = ?, file_name = ?, description = ?
      WHERE id = ?
    `);

    stmt.run(
      code,
      title,
      category,
      author,
      version,
      date,
      fileSize,
      fileName,
      description || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/documents - Delete Document
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
