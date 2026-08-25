import net from 'net';
import tls from 'tls';
import { simpleParser } from 'mailparser';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

function fetchPop3RawEmails({ host, port, user, pass }) {
  return new Promise((resolve, reject) => {
    const portNum = Number(port) || 110;
    const isSsl = portNum === 995;

    const socket = isSsl
      ? tls.connect({ host, port: portNum, rejectUnauthorized: false, timeout: 10000 })
      : net.connect({ host, port: portNum, timeout: 10000 });

    let buffer = '';
    let step = 'GREETING';
    const messages = [];
    let maxMsgIdx = 0;
    let currentMsgIdx = 1;
    let readingMsg = false;

    socket.setEncoding('utf8');

    const send = (cmd) => {
      socket.write(cmd + '\r\n');
    };

    socket.on('connect', () => {});

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('POP3 메일 서버 응답 시간 초과 (Timeout)'));
    });

    socket.on('data', (chunk) => {
      buffer += chunk;
      processBuffer();
    });

    socket.on('end', () => {
      resolve(messages);
    });

    function processBuffer() {
      while (true) {
        if (readingMsg) {
          const endIdx = buffer.indexOf('\r\n.\r\n');
          if (endIdx !== -1) {
            const msgRaw = buffer.slice(0, endIdx);
            buffer = buffer.slice(endIdx + 5);
            messages.push(msgRaw);
            readingMsg = false;

            currentMsgIdx++;
            if (currentMsgIdx <= maxMsgIdx) {
              fetchNextMsg();
            } else {
              send('QUIT');
              socket.end();
            }
          } else {
            break;
          }
        } else {
          const lineIdx = buffer.indexOf('\r\n');
          if (lineIdx === -1) break;

          const line = buffer.slice(0, lineIdx);
          buffer = buffer.slice(lineIdx + 2);

          if (!line.startsWith('+OK')) {
            socket.destroy();
            return reject(new Error(`POP3 메일 서버 오류: ${line}`));
          }

          if (step === 'GREETING') {
            step = 'USER';
            send(`USER ${user}`);
          } else if (step === 'USER') {
            step = 'PASS';
            send(`PASS ${pass}`);
          } else if (step === 'PASS') {
            step = 'STAT';
            send('STAT');
          } else if (step === 'STAT') {
            const parts = line.split(' ');
            const totalMsgs = parseInt(parts[1] || '0', 10);
            if (totalMsgs === 0) {
              send('QUIT');
              socket.end();
            } else {
              step = 'RETR';
              maxMsgIdx = totalMsgs;
              currentMsgIdx = Math.max(1, totalMsgs - 49); // fetch up to 50 latest emails
              fetchNextMsg();
            }
          } else if (step === 'RETR') {
            readingMsg = true;
          }
        }
      }
    }

    function fetchNextMsg() {
      socket.write(`RETR ${currentMsgIdx}\r\n`);
    }
  });
}

// POST /api/mail/fetch - Sync and fetch emails from external POP3 mail server
export async function POST(req) {
  try {
    const body = await req.json();
    const { host, port, user, pass } = body;

    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'POP3 메일 서버 호스트, 아이디, 비밀번호를 설정해 주세요.' }, { status: 400 });
    }

    const rawMsgs = await fetchPop3RawEmails({ host, port, user, pass });
    const fetchedMails = [];

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO mails (id, sender, sender_email, recipient, subject, snippet, content, date, folder, unread, is_external, has_attachment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < rawMsgs.length; i++) {
      try {
        const parsed = await simpleParser(rawMsgs[i]);
        const uniqueSeed = parsed.messageId || `${parsed.subject}_${parsed.date ? new Date(parsed.date).getTime() : i}`;
        const mailId = `EXT-${user}-${uniqueSeed.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const senderName = parsed.from?.text || parsed.from?.value?.[0]?.name || user;
        const senderEmail = parsed.from?.value?.[0]?.address || user;
        const subject = parsed.subject || '(제목 없음)';
        const content = parsed.text || parsed.html || '';
        const snippet = content.replace(/<[^>]+>/g, '').slice(0, 80);
        const dateStr = parsed.date ? new Date(parsed.date).toLocaleString() : new Date().toLocaleString();
        const hasAttachment = Boolean(parsed.attachments && parsed.attachments.length > 0);

        insertStmt.run(
          mailId,
          senderName,
          senderEmail,
          user,
          subject,
          snippet,
          content,
          dateStr,
          'inbox',
          1,
          1,
          hasAttachment ? 1 : 0
        );

        fetchedMails.push({
          id: mailId,
          sender: senderName,
          email: senderEmail,
          subject,
          snippet,
          content,
          date: dateStr,
          unread: true,
          isExternal: true,
          hasAttachment
        });
      } catch (parseErr) {
        console.error('Mail parse error:', parseErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: fetchedMails.length,
      mails: fetchedMails
    });
  } catch (error) {
    console.error('POP3 Sync Error:', error);
    return NextResponse.json({ error: `외부 메일 연동 실패: ${error.message}` }, { status: 500 });
  }
}
