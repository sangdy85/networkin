import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/clients
export async function GET() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO clients (code, name, industry, contact_name, contact_phone, contact_email, address, contract_status, contract_date, assigned_pm, memo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run('CLI-2026-001', '(주)아인스텍 본사', 'IT/통신', '이강욱 팀장', '010-9876-5432', 'leekw@einstek.com', '충남 천안시 서북구 벤처로 10', '유지보수 계약중', '2026-01-01', '이강욱 팀장', '전사 통합 네트워크 및 IPT 유지보수');
      insert.run('CLI-2026-002', '삼성전자 천안사업장', '제조업', '김철수 과장', '010-2345-6789', 'cs.kim@samsung.com', '충남 천안시 서북구 성성동 123', '시공 진행중', '2026-03-15', '김철수 과장', '라인 구축 배선 및 IPT 공사 진행중');
      insert.run('CLI-2026-003', '현대자동차 물류센터', '물류/유통', '박민우 대리', '010-3456-7890', 'mw.park@hyundai.com', '충남 아산시 인주면 인주산단로 45', '유지보수 계약중', '2026-02-10', '박민우 대리', 'UTM 방화벽 및 AP 무선망 점검');
    }

    const rows = db.prepare('SELECT * FROM clients ORDER BY id DESC').all();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, industry, contact_name, contact_phone, contact_email, address, contract_status, contract_date, assigned_pm, memo } = body;

    if (!name) {
      return NextResponse.json({ error: '고객사명을 입력해주세요.' }, { status: 400 });
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const code = `CLI-2026-${String(count + 1).padStart(3, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO clients (code, name, industry, contact_name, contact_phone, contact_email, address, contract_status, contract_date, assigned_pm, memo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      code,
      name,
      industry || '제조업',
      contact_name || '',
      contact_phone || '',
      contact_email || '',
      address || '',
      contract_status || '유지보수 계약중',
      contract_date || new Date().toISOString().split('T')[0],
      assigned_pm || '',
      memo || ''
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid, code });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clients
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, industry, contact_name, contact_phone, contact_email, address, contract_status, contract_date, assigned_pm, memo } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID와 고객사명이 필요합니다.' }, { status: 400 });
    }

    const stmt = db.prepare(`
      UPDATE clients
      SET name = ?, industry = ?, contact_name = ?, contact_phone = ?, contact_email = ?, address = ?, contract_status = ?, contract_date = ?, assigned_pm = ?, memo = ?
      WHERE id = ?
    `);

    stmt.run(name, industry, contact_name, contact_phone, contact_email, address, contract_status, contract_date, assigned_pm, memo, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients?id=...
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
