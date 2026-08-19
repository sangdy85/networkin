import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/projects - Fetch all Projects
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    const items = rows.map(r => ({
      ...r,
      workers: JSON.parse(r.workers || '[]'),
      startDate: r.start_date,
      endDate: r.end_date,
      includeWeekends: Boolean(r.include_weekends),
      badgeClass: r.badge_class
    }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects - Create new Project
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, client, type, category, pm, workers, period, startDate, endDate, includeWeekends, progress, status, budget, badgeClass, memo } = body;

    const stmt = db.prepare(`
      INSERT INTO projects (name, client, type, category, pm, workers, period, start_date, end_date, include_weekends, progress, status, budget, badge_class, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      name,
      client,
      type || '인프라구축',
      category || type,
      pm,
      JSON.stringify(workers || [pm]),
      period || `${startDate} ~ ${endDate}`,
      startDate,
      endDate,
      includeWeekends ? 1 : 0,
      progress || 0,
      status || '시공중',
      budget || '미정',
      badgeClass || 'badge-active',
      memo || ''
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/projects - Update Project
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, client, type, category, pm, workers, period, startDate, endDate, includeWeekends, progress, status, budget, badgeClass, memo } = body;

    const stmt = db.prepare(`
      UPDATE projects
      SET name = ?, client = ?, type = ?, category = ?, pm = ?, workers = ?, period = ?, start_date = ?, end_date = ?, include_weekends = ?, progress = ?, status = ?, budget = ?, badge_class = ?, memo = ?
      WHERE id = ?
    `);

    stmt.run(
      name,
      client,
      type,
      category || type,
      pm,
      JSON.stringify(workers || [pm]),
      period || `${startDate} ~ ${endDate}`,
      startDate,
      endDate,
      includeWeekends ? 1 : 0,
      progress,
      status,
      budget,
      badgeClass || 'badge-active',
      memo || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/projects - Delete Project
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
