import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/meeting - Fetch all Meetings
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM meeting_items ORDER BY created_at DESC').all();
    const items = rows.map(r => ({
      ...r,
      primaryCategory: r.primary_category,
      subCategory: r.sub_category,
      attendees: JSON.parse(r.attendees || '[]')
    }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/meeting - Create new Meeting
export async function POST(req) {
  try {
    const body = await req.json();
    const { primaryCategory, subCategory, title, site, date, time, attendees, content } = body;

    const stmt = db.prepare(`
      INSERT INTO meeting_items (id, primary_category, sub_category, title, site, date, time, attendees, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = `MTG-2026-${Date.now().toString().slice(-4)}`;
    stmt.run(
      id,
      primaryCategory || '회의',
      subCategory || '고객사 미팅',
      title,
      site,
      date || new Date().toISOString().split('T')[0],
      time || '14:00 - 16:00',
      JSON.stringify(attendees || []),
      content || ''
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/meeting - Delete Meeting
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM meeting_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
