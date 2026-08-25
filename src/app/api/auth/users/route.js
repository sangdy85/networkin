import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/auth/users - Fetch all user accounts
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();
    const users = rows.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      password: r.password,
      isFirstLogin: Boolean(r.is_first_login),
      department: r.department || '',
      rank: r.rank || '',
      duty: r.duty || '',
      hireDate: r.hire_date || '',
      task: r.task || '',
      phone: r.phone || '',
      mobile: r.mobile || '',
      fax: r.fax || '',
      address: r.address || ''
    }));

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth/users - Create new user account
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, role, password, department, rank, duty, hireDate, task, phone, mobile, fax, address } = body;

    if (!id || !id.trim()) {
      return NextResponse.json({ error: '아이디를 입력해 주세요.' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(id) = LOWER(?)').get(id.trim());
    if (existing) {
      return NextResponse.json({ error: `이미 존재하는 아이디 [${id.trim()}] 입니다.` }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO users (id, name, role, password, is_first_login, department, rank, duty, hire_date, task, phone, mobile, fax, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id.trim(),
      (name && name.trim()) || id.trim(),
      role || '일반',
      password || '1234',
      1,
      department || '네트워크사업부',
      rank || '과장',
      duty || '사원',
      hireDate || '',
      task || '',
      phone || '',
      mobile || '',
      fax || '',
      address || ''
    );

    return NextResponse.json({ success: true, id: id.trim() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/auth/users - Update account info / password / role
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, role, password, isFirstLogin, department, rank, duty, hireDate, task, phone, mobile, fax, address } = body;

    if (!id) return NextResponse.json({ error: 'Missing account ID' }, { status: 400 });

    const existing = db.prepare('SELECT * FROM users WHERE LOWER(id) = LOWER(?)').get(id);
    if (!existing) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const stmt = db.prepare(`
      UPDATE users
      SET name = ?, role = ?, password = ?, is_first_login = ?, department = ?, rank = ?, duty = ?, hire_date = ?, task = ?, phone = ?, mobile = ?, fax = ?, address = ?
      WHERE LOWER(id) = LOWER(?)
    `);

    stmt.run(
      name !== undefined ? name : existing.name,
      role !== undefined ? role : existing.role,
      password !== undefined ? password : existing.password,
      isFirstLogin !== undefined ? (isFirstLogin ? 1 : 0) : existing.is_first_login,
      department !== undefined ? department : existing.department,
      rank !== undefined ? rank : existing.rank,
      duty !== undefined ? duty : existing.duty,
      hireDate !== undefined ? hireDate : existing.hire_date,
      task !== undefined ? task : existing.task,
      phone !== undefined ? phone : existing.phone,
      mobile !== undefined ? mobile : existing.mobile,
      fax !== undefined ? fax : existing.fax,
      address !== undefined ? address : existing.address,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/auth/users - Delete account
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing account ID' }, { status: 400 });
    if (id.toLowerCase() === 'netadmin') {
      return NextResponse.json({ error: 'netadmin 마스터 계정은 삭제할 수 없습니다.' }, { status: 400 });
    }

    db.prepare('DELETE FROM users WHERE LOWER(id) = LOWER(?)').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
