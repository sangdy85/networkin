import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/clients/history?clientId=...&clientName=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const clientNameParam = (searchParams.get('clientName') || '').trim();

    if (!clientIdParam && !clientNameParam) {
      return NextResponse.json([]);
    }

    // Look up client info to perform comprehensive multi-angle matching
    let client = null;
    if (clientIdParam) {
      client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientIdParam);
    }
    if (!client && clientNameParam) {
      client = db.prepare('SELECT * FROM clients WHERE name = ? OR name LIKE ?').get(clientNameParam, `%${clientNameParam}%`);
    }

    const clientId = client?.id || (clientIdParam ? Number(clientIdParam) : null);
    const clientName = client?.name || clientNameParam;
    const clientCode = client?.code || '';

    // Extract core keywords from client name for fuzzy matching (excluding generic tags like (주))
    const cleanName = clientName.replace(/\([^)]*\)/g, '').trim();
    const nameTokens = cleanName.split(/\s+/).filter(t => t.length >= 2);

    let history = [];

    // Helper for matching site / title to this client
    const matchesClient = (siteStr, titleStr, targetClientId) => {
      if (clientId && targetClientId && Number(targetClientId) === Number(clientId)) {
        return true;
      }
      const site = (siteStr || '').trim().toLowerCase();
      const title = (titleStr || '').trim().toLowerCase();
      const cName = clientName.toLowerCase();
      const cClean = cleanName.toLowerCase();

      if (site && (site.includes(cName) || cName.includes(site) || site.includes(cClean) || cClean.includes(site))) {
        return true;
      }
      if (title && (title.includes(cName) || title.includes(cClean))) {
        return true;
      }
      if (clientCode && (site.includes(clientCode.toLowerCase()) || title.includes(clientCode.toLowerCase()))) {
        return true;
      }
      for (const token of nameTokens) {
        const t = token.toLowerCase();
        if (t.length >= 2 && (site.includes(t) || title.includes(t))) {
          return true;
        }
      }
      return false;
    };

    // 1. Network Items
    try {
      const netRows = db.prepare(`
        SELECT * FROM network_items 
        WHERE (id NOT LIKE 'NET-MNT-%' AND (content IS NULL OR content NOT LIKE '[장애처리 연동 티켓%'))
        ORDER BY start_date DESC
      `).all();

      netRows.filter(n => matchesClient(n.site, n.title, n.client_id)).forEach(n => {
        let workersArr = [];
        try { workersArr = JSON.parse(n.workers || '[]'); } catch (e) { workersArr = n.workers ? [n.workers] : []; }
        workersArr = workersArr.filter(w => !String(w || '').includes('마스터') && String(w || '').toLowerCase() !== 'netadmin');
        let filesArr = [];
        if (n.file_path) {
          try {
            if (n.file_path.startsWith('[')) filesArr = JSON.parse(n.file_path);
            else if (n.file_name) filesArr = [{ fileName: n.file_name, filePath: n.file_path }];
          } catch (e) {
            if (n.file_name) filesArr = [{ fileName: n.file_name, filePath: n.file_path }];
          }
        }

        const period = (n.start_date === (n.end_date || n.start_date))
          ? `${n.start_date} (${n.start_time || '09:00'} ~ ${n.end_time || '18:00'})`
          : `${n.start_date} ~ ${n.end_date || n.start_date} (${n.start_time || '09:00'} ~ ${n.end_time || '18:00'})`;

        const displayWorkType = n.work_type === '기타' ? (n.custom_work_type || '기타작업') : n.work_type;

        history.push({
          id: `NET-${n.id}`,
          rawId: n.id,
          type: 'network',
          category: '네트워크 관리',
          workType: n.work_type,
          customWorkType: n.custom_work_type,
          displayWorkType: displayWorkType,
          date: n.start_date,
          startDate: n.start_date,
          startTime: n.start_time || '09:00',
          endDate: n.end_date || n.start_date,
          endTime: n.end_time || '18:00',
          periodText: period,
          includeWeekends: Boolean(n.include_weekends),
          weekendsText: Boolean(n.include_weekends) ? '주말/공휴일 포함' : '평일만',
          site: n.site,
          title: `[${displayWorkType}] ${n.title}`,
          rawTitle: n.title,
          status: n.status || '진행중',
          workers: workersArr,
          content: n.content || n.site,
          badgeColor: '#00B4D8',
          fileName: n.file_name,
          filePath: n.file_path,
          files: filesArr
        });
      });
    } catch (e) {
      console.warn('History network error:', e);
    }

    // 2. IPT Items
    try {
      const iptRows = db.prepare(`
        SELECT * FROM ipt_items 
        WHERE (id NOT LIKE 'IPT-MNT-%' AND (content IS NULL OR content NOT LIKE '[장애처리 연동 티켓%'))
        ORDER BY start_date DESC
      `).all();

      iptRows.filter(i => matchesClient(i.site, i.title, i.client_id)).forEach(i => {
        let workersArr = [];
        try { workersArr = JSON.parse(i.workers || '[]'); } catch (e) { workersArr = i.workers ? [i.workers] : []; }
        workersArr = workersArr.filter(w => !String(w || '').includes('마스터') && String(w || '').toLowerCase() !== 'netadmin');
        let filesArr = [];
        if (i.file_path) {
          try {
            if (i.file_path.startsWith('[')) filesArr = JSON.parse(i.file_path);
            else if (i.file_name) filesArr = [{ fileName: i.file_name, filePath: i.file_path }];
          } catch (e) {
            if (i.file_name) filesArr = [{ fileName: i.file_name, filePath: i.file_path }];
          }
        }

        const period = (i.start_date === (i.end_date || i.start_date))
          ? `${i.start_date} (${i.start_time || '09:00'} ~ ${i.end_time || '18:00'})`
          : `${i.start_date} ~ ${i.end_date || i.start_date} (${i.start_time || '09:00'} ~ ${i.end_time || '18:00'})`;

        const displayWorkType = i.work_type === '기타' ? (i.custom_work_type || '기타작업') : i.work_type;

        history.push({
          id: `IPT-${i.id}`,
          rawId: i.id,
          type: 'ipt',
          category: 'IPT (인터넷전화)',
          workType: i.work_type,
          customWorkType: i.custom_work_type,
          displayWorkType: displayWorkType,
          date: i.start_date,
          startDate: i.start_date,
          startTime: i.start_time || '09:00',
          endDate: i.end_date || i.start_date,
          endTime: i.end_time || '18:00',
          periodText: period,
          includeWeekends: Boolean(i.include_weekends),
          weekendsText: Boolean(i.include_weekends) ? '주말/공휴일 포함' : '평일만',
          site: i.site,
          title: `[${displayWorkType}] ${i.title}`,
          rawTitle: i.title,
          status: i.status || '진행중',
          workers: workersArr,
          content: i.content || i.site,
          badgeColor: '#3B82F6',
          fileName: i.file_name,
          filePath: i.file_path,
          files: filesArr
        });
      });
    } catch (e) {
      console.warn('History ipt error:', e);
    }

    // 3. Maintenance Tickets
    try {
      const maintRows = db.prepare('SELECT * FROM maintenance_tickets ORDER BY date DESC').all();
      maintRows.filter(m => matchesClient(m.site, m.title, null)).forEach(m => {
        let workersArr = [];
        try { workersArr = JSON.parse(m.workers || '[]'); } catch (e) { workersArr = m.workers ? [m.workers] : []; }
        workersArr = workersArr.filter(w => !String(w || '').includes('마스터') && String(w || '').toLowerCase() !== 'netadmin');
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
          rawId: m.ticket_no || m.id,
          type: 'maintenance',
          category: '유지보수/장애',
          workType: m.category || '장애',
          displayWorkType: m.category || '장애',
          date: m.date,
          startDate: m.date,
          periodText: m.date,
          site: m.site,
          title: `[${m.priority || '보통'}] ${m.title}`,
          rawTitle: m.title,
          status: m.status,
          workers: workersArr,
          content: m.resolution_note || m.site,
          badgeColor: m.priority === '긴급' ? '#E63946' : '#FF9F1C',
          fileName: m.file_name,
          filePath: m.file_path,
          files: filesArr
        });
      });
    } catch (e) {
      console.warn('History maint error:', e);
    }

    // 4. Projects
    try {
      const projRows = db.prepare('SELECT * FROM projects ORDER BY start_date DESC').all();
      projRows.filter(p => matchesClient(p.client, p.name, null)).forEach(p => {
        let workersArr = [];
        try { workersArr = JSON.parse(p.workers || '[]'); } catch (e) { workersArr = p.workers ? [p.workers] : []; }
        if (p.pm && !workersArr.includes(p.pm)) workersArr.unshift(p.pm);
        history.push({
          id: `PROJ-${p.id}`,
          rawId: `PRJ-${p.id}`,
          type: 'project',
          date: p.start_date || '2026-08-19',
          startDate: p.start_date || '2026-08-19',
          endDate: p.end_date || p.start_date || '2026-08-19',
          periodText: p.period || `${p.start_date} ~ ${p.end_date}`,
          site: p.client,
          category: '시공 현장',
          workType: p.type || '시공',
          displayWorkType: p.type || '시공',
          title: `[공정률 ${p.progress}%] ${p.name}`,
          rawTitle: p.name,
          status: p.status || '시공중',
          workers: workersArr,
          content: p.memo || p.client,
          badgeColor: '#535C91'
        });
      });
    } catch (e) {
      console.warn('History proj error:', e);
    }

    // 5. Meetings
    try {
      const mtgRows = db.prepare('SELECT * FROM meeting_items ORDER BY date DESC').all();
      mtgRows.filter(m => matchesClient(m.site, m.title, null)).forEach(m => {
        let attendeesArr = [];
        try { attendeesArr = JSON.parse(m.attendees || '[]'); } catch (e) { attendeesArr = m.attendees ? [m.attendees] : []; }
        history.push({
          id: `MTG-${m.id}`,
          rawId: m.id,
          type: 'meeting',
          date: m.date,
          startDate: m.date,
          periodText: `${m.date} ${m.time || ''}`.trim(),
          site: m.site,
          category: '회의/컨설팅',
          workType: m.sub_category || m.primary_category,
          displayWorkType: m.sub_category || m.primary_category,
          title: `[${m.primary_category}] ${m.title}`,
          rawTitle: m.title,
          status: '완료',
          workers: attendeesArr,
          content: m.content || m.site,
          badgeColor: '#38B000'
        });
      });
    } catch (e) {
      console.warn('History meeting error:', e);
    }

    // Sort history by date descending
    history.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
