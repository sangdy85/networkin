import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/clients/history?clientName=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('clientName') || '';

    if (!clientName.trim()) {
      return NextResponse.json([]);
    }

    const searchTerm = `%${clientName.trim()}%`;
    let history = [];

    // 1. Maintenance Tickets
    try {
      const maintRows = db.prepare('SELECT * FROM maintenance_tickets WHERE site LIKE ? OR title LIKE ?').all(searchTerm, searchTerm);
      maintRows.forEach(m => {
        let workersArr = [];
        try { workersArr = JSON.parse(m.workers || '[]'); } catch (e) { workersArr = m.workers ? [m.workers] : []; }
        let filesArr = [];
        if (m.file_path) {
          try {
            if (m.file_path.startsWith('[')) {
              filesArr = JSON.parse(m.file_path);
            } else if (m.file_name) {
              filesArr = [{ fileName: m.file_name, filePath: m.file_path }];
            }
          } catch (e) {
            if (m.file_name) filesArr = [{ fileName: m.file_name, filePath: m.file_path }];
          }
        }
        history.push({
          id: `MAINT-${m.id}`,
          date: m.date,
          category: '유지보수/장애',
          title: `[${m.priority || '보통'}] ${m.title}`,
          status: m.status,
          workers: workersArr,
          content: m.resolution_note || m.site,
          badgeColor: m.priority === '긴급' ? '#E63946' : '#FF9F1C',
          fileName: m.file_name,
          filePath: m.file_path,
          files: filesArr
        });
      });
    } catch (e) {}

    // 2. IPT Items
    try {
      const iptRows = db.prepare('SELECT * FROM ipt_items WHERE site LIKE ? OR title LIKE ?').all(searchTerm, searchTerm);
      iptRows.forEach(i => {
        let workersArr = [];
        try { workersArr = JSON.parse(i.workers || '[]'); } catch (e) { workersArr = i.workers ? [i.workers] : []; }
        history.push({
          id: `IPT-${i.id}`,
          date: i.start_date,
          category: 'IPT (인터넷전화)',
          title: `[${i.work_type}] ${i.title}`,
          status: '완료',
          workers: workersArr,
          content: i.content || i.site,
          badgeColor: '#3B82F6'
        });
      });
    } catch (e) {}

    // 3. Network Items
    try {
      const netRows = db.prepare('SELECT * FROM network_items WHERE site LIKE ? OR title LIKE ?').all(searchTerm, searchTerm);
      netRows.forEach(n => {
        let workersArr = [];
        try { workersArr = JSON.parse(n.workers || '[]'); } catch (e) { workersArr = n.workers ? [n.workers] : []; }
        history.push({
          id: `NET-${n.id}`,
          date: n.start_date,
          category: '네트워크 관리',
          title: `[${n.work_type}] ${n.title}`,
          status: '완료',
          workers: workersArr,
          content: n.content || n.site,
          badgeColor: '#00B4D8'
        });
      });
    } catch (e) {}

    // 4. Projects
    try {
      const projRows = db.prepare('SELECT * FROM projects WHERE client LIKE ? OR name LIKE ?').all(searchTerm, searchTerm);
      projRows.forEach(p => {
        let workersArr = [];
        try { workersArr = JSON.parse(p.workers || '[]'); } catch (e) { workersArr = p.workers ? [p.workers] : []; }
        if (p.pm && !workersArr.includes(p.pm)) workersArr.unshift(p.pm);
        history.push({
          id: `PROJ-${p.id}`,
          date: p.start_date || '2026-08-19',
          category: '시공 현장',
          title: `[공정률 ${p.progress}%] ${p.name}`,
          status: p.status || '시공중',
          workers: workersArr,
          content: p.memo || p.client,
          badgeColor: '#535C91'
        });
      });
    } catch (e) {}

    // 5. Meetings
    try {
      const mtgRows = db.prepare('SELECT * FROM meeting_items WHERE site LIKE ? OR title LIKE ?').all(searchTerm, searchTerm);
      mtgRows.forEach(m => {
        let attendeesArr = [];
        try { attendeesArr = JSON.parse(m.attendees || '[]'); } catch (e) { attendeesArr = m.attendees ? [m.attendees] : []; }
        history.push({
          id: `MTG-${m.id}`,
          date: m.date,
          category: '회의/컨설팅',
          title: `[${m.primary_category}] ${m.title}`,
          status: '완료',
          workers: attendeesArr,
          content: m.content || m.site,
          badgeColor: '#38B000'
        });
      });
    } catch (e) {}

    // Sort history by date descending
    history.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
