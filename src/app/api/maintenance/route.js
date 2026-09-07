import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/maintenance - Fetch all maintenance tickets
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM maintenance_tickets ORDER BY created_at DESC').all();
    const tickets = rows.map(r => ({
      id: r.id,
      ticketNo: r.ticket_no,
      site: r.site,
      title: r.title,
      category: r.category,
      priority: r.priority,
      status: r.status,
      workers: JSON.parse(r.workers || '[]'),
      resolutionNote: r.resolution_note || '',
      date: r.date,
      fileName: r.file_name || null,
      filePath: r.file_path || null
    }));

    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/maintenance - Create new maintenance ticket
export async function POST(req) {
  try {
    const body = await req.json();
    const { ticketNo, site, title, category, priority, status, workers, resolutionNote, date, fileName, filePath } = body;

    if (!title || !site) {
      return NextResponse.json({ error: '사이트명과 접수 제목을 입력해 주세요.' }, { status: 400 });
    }

    const tId = `MNT-${Date.now()}`;
    const tNo = ticketNo || `TKT-2026-${Date.now().toString().slice(-4)}`;

    const stmt = db.prepare(`
      INSERT INTO maintenance_tickets (id, ticket_no, site, title, category, priority, status, workers, resolution_note, date, file_name, file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tId,
      tNo,
      site,
      title,
      category || '네트워크',
      priority || '보통',
      status || '접수',
      JSON.stringify(workers || []),
      resolutionNote || '',
      date || new Date().toISOString().split('T')[0],
      fileName || null,
      filePath || null
    );

    return NextResponse.json({ success: true, id: tId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/maintenance - Update maintenance ticket
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ticketNo, site, title, category, priority, status, workers, resolutionNote, date, fileName, filePath } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    let sql = `
      UPDATE maintenance_tickets
      SET ticket_no = ?, site = ?, title = ?, category = ?, priority = ?, status = ?, workers = ?, resolution_note = ?, date = ?
    `;
    const params = [ticketNo, site, title, category, priority, status, JSON.stringify(workers || []), resolutionNote || '', date];
    
    if (fileName !== undefined) {
      sql += `, file_name = ?, file_path = ?`;
      params.push(fileName, filePath);
    }
    
    sql += ` WHERE id = ?`;
    params.push(id);

    const stmt = db.prepare(sql);
    stmt.run(...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/maintenance - Delete maintenance ticket
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM maintenance_tickets WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
