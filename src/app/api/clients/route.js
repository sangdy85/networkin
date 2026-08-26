import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/clients
export async function GET() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO clients (code, name, industry, contact_name, contact_phone, contact_email, contacts, address, contract_status, contract_date, assigned_pm, engineer_primary, engineer_secondary, memo, network_config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const contacts1 = JSON.stringify([{ name: '이강욱 팀장', phone: '010-9876-5432', email: 'leekw@einstek.com', duty: '총괄' }]);
      const contacts2 = JSON.stringify([
        { name: '김철수 과장', phone: '010-2345-6789', email: 'cs.kim@samsung.com', duty: '네트워크 관리' },
        { name: '이영희 차장', phone: '010-9988-7766', email: 'yh.lee@samsung.com', duty: '인프라 구매' }
      ]);
      const contacts3 = JSON.stringify([{ name: '박민우 대리', phone: '010-3456-7890', email: 'mw.park@hyundai.com', duty: '전산 담당' }]);

      const config1 = JSON.stringify({
        isp: 'KT 전용회선 (1G)',
        ipSubnet: '211.234.100.0/24',
        gateway: '211.234.100.1',
        dnsPrimary: '168.126.63.1',
        dnsSecondary: '168.126.63.2',
        equipments: [
          { type: 'UTM 방화벽', model: 'FortiGate 100F', serial: 'FG100F-8821', location: '3층 서버실 랙 1' },
          { type: '백본 스위치', model: 'Cisco Catalyst 9300', serial: 'C9300-48P-01', location: '3층 서버실 랙 1' },
          { type: '무선 AP', model: 'Aruba AP-505', count: '12대', location: '각 층 전구역' }
        ],
        notes: '24시간 무정체 이중화 구성 적용 완료'
      });

      insert.run('CLI-2026-001', '(주)아인스텍 본사', 'IT/네트워크', '이강욱 팀장', '010-9876-5432', 'leekw@einstek.com', contacts1, '충남 천안시 서북구 벤처로 10', '유지보수 계약중', '2026-01-01', '이강욱 팀장', '이강욱 팀장', '최현우 과장', '전사 통합 네트워크 및 IPT 유지보수', config1);
      insert.run('CLI-2026-002', '삼성전자 천안사업장', '반도체 제조업', '김철수 과장', '010-2345-6789', 'cs.kim@samsung.com', contacts2, '충남 천안시 서북구 성성동 123', '프로젝트 진행중', '2026-03-15', '김철수 과장', '김철수 과장', '박민우 대리', '라인 구축 배선 및 IPT 공사 진행중', '');
      insert.run('CLI-2026-003', '현대자동차 물류센터', '물류/유통', '박민우 대리', '010-3456-7890', 'mw.park@hyundai.com', contacts3, '충남 아산시 인주면 인주산단로 45', '유지보수 계약중', '2026-02-10', '박민우 대리', '박민우 대리', '이강욱 팀장', 'UTM 방화벽 및 AP 무선망 점검', '');
    }

    // Auto-update legacy '시공 진행중' -> '프로젝트 진행중' if present
    db.prepare("UPDATE clients SET contract_status = '프로젝트 진행중' WHERE contract_status = '시공 진행중'").run();

    const rows = db.prepare('SELECT * FROM clients ORDER BY id DESC').all();
    
    // Parse contacts JSON & network_config JSON safely
    const formattedRows = rows.map(r => {
      let parsedContacts = [];
      try {
        parsedContacts = r.contacts ? JSON.parse(r.contacts) : [];
      } catch (e) {
        parsedContacts = [];
      }

      if (parsedContacts.length === 0 && (r.contact_name || r.contact_phone || r.contact_email)) {
        parsedContacts = [{
          name: r.contact_name || '',
          phone: r.contact_phone || '',
          email: r.contact_email || '',
          duty: '대표 담당자'
        }];
      }

      let parsedConfig = {};
      try {
        parsedConfig = r.network_config ? JSON.parse(r.network_config) : {};
      } catch (e) {
        parsedConfig = {};
      }

      return {
        ...r,
        contacts: parsedContacts,
        network_config: parsedConfig,
        engineer_primary: r.engineer_primary || r.assigned_pm || '',
        engineer_secondary: r.engineer_secondary || ''
      };
    });

    return NextResponse.json(formattedRows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, industry, contacts, address, contract_status, contract_date, engineer_primary, engineer_secondary, memo, network_config } = body;

    if (!name) {
      return NextResponse.json({ error: '고객사명을 입력해주세요.' }, { status: 400 });
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const code = `CLI-2026-${String(count + 1).padStart(3, '0')}`;

    const contactsJson = JSON.stringify(Array.isArray(contacts) ? contacts : []);
    const primaryContact = Array.isArray(contacts) && contacts.length > 0 ? contacts[0] : {};
    const configJson = typeof network_config === 'object' ? JSON.stringify(network_config) : (network_config || '');

    const stmt = db.prepare(`
      INSERT INTO clients (code, name, industry, contact_name, contact_phone, contact_email, contacts, address, contract_status, contract_date, assigned_pm, engineer_primary, engineer_secondary, memo, network_config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      code,
      name,
      industry || '',
      primaryContact.name || '',
      primaryContact.phone || '',
      primaryContact.email || '',
      contactsJson,
      address || '',
      contract_status || '유지보수 계약중',
      contract_date || new Date().toISOString().split('T')[0],
      engineer_primary || '',
      engineer_primary || '',
      engineer_secondary || '',
      memo || '',
      configJson
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
    const { id, name, industry, contacts, address, contract_status, contract_date, engineer_primary, engineer_secondary, memo, network_config } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID와 고객사명이 필요합니다.' }, { status: 400 });
    }

    const contactsJson = JSON.stringify(Array.isArray(contacts) ? contacts : []);
    const primaryContact = Array.isArray(contacts) && contacts.length > 0 ? contacts[0] : {};
    const configJson = typeof network_config === 'object' ? JSON.stringify(network_config) : (network_config || '');

    const stmt = db.prepare(`
      UPDATE clients
      SET name = ?, industry = ?, contact_name = ?, contact_phone = ?, contact_email = ?, contacts = ?, address = ?, contract_status = ?, contract_date = ?, assigned_pm = ?, engineer_primary = ?, engineer_secondary = ?, memo = ?, network_config = ?
      WHERE id = ?
    `);

    stmt.run(
      name,
      industry || '',
      primaryContact.name || '',
      primaryContact.phone || '',
      primaryContact.email || '',
      contactsJson,
      address || '',
      contract_status || '유지보수 계약중',
      contract_date || new Date().toISOString().split('T')[0],
      engineer_primary || '',
      engineer_primary || '',
      engineer_secondary || '',
      memo || '',
      configJson,
      id
    );

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
