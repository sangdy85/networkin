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
      filePath: r.file_path || '',
      fileSize: r.file_size || '',
      isPrimary: Boolean(r.is_primary),
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
      filePath,
      fileSize,
      isPrimary,
      description
    } = body;

    const isPrimaryVal = category === '망구성도' ? (isPrimary !== undefined ? (isPrimary ? 1 : 0) : 1) : 0;

    // If setting as primary for '망구성도', reset other '망구성도' primary status
    if (category === '망구성도' && isPrimaryVal === 1) {
      db.prepare("UPDATE intranet_docs SET is_primary = 0 WHERE category = '망구성도'").run();
    }

    const stmt = db.prepare(`
      INSERT INTO intranet_docs (code, title, category, security_level, version, author, date, target_info, file_name, file_path, file_size, is_primary, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      code || `INT-NET-${String(Date.now()).slice(-4)}`,
      title,
      category || '망구성도',
      securityLevel || '사내전용',
      version || 'v1.0',
      author || '담당자',
      date || new Date().toISOString().split('T')[0],
      targetInfo || '',
      fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      filePath || '',
      fileSize || '0 KB',
      isPrimaryVal,
      description || ''
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/intranet - Update Intranet Network Document or set primary
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      action,
      code,
      title,
      category,
      securityLevel,
      version,
      author,
      date,
      targetInfo,
      fileName,
      filePath,
      fileSize,
      isPrimary,
      description
    } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // Special action: Set as primary representative document for 망구성도
    if (action === 'setPrimary') {
      const doc = db.prepare('SELECT category FROM intranet_docs WHERE id = ?').get(id);
      if (doc) {
        db.prepare("UPDATE intranet_docs SET is_primary = 0 WHERE category = ?").run(doc.category);
        db.prepare("UPDATE intranet_docs SET is_primary = 1 WHERE id = ?").run(id);
      }
      return NextResponse.json({ success: true });
    }

    const isPrimaryVal = category === '망구성도' && isPrimary ? 1 : 0;
    if (category === '망구성도' && isPrimaryVal === 1) {
      db.prepare("UPDATE intranet_docs SET is_primary = 0 WHERE category = '망구성도' AND id != ?").run(id);
    }

    const stmt = db.prepare(`
      UPDATE intranet_docs
      SET code = ?, title = ?, category = ?, security_level = ?, version = ?, author = ?, date = ?, target_info = ?, file_name = ?, file_path = ?, file_size = ?, is_primary = ?, description = ?
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
      filePath || '',
      fileSize || '',
      isPrimaryVal,
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

    const targetDoc = db.prepare('SELECT * FROM intranet_docs WHERE id = ?').get(id);
    db.prepare('DELETE FROM intranet_docs WHERE id = ?').run(id);

    // If deleted doc was primary, promote latest remaining doc in same category to primary
    if (targetDoc && targetDoc.is_primary === 1) {
      const latestRemaining = db.prepare('SELECT id FROM intranet_docs WHERE category = ? ORDER BY id DESC LIMIT 1').get(targetDoc.category);
      if (latestRemaining) {
        db.prepare('UPDATE intranet_docs SET is_primary = 1 WHERE id = ?').run(latestRemaining.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
