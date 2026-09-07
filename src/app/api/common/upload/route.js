import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const timeStamp = Date.now();
    const sanitized = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.가-힣-]/g, '');
    const safeName = `${timeStamp}_${sanitized || 'file'}`;
    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    return NextResponse.json({ success: true, fileName: file.name, filePath: `/uploads/attachments/${safeName}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
