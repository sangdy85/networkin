import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/schedule - Aggregate schedules directly from SQLite DB
export async function GET() {
  try {
    let aggregated = [];

    // 1. IPT Items
    const iptRows = db.prepare('SELECT * FROM ipt_items').all();
    iptRows.forEach(item => {
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
        assignee: JSON.parse(item.workers || '[]')[0] || '담당자',
        workers: JSON.parse(item.workers || '[]'),
        color: '#3B82F6',
        periodText: item.start_date === item.end_date ? `${item.start_date} (${item.start_time || '09:00'} ~ ${item.end_time || '18:00'})` : `${item.start_date} ~ ${item.end_date} (${Boolean(item.include_weekends) ? '주말/공휴일 포함' : '평일만'})`,
        memo: item.content
      });
    });

    // 2. Network Items
    const netRows = db.prepare('SELECT * FROM network_items').all();
    netRows.forEach(item => {
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
        assignee: JSON.parse(item.workers || '[]')[0] || '담당자',
        workers: JSON.parse(item.workers || '[]'),
        color: '#00B4D8',
        periodText: item.start_date === item.end_date ? `${item.start_date} (${item.start_time || '09:00'} ~ ${item.end_time || '18:00'})` : `${item.start_date} ~ ${item.end_date} (${Boolean(item.include_weekends) ? '주말/공휴일 포함' : '평일만'})`,
        memo: item.content
      });
    });

    // 3. Projects
    const projRows = db.prepare('SELECT * FROM projects').all();
    projRows.forEach(proj => {
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
        assignee: proj.pm,
        workers: JSON.parse(proj.workers || '[]'),
        color: '#535C91',
        periodText: `${proj.start_date} ~ ${proj.end_date} (${Boolean(proj.include_weekends) ? '주말/공휴일 포함' : '평일만'})`,
        memo: proj.memo
      });
    });

    // 4. Meetings
    const mtgRows = db.prepare('SELECT * FROM meeting_items').all();
    mtgRows.forEach(mtg => {
      aggregated.push({
        id: `MTG-${mtg.id}`,
        date: mtg.date,
        startDate: mtg.date,
        endDate: mtg.date,
        includeWeekends: true,
        time: mtg.time || '14:00 - 16:00',
        title: `[${mtg.primary_category}] ${mtg.title}`,
        type: '회의/컨설팅',
        workType: mtg.sub_category,
        location: mtg.site,
        assignee: JSON.parse(mtg.attendees || '[]')[0] || '참석자',
        workers: JSON.parse(mtg.attendees || '[]'),
        color: '#38B000',
        periodText: `${mtg.date} (${mtg.time || '14:00 - 16:00'})`,
        memo: mtg.content
      });
    });

    return NextResponse.json(aggregated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
