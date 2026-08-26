import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/schedule - Aggregate schedules directly from SQLite DB
export async function GET() {
  try {
    let aggregated = [];

    // 1. IPT Items
    const iptRows = db.prepare('SELECT * FROM ipt_items').all();
    iptRows.forEach(item => {
      let workersArr = [];
      try {
        workersArr = typeof item.workers === 'string' ? JSON.parse(item.workers) : (Array.isArray(item.workers) ? item.workers : []);
      } catch (e) {
        workersArr = item.workers ? [item.workers] : [];
      }
      const displayWorkType = item.work_type === '기타' ? (item.custom_work_type || '기타작업') : item.work_type;
      aggregated.push({
        id: `IPT-${item.id}`,
        date: item.start_date,
        startDate: item.start_date,
        endDate: item.end_date || item.start_date,
        includeWeekends: Boolean(item.include_weekends),
        time: `${item.start_time || '09:00'} - ${item.end_time || '18:00'}`,
        title: `[IPT] ${item.title}`,
        type: 'IPT',
        workType: displayWorkType,
        location: item.site,
        assignee: workersArr[0] || '담당자',
        workers: workersArr,
        color: '#3B82F6',
        periodText: item.start_date === item.end_date ? `${item.start_date} (${item.start_time || '09:00'} ~ ${item.end_time || '18:00'})` : `${item.start_date} ~ ${item.end_date} (${Boolean(item.include_weekends) ? '주말/공휴일 포함' : '평일만'})`,
        memo: item.content
      });
    });

    // 2. Network Items
    const netRows = db.prepare('SELECT * FROM network_items').all();
    netRows.forEach(item => {
      let workersArr = [];
      try {
        workersArr = typeof item.workers === 'string' ? JSON.parse(item.workers) : (Array.isArray(item.workers) ? item.workers : []);
      } catch (e) {
        workersArr = item.workers ? [item.workers] : [];
      }
      const displayWorkType = item.work_type === '기타' ? (item.custom_work_type || '기타작업') : item.work_type;
      aggregated.push({
        id: `NET-${item.id}`,
        date: item.start_date,
        startDate: item.start_date,
        endDate: item.end_date || item.start_date,
        includeWeekends: Boolean(item.include_weekends),
        time: `${item.start_time || '09:00'} - ${item.end_time || '18:00'}`,
        title: `[네트워크] ${item.title}`,
        type: '네트워크',
        workType: displayWorkType,
        location: item.site,
        assignee: workersArr[0] || '담당자',
        workers: workersArr,
        color: '#00B4D8',
        periodText: item.start_date === item.end_date ? `${item.start_date} (${item.start_time || '09:00'} ~ ${item.end_time || '18:00'})` : `${item.start_date} ~ ${item.end_date} (${Boolean(item.include_weekends) ? '주말/공휴일 포함' : '평일만'})`,
        memo: item.content
      });
    });

    // 3. Projects
    const projRows = db.prepare('SELECT * FROM projects').all();
    projRows.forEach(proj => {
      let workersArr = [];
      try {
        workersArr = typeof proj.workers === 'string' ? JSON.parse(proj.workers) : (Array.isArray(proj.workers) ? proj.workers : []);
      } catch (e) {
        workersArr = proj.workers ? [proj.workers] : [];
      }
      if (proj.pm && !workersArr.includes(proj.pm)) {
        workersArr.unshift(proj.pm);
      }
      aggregated.push({
        id: `PROJ-${proj.id}`,
        date: proj.start_date || '2026-08-19',
        startDate: proj.start_date || '2026-08-19',
        endDate: proj.end_date || proj.start_date || '2026-08-28',
        includeWeekends: Boolean(proj.include_weekends),
        time: '전일 공사 (09:00 - 18:00)',
        title: `[시공현장] ${proj.name} (${proj.progress}%)`,
        type: '시공현장',
        workType: proj.type === '인프라구축' ? '배선 공사' : '구축',
        location: proj.client,
        assignee: proj.pm || workersArr[0] || 'PM',
        workers: workersArr,
        color: '#535C91',
        periodText: `${proj.start_date} ~ ${proj.end_date} (${Boolean(proj.include_weekends) ? '주말/공휴일 포함' : '평일만'})`,
        memo: proj.memo
      });
    });

    // 4. Meetings
    const mtgRows = db.prepare('SELECT * FROM meeting_items').all();
    mtgRows.forEach(mtg => {
      let attendeesArr = [];
      try {
        attendeesArr = typeof mtg.attendees === 'string' ? JSON.parse(mtg.attendees) : (Array.isArray(mtg.attendees) ? mtg.attendees : []);
      } catch (e) {
        attendeesArr = mtg.attendees ? [mtg.attendees] : [];
      }
      aggregated.push({
        id: `MTG-${mtg.id}`,
        date: mtg.date,
        startDate: mtg.date,
        endDate: mtg.date,
        includeWeekends: true,
        time: mtg.time || '14:00 - 16:00',
        title: `[${mtg.primary_category || '회의'}] ${mtg.title}`,
        type: '회의/컨설팅',
        workType: mtg.sub_category || '회의',
        location: mtg.site,
        assignee: attendeesArr[0] || '참석자',
        workers: attendeesArr,
        color: '#38B000',
        periodText: `${mtg.date} (${mtg.time || '14:00 - 16:00'})`,
        memo: mtg.content
      });
    });

    // 5. Maintenance Tickets (장애/유지보수 티켓)
    const maintRows = db.prepare('SELECT * FROM maintenance_tickets').all();
    maintRows.forEach(m => {
      let workersArr = [];
      try {
        workersArr = typeof m.workers === 'string' ? JSON.parse(m.workers) : (Array.isArray(m.workers) ? m.workers : []);
      } catch (e) {
        workersArr = m.workers ? [m.workers] : [];
      }
      aggregated.push({
        id: `MAINT-${m.id}`,
        date: m.date,
        startDate: m.date,
        endDate: m.date,
        includeWeekends: true,
        time: '유지보수/장애처리',
        title: `[유지보수] [${m.priority || '보통'}] ${m.site} - ${m.title}`,
        type: '유지보수',
        workType: m.category || '장애처리',
        location: m.site,
        assignee: workersArr[0] || '작업자',
        workers: workersArr,
        color: m.priority === '긴급' ? '#E63946' : '#FF9F1C',
        periodText: `${m.date} (${m.status})`,
        memo: `[상태: ${m.status}] ${m.resolution_note || ''}`
      });
    });

    return NextResponse.json(aggregated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
