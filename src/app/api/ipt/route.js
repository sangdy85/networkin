import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/ipt - Fetch all IPT work items
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM ipt_items ORDER BY created_at DESC').all();
    const items = rows.map(r => ({
      ...r,
      workType: r.work_type,
      customWorkType: r.custom_work_type,
      startDate: r.start_date,
      startTime: r.start_time,
      endDate: r.end_date,
      endTime: r.end_time,
      includeWeekends: Boolean(r.include_weekends),
      workers: JSON.parse(r.workers || '[]')
    }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ipt - Create new IPT work item
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, workType, customWorkType, title, startDate, startTime, endDate, endTime, includeWeekends, site, workers, content, status } = body;

    const stmt = db.prepare(`
      INSERT INTO ipt_items (id, work_type, custom_work_type, title, start_date, start_time, end_date, end_time, include_weekends, site, workers, content, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id || `IPT-2026-${String(Date.now()).slice(-4)}`,
      workType || '작업',
      customWorkType || '',
      title,
      startDate,
      startTime || '09:00',
      endDate || startDate,
      endTime || '18:00',
      includeWeekends ? 1 : 0,
      site,
      JSON.stringify(workers || []),
      content || '',
      status || '진행중'
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/ipt - Update IPT item
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, workType, customWorkType, title, startDate, startTime, endDate, endTime, includeWeekends, site, workers, content, status } = body;

    const stmt = db.prepare(`
      UPDATE ipt_items
      SET work_type = ?, custom_work_type = ?, title = ?, start_date = ?, start_time = ?, end_date = ?, end_time = ?, include_weekends = ?, site = ?, workers = ?, content = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
      workType,
      customWorkType || '',
      title,
      startDate,
      startTime,
      endDate,
      endTime,
      includeWeekends ? 1 : 0,
      site,
      JSON.stringify(workers || []),
      content || '',
      status || '진행중',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/ipt - Delete IPT item
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM ipt_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
