import db from '@/lib/db';
import { NextResponse } from 'next/server';

// Helper to sync to IPT or Network items
function syncToTarget(target, tId, tNo, category, title, date, site, workers, resolutionNote, status) {
  const safeDate = date || new Date().toISOString().split('T')[0];
  const safeContent = `[장애처리 연동 티켓 ${tNo}]\n${resolutionNote || ''}`.trim();
  const safeStatus = status === '처리완료' ? '완료' : '진행중';

  if (target === 'ipt') {
    try {
      const stmt = db.prepare(`
        INSERT INTO ipt_items (id, work_type, custom_work_type, title, start_date, start_time, end_date, end_time, include_weekends, site, workers, content, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          work_type = excluded.work_type,
          custom_work_type = excluded.custom_work_type,
          title = excluded.title,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          site = excluded.site,
          workers = excluded.workers,
          content = excluded.content,
          status = excluded.status
      `);
      stmt.run(
        `IPT-${tId}`,
        '장애',
        category || 'IPT 전화 장애',
        title,
        safeDate,
        '09:00',
        safeDate,
        '18:00',
        0,
        site,
        JSON.stringify(workers || []),
        safeContent,
        safeStatus
      );
    } catch (e) {
      console.error('Sync to IPT error:', e);
    }
  } else if (target === 'network') {
    try {
      const stmt = db.prepare(`
        INSERT INTO network_items (id, work_type, custom_work_type, title, start_date, start_time, end_date, end_time, include_weekends, site, workers, content, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          work_type = excluded.work_type,
          custom_work_type = excluded.custom_work_type,
          title = excluded.title,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          site = excluded.site,
          workers = excluded.workers,
          content = excluded.content,
          status = excluded.status
      `);
      stmt.run(
        `NET-${tId}`,
        '장애',
        category || '네트워크 장애',
        title,
        safeDate,
        '09:00',
        safeDate,
        '18:00',
        0,
        site,
        JSON.stringify(workers || []),
        safeContent,
        safeStatus
      );
    } catch (e) {
      console.error('Sync to Network error:', e);
    }
  }
}

// GET /api/maintenance - Fetch all maintenance tickets
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM maintenance_tickets ORDER BY created_at DESC').all();
    const tickets = rows.map(r => {
      let files = [];
      if (r.file_path) {
        try {
          if (r.file_path.startsWith('[')) {
            files = JSON.parse(r.file_path);
          } else if (r.file_name) {
            files = [{ fileName: r.file_name, filePath: r.file_path }];
          }
        } catch (e) {
          if (r.file_name) files = [{ fileName: r.file_name, filePath: r.file_path }];
        }
      }
      return {
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
        fileName: r.file_name || (files.length > 0 ? files[0].fileName : null),
        filePath: r.file_path || (files.length > 0 ? files[0].filePath : null),
        files: files
      };
    });

    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/maintenance - Create new maintenance ticket
export async function POST(req) {
  try {
    const body = await req.json();
    const { ticketNo, site, title, category, priority, status, workers, resolutionNote, date, fileName, filePath, files, syncTarget } = body;

    if (!title || !site) {
      return NextResponse.json({ error: '사이트명과 접수 제목을 입력해 주세요.' }, { status: 400 });
    }

    const tId = `MNT-${Date.now()}`;
    const tNo = ticketNo || `TKT-2026-${Date.now().toString().slice(-4)}`;

    let savedFilePath = filePath || null;
    let savedFileName = fileName || null;

    if (Array.isArray(files) && files.length > 0) {
      savedFilePath = JSON.stringify(files);
      savedFileName = files.map(f => f.fileName).join(', ');
    }

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
      savedFileName,
      savedFilePath
    );

    // Auto-sync to IPT or Network if requested
    if (syncTarget && syncTarget !== 'none') {
      syncToTarget(syncTarget, tId, tNo, category, title, date, site, workers, resolutionNote, status);
    }

    return NextResponse.json({ success: true, id: tId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/maintenance - Update maintenance ticket
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ticketNo, site, title, category, priority, status, workers, resolutionNote, date, fileName, filePath, files, syncTarget } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    let savedFilePath = filePath;
    let savedFileName = fileName;

    if (Array.isArray(files)) {
      savedFilePath = files.length > 0 ? JSON.stringify(files) : null;
      savedFileName = files.length > 0 ? files.map(f => f.fileName).join(', ') : null;
    }

    let sql = `
      UPDATE maintenance_tickets
      SET ticket_no = COALESCE(?, ticket_no), site = ?, title = ?, category = ?, priority = ?, status = ?, workers = ?, resolution_note = ?, date = ?
    `;
    const params = [ticketNo || null, site, title, category, priority, status, JSON.stringify(workers || []), resolutionNote || '', date];
    
    if (savedFilePath !== undefined) {
      sql += `, file_name = ?, file_path = ?`;
      params.push(savedFileName, savedFilePath);
    }
    
    sql += ` WHERE id = ?`;
    params.push(id);

    const stmt = db.prepare(sql);
    stmt.run(...params);

    // Auto-sync to IPT or Network if requested
    if (syncTarget && syncTarget !== 'none') {
      syncToTarget(syncTarget, id, ticketNo || id, category, title, date, site, workers, resolutionNote, status);
    }

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

    // Also remove any linked items in ipt_items or network_items
    try {
      db.prepare('DELETE FROM ipt_items WHERE id = ?').run(`IPT-${id}`);
      db.prepare('DELETE FROM network_items WHERE id = ?').run(`NET-${id}`);
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
