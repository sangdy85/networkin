import nodemailer from 'nodemailer';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/mail/send - Send real external email via SMTP
export async function POST(req) {
  try {
    const body = await req.json();
    const { host, port, user, pass, to, subject, content } = body;

    if (!to || !subject || !content) {
      return NextResponse.json({ error: '수신자, 제목, 내용을 모두 입력해 주세요.' }, { status: 400 });
    }

    let isSentLocallyOnly = false;
    let smtpErrorMsg = '';

    if (host && user && pass) {
      const portNum = Number(port) || 587;
      const isSecure = portNum === 465;

      const transporter = nodemailer.createTransport({
        host,
        port: portNum,
        secure: isSecure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        }
      });

      try {
        await transporter.sendMail({
          from: user,
          to,
          subject,
          text: content,
          html: content.replace(/\n/g, '<br/>')
        });
      } catch (smtpErr) {
        console.error('SMTP Send Error:', smtpErr);
        smtpErrorMsg = smtpErr.message;
        isSentLocallyOnly = true;
      }
    } else {
      isSentLocallyOnly = true;
    }

    // Save to sent folder in SQLite DB
    const mailId = `SENT-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO mails (id, sender, sender_email, recipient, subject, snippet, content, date, folder, unread, is_external, has_attachment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const senderDisplay = user || '사내 발신자';

    stmt.run(
      mailId,
      senderDisplay,
      user || '',
      to,
      subject,
      content.slice(0, 80),
      content,
      new Date().toLocaleString(),
      'sent',
      0,
      host ? 1 : 0,
      0
    );

    if (smtpErrorMsg) {
      return NextResponse.json({
        success: true,
        localOnly: true,
        message: `SMTP 메일 서버 연동 오류 (${smtpErrorMsg}). 사내 보낸메일함에 저장되었습니다.`
      });
    }

    return NextResponse.json({
      success: true,
      message: host ? '외부 메일 서버(SMTP)를 통해 성공적으로 발송되었습니다!' : '사내 보낸메일함에 저장되었습니다.'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
