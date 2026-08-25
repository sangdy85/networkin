import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/mail - List all mails or filter by folder
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'inbox';

    const rows = db.prepare('SELECT * FROM mails WHERE folder = ? ORDER BY created_at DESC').all(folder);
    const mails = rows.map(r => ({
      id: r.id,
      sender: r.sender,
      email: r.sender_email,
      recipient: r.recipient,
      subject: r.subject,
      snippet: r.snippet,
      content: r.content,
      date: r.date,
      unread: Boolean(r.unread),
      isExternal: Boolean(r.is_external),
      hasAttachment: Boolean(r.has_attachment),
      folder: r.folder
    }));

    return NextResponse.json(mails);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/mail - Save a new mail (internal or sent)
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, sender, senderEmail, recipient, subject, snippet, content, date, folder, unread, isExternal, hasAttachment } = body;

    const mailId = id || `MAIL-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mails (id, sender, sender_email, recipient, subject, snippet, content, date, folder, unread, is_external, has_attachment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      mailId,
      sender || '발신자',
      senderEmail || '',
      recipient || '',
      subject || '(제목 없음)',
      snippet || (content ? content.slice(0, 80) : ''),
      content || '',
      date || new Date().toLocaleString(),
      folder || 'inbox',
      unread ? 1 : 0,
      isExternal ? 1 : 0,
      hasAttachment ? 1 : 0
    );

    return NextResponse.json({ success: true, id: mailId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/mail - Delete a mail
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM mails WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
