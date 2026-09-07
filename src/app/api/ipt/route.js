import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/ipt - Fetch all IPT work items
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM ipt_items ORDER BY created_at DESC').all();
    const items = rows.map(r => {
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
        ...r,
        workType: r.work_type,
        customWorkType: r.custom_work_type,
        startDate: r.start_date,
        startTime: r.start_time,
        endDate: r.end_date,
        endTime: r.end_time,
        includeWeekends: Boolean(r.include_weekends),
        workers: JSON.parse(r.workers || '[]').filter(w => !String(w || '').includes('마스터') && String(w || '').toLowerCase() !== 'netadmin'),
        fileName: r.file_name || (files.length > 0 ? files[0].fileName : null),
        filePath: r.file_path || (files.length > 0 ? files[0].filePath : null),
        files
      };
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ipt - Create new IPT work item
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, workType, customWorkType, title, startDate, startTime, endDate, endTime, includeWeekends, site, workers, content, status, fileName, filePath, files } = body;

    let savedFilePath = filePath || null;
    let savedFileName = fileName || null;
    if (Array.isArray(files) && files.length > 0) {
      savedFilePath = JSON.stringify(files);
      savedFileName = files.map(f => f.fileName).join(', ');
    }

    const cleanWorkers = (workers || []).filter(w => !String(w || '').includes('마스터') && String(w || '').toLowerCase() !== 'netadmin');

    const stmt = db.prepare(`
      INSERT INTO ipt_items (id, work_type, custom_work_type, title, start_date, start_time, end_date, end_time, include_weekends, site, workers, content, status, file_name, file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(cleanWorkers),
      content || '',
      status || '진행중',
      savedFileName,
      savedFilePath
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
    const { id, workType, customWorkType, title, startDate, startTime, endDate, endTime, includeWeekends, site, workers, content, status, fileName, filePath, files } = body;

    let savedFilePath = filePath;
    let savedFileName = fileName;
    if (Array.isArray(files)) {
      savedFilePath = files.length > 0 ? JSON.stringify(files) : null;
      savedFileName = files.length > 0 ? files.map(f => f.fileName).join(', ') : null;
    }

    const cleanWorkers = (workers || []).filter(w => !String(w || '').includes('마스터') && String(w || '').toLowerCase() !== 'netadmin');

    let sql = `
      UPDATE ipt_items
      SET work_type = ?, custom_work_type = ?, title = ?, start_date = ?, start_time = ?, end_date = ?, end_time = ?, include_weekends = ?, site = ?, workers = ?, content = ?, status = ?
    `;
    const params = [
      workType,
      customWorkType || '',
      title,
      startDate,
      startTime,
      endDate,
      endTime,
      includeWeekends ? 1 : 0,
      site,
      JSON.stringify(cleanWorkers),
      content || '',
      status || '진행중'
    ];

    if (savedFilePath !== undefined) {
      sql += `, file_name = ?, file_path = ?`;
      params.push(savedFileName, savedFilePath);
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
