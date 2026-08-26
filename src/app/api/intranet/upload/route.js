import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'intranet');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate safe filename with timestamp
    const timeStamp = Date.now();
    const sanitizedOriginal = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const safeName = `${timeStamp}_${sanitizedOriginal || 'file.pdf'}`;
    const filePathOnDisk = path.join(uploadDir, safeName);

    fs.writeFileSync(filePathOnDisk, buffer);

    const publicUrl = `/uploads/intranet/${safeName}`;
    const fileSizeMB = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    return NextResponse.json({
      success: true,
      fileName: file.name,
      filePath: publicUrl,
      fileSize: fileSizeMB
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
