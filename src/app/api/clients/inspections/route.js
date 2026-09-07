import db from '@/lib/db';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// GET /api/clients/inspections?clientId=X
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId가 필요합니다.' }, { status: 400 });
    }

    const templates = db.prepare('SELECT * FROM client_inspection_templates WHERE client_id = ? ORDER BY id DESC').all(clientId);
    const scans = db.prepare('SELECT * FROM client_inspection_scans WHERE client_id = ? ORDER BY inspection_date DESC, id DESC').all(clientId);

    return NextResponse.json({
      templates: templates.map(t => ({
        ...t,
        fileName: t.file_name,
        filePath: t.file_path,
        fileSize: t.file_size,
        isPrimary: t.is_primary === 1,
        uploadedBy: t.uploaded_by,
        createdAt: t.created_at
      })),
      scans: scans.map(s => ({
        ...s,
        inspectionDate: s.inspection_date,
        fileName: s.file_name,
        filePath: s.file_path,
        fileSize: s.file_size,
        uploadedBy: s.uploaded_by,
        createdAt: s.created_at
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients/inspections
export async function POST(req) {
  try {
    const body = await req.json();
    const { type, clientId, title, fileName, filePath, fileSize, version, uploadedBy, inspectionDate, inspector, memo } = body;

    if (!clientId || !type || !filePath) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    if (type === 'template') {
      // Set previous templates to is_primary = 0
      db.prepare('UPDATE client_inspection_templates SET is_primary = 0 WHERE client_id = ?').run(clientId);

      const stmt = db.prepare(`
        INSERT INTO client_inspection_templates (client_id, title, file_name, file_path, file_size, version, is_primary, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `);

      const info = stmt.run(
        clientId,
        title || '정기점검 서식 양식',
        fileName || 'inspection_template.pdf',
        filePath,
        fileSize || '0 KB',
        version || `v${Date.now().toString().slice(-4)}`,
        uploadedBy || '담당자'
      );

      return NextResponse.json({ success: true, id: info.lastInsertRowid });
    } else if (type === 'scan') {
      const stmt = db.prepare(`
        INSERT INTO client_inspection_scans (client_id, inspection_date, inspector, title, file_name, file_path, file_size, memo, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const info = stmt.run(
        clientId,
        inspectionDate || new Date().toISOString().split('T')[0],
        inspector || uploadedBy || '점검 엔지니어',
        title || `${inspectionDate || ''} 정기점검 결과 보고서`,
        fileName || 'scan_report.pdf',
        filePath,
        fileSize || '0 KB',
        memo || '',
        uploadedBy || '담당자'
      );

      return NextResponse.json({ success: true, id: info.lastInsertRowid });
    } else {
      return NextResponse.json({ error: '잘못된 type 값입니다.' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/inspections?type=template|scan&id=X
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'type과 id가 필요합니다.' }, { status: 400 });
    }

    const table = type === 'template' ? 'client_inspection_templates' : 'client_inspection_scans';
    const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);

    if (item && item.file_path && item.file_path.startsWith('/uploads/client_inspections/')) {
      const diskPath = path.join(process.cwd(), 'public', item.file_path);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn('Failed to delete file from disk:', e.message);
        }
      }
    }

    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);

    // If deleting template and it was primary, set the most recent remaining template as primary
    if (type === 'template' && item && item.is_primary === 1) {
      const newest = db.prepare('SELECT id FROM client_inspection_templates WHERE client_id = ? ORDER BY id DESC LIMIT 1').get(item.client_id);
      if (newest) {
        db.prepare('UPDATE client_inspection_templates SET is_primary = 1 WHERE id = ?').run(newest.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
