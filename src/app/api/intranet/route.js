import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/intranet - Fetch all Intranet Network Documents
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM intranet_docs ORDER BY id DESC').all();
    const items = rows.map(r => ({
      id: r.id,
      code: r.code,
      title: r.title,
      category: r.category,
      securityLevel: r.security_level || '사내전용',
      version: r.version || 'v1.0',
      author: r.author,
      date: r.date,
      targetInfo: r.target_info || '',
      fileName: r.file_name,
      fileSize: r.file_size,
      description: r.description || '',
      createdAt: r.created_at
    }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/intranet - Create new Intranet Network Document
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      code,
      title,
      category,
      securityLevel,
      version,
      author,
      date,
      targetInfo,
      fileName,
      fileSize,
      description
    } = body;

    const stmt = db.prepare(`
      INSERT INTO intranet_docs (code, title, category, security_level, version, author, date, target_info, file_name, file_size, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      code || `INT-NET-${String(Date.now()).slice(-4)}`,
      title,
      category || '망구성도/토폴로지',
      securityLevel || '사내전용',
      version || 'v1.0',
      author || '담당자',
      date || new Date().toISOString().split('T')[0],
      targetInfo || '',
      fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileSize || '2.5 MB',
      description || ''
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/intranet - Update Intranet Network Document
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      code,
      title,
      category,
      securityLevel,
      version,
      author,
      date,
      targetInfo,
      fileName,
      fileSize,
      description
    } = body;

    const stmt = db.prepare(`
      UPDATE intranet_docs
      SET code = ?, title = ?, category = ?, security_level = ?, version = ?, author = ?, date = ?, target_info = ?, file_name = ?, file_size = ?, description = ?
      WHERE id = ?
    `);

    stmt.run(
      code,
      title,
      category,
      securityLevel,
      version,
      author,
      date,
      targetInfo || '',
      fileName,
      fileSize,
      description || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/intranet - Delete Intranet Network Document
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM intranet_docs WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
