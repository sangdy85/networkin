import db from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/auth/login - Authenticate user against SQLite DB directly
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, password } = body;

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: '아이디를 입력해 주세요.' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: '비밀번호를 입력해 주세요.' }, { status: 400 });
    }

    const cleanId = userId.trim().toLowerCase();

    // Query SQLite DB directly
    const user = db.prepare('SELECT * FROM users WHERE LOWER(id) = ?').get(cleanId);

    if (!user) {
      return NextResponse.json({ error: '존재하지 않는 아이디입니다.' }, { status: 404 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const userData = {
      id: user.id,
      name: user.name,
      role: user.role,
      isFirstLogin: Boolean(user.is_first_login),
      department: user.department || '',
      rank: user.rank || '',
      duty: user.duty || '',
      hireDate: user.hire_date || '',
      task: user.task || '',
      phone: user.phone || '',
      mobile: user.mobile || '',
      fax: user.fax || '',
      address: user.address || ''
    };

    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
