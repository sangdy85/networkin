'use client';

import { useState, useEffect } from 'react';

// Korean Statutory National Holidays & Substitute Holidays (2026년 관공서 공휴일 및 대체공휴일)
const KOREAN_HOLIDAYS_2026 = {
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일 (삼일절)',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일 (부처님오신날)',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일 (광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일 (개천절)',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절'
};

const WORK_SUB_CATEGORIES = {
  'IPT': ['전체', '작업', '정기점검', '유지보수', '장애처리', '구축', '기타'],
  '네트워크': ['전체', '작업', '정기점검', '유지보수', '장애처리', '구축', '기타'],
  '시공현장': ['전체', '배선 공사', '배관/입선 작업', '구축', '현장 실사 및 실측', '공사'],
  '회의/컨설팅': ['전체', '사내 회의', '고객사 미팅', '견적 사전 컨설팅', '기술 제안 미팅', '설계 컨설팅'],
  '유지보수': ['전체', '네트워크 장애', 'IPT 전화 장애', '서버/UTM 점검', '정기 점검', '기타 긴급 조치']
};

const CATEGORIES = ['전체', 'IPT', '네트워크', '시공현장', '회의/컨설팅', '유지보수'];

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedWorkSubCategory, setSelectedWorkSubCategory] = useState('전체');
  const [selectedUserFilter, setSelectedUserFilter] = useState('전체');

  // Dynamic Year & Month State (Default: 2026년 8월)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [selectedDay, setSelectedDay] = useState(19);
  const [filterBySelectedDayOnly, setFilterBySelectedDayOnly] = useState(false);

  // Read-only detail view drawer
  const [viewEvent, setViewEvent] = useState(null);

  // Fetch aggregated schedules & registered DB users
  useEffect(() => {
    fetchSchedulesFromAPI();
    fetchUsersFromAPI();
  }, []);

  const fetchSchedulesFromAPI = async () => {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
        return;
      }
    } catch (e) {
      console.warn('Schedule API connection fallback');
    }
  };

  const fetchUsersFromAPI = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setRegisteredUsers(data || []);
      }
    } catch (e) {
      console.warn('Fetch users error in schedule page', e);
    }
  };

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8);
    setSelectedDay(19);
    setFilterBySelectedDayOnly(false);
  };

  // Format holiday name
  const formatHolidayName = (name) => {
    if (!name) return '';
    return name.replace(' (', '\n(');
  };

  // Helper to check if event occurs on targetDateStr with Weekends/Holidays Filtering
  const isEventOnDate = (evt, targetDateStr) => {
    const start = evt.startDate || evt.date;
    const end = evt.endDate || evt.startDate || evt.date;

    if (!start) return false;
    if (evt.date === targetDateStr && !evt.endDate) return true;

    if (start <= targetDateStr && targetDateStr <= end) {
      if (evt.includeWeekends === false) {
        const d = new Date(targetDateStr);
        const dayOfWeek = d.getDay(); // 0: Sun, 6: Sat
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;
        if (KOREAN_HOLIDAYS_2026[targetDateStr]) return false;
      }
      return true;
    }
    return false;
  };

  // Calculate Calendar Grid properties
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const selectedDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const filteredEvents = events.filter(e => {
    const categoryMatch = selectedCategory === '전체' || e.type === selectedCategory;
    const subCategoryMatch = selectedWorkSubCategory === '전체' || e.workType === selectedWorkSubCategory;
    
    // User / Assignee Matching
    const userMatch = selectedUserFilter === '전체' || (
      (e.assignee && e.assignee.includes(selectedUserFilter)) ||
      (Array.isArray(e.workers) && e.workers.some(w => w.includes(selectedUserFilter)))
    );

    // Check if event falls into the currently displayed month
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const inCurrentMonth = (e.date && e.date.startsWith(currentMonthPrefix)) || 
      (e.startDate && e.startDate.slice(0, 7) <= currentMonthPrefix && currentMonthPrefix <= (e.endDate || e.startDate).slice(0, 7));

    const dayMatch = filterBySelectedDayOnly ? isEventOnDate(e, selectedDateStr) : inCurrentMonth;
    return categoryMatch && subCategoryMatch && userMatch && dayMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">📅 전사 통합 일정 관리 (SQLite DB 실시간 집계)</h1>
          <p className="portal-subtitle">IPT, 네트워크, 시공현장, 회의/컨설팅, 유지보수 DB 통합 실시간 집계 캘린더</p>
        </div>
        <div style={{ background: 'rgba(0,180,216,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.3)', fontSize: '0.82rem', color: '#00B4D8', fontWeight: 600 }}>
          🔒 통합 집계 캘린더 (실시간 DB 연동)
        </div>
      </header>

      {/* Category Tabs & User Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const count = cat === '전체' ? events.length : events.filter(e => e.type === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedWorkSubCategory('전체');
                }}
                className={`btn ${selectedCategory === cat ? 'btn-accent' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', fontWeight: 600 }}
              >
                {cat} {count > 0 && <span style={{ opacity: 0.8, fontSize: '0.78rem' }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* User Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600 }}>👤 담당자/작업자 필터:</span>
            <select
              value={selectedUserFilter}
              onChange={e => setSelectedUserFilter(e.target.value)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: 'var(--bg-main)',
                border: '1px solid var(--color-accent)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <option value="전체">전체 회원 (전체 일정)</option>
              {registeredUsers.map(u => (
                <option key={u.id} value={u.name}>
                  👤 {u.name} {u.rank || u.duty || ''} ({u.department || '네트워크사업부'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilterBySelectedDayOnly(!filterBySelectedDayOnly)}
            className={`btn ${filterBySelectedDayOnly ? 'btn-accent' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            {filterBySelectedDayOnly ? `📌 ${currentMonth}월 ${selectedDay}일 일정만 (ON)` : `📅 ${currentYear}년 ${currentMonth}월 전체 일정`}
          </button>
        </div>
      </div>

      {/* 2차 세부 작업 구분 Sub-Filter Bar */}
      {selectedCategory !== '전체' && WORK_SUB_CATEGORIES[selectedCategory] && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>↳ [{selectedCategory}] 세부 작업 구분:</span>
          {WORK_SUB_CATEGORIES[selectedCategory].map((subCat) => (
            <button
              key={subCat}
              onClick={() => setSelectedWorkSubCategory(subCat)}
              className={`btn ${selectedWorkSubCategory === subCat ? 'btn-accent' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {subCat}
            </button>
          ))}
        </div>
      )}

      {/* Detail Viewer Drawer (Read-Only) */}
      {viewEvent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: viewEvent.color, fontWeight: 700 }}>[{viewEvent.type}] {viewEvent.workType}</span>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff', marginTop: '0.2rem' }}>{viewEvent.title}</h2>
              </div>
              <button onClick={() => setViewEvent(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>일시:</span> <strong>{viewEvent.periodText || `${viewEvent.date} (${viewEvent.time})`}</strong></div>
                <div><span style={{ color: '#aaa' }}>고객사 (사이트명):</span> <strong>{viewEvent.location}</strong></div>
                <div><span style={{ color: '#aaa' }}>주말/공휴일 반영:</span> <strong>{viewEvent.includeWeekends ? '포함' : '미포함 (평일만)'}</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👷 투입 작업자 / 참석자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(viewEvent.workers && viewEvent.workers.length > 0 ? viewEvent.workers : [viewEvent.assignee]).map((w, i) => (
                    <span key={i} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {w}
                    </span>
                  ))}
                </div>
              </div>

              {viewEvent.memo && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 상세 내용:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewEvent.memo}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => setViewEvent(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Header with Navigation */}
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              📅 {currentYear}년 {currentMonth}월
            </h2>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}>◀ 이전달</button>
              <button onClick={handleGoToday} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}>오늘 (2026.08)</button>
              <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}>다음달 ▶</button>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span style={{ color: '#E63946' }}>🔴 공휴일</span>
            <span>🔵 토요일</span>
            <span>⚪ 평일</span>
          </div>
        </div>
      </div>

      {/* Month Calendar Grid View */}
      {!filterBySelectedDayOnly && (
        <div className="panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            
            {/* Day Header Row */}
            {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => (
              <div
                key={dayName}
                style={{
                  background: 'var(--bg-main)',
                  padding: '0.6rem 0.4rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: idx === 0 ? '#E63946' : idx === 6 ? '#3B82F6' : 'var(--color-text-muted)'
                }}
              >
                {dayName}
              </div>
            ))}

            {/* Blank Boxes before day 1 */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} style={{ background: 'var(--bg-card)', minHeight: '95px', opacity: 0.3 }} />
            ))}

            {/* Month Day Boxes */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayOfWeek = new Date(currentYear, currentMonth - 1, dayNum).getDay();
              const holidayName = KOREAN_HOLIDAYS_2026[dateStr];
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              const dayEvents = events.filter(e => isEventOnDate(e, dateStr) && (selectedCategory === '전체' || e.type === selectedCategory) && (selectedUserFilter === '전체' || (e.assignee && e.assignee.includes(selectedUserFilter)) || (Array.isArray(e.workers) && e.workers.some(w => w.includes(selectedUserFilter)))));
              const isSelected = selectedDay === dayNum;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  style={{
                    background: isSelected ? 'rgba(0,180,216,0.1)' : 'var(--bg-card)',
                    minHeight: '105px',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--color-accent)' : 'none',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: holidayName || isSunday ? '#E63946' : isSaturday ? '#3B82F6' : '#fff'
                    }}>
                      {dayNum}
                    </span>
                    {holidayName && (
                      <span style={{ fontSize: '0.68rem', color: '#E63946', fontWeight: 700, textAlign: 'right', whiteSpace: 'pre-line', lineHeight: '1.1' }}>
                        {formatHolidayName(holidayName)}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.3rem', overflow: 'hidden' }}>
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => { e.stopPropagation(); setViewEvent(evt); }}
                        style={{
                          background: evt.color || 'var(--color-accent)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500
                        }}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                        + {dayEvents.length - 3}건 더보기
                      </span>
                    )}
                  </div>

                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* Selected Day Agenda List */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            📋 {currentYear}년 {currentMonth}월 {selectedDay}일 상세 일정 및 작업 목록 ({filteredEvents.filter(e => isEventOnDate(e, selectedDateStr)).length}건)
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            선택한 날짜: <strong style={{ color: '#fff' }}>{selectedDateStr}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredEvents.filter(e => isEventOnDate(e, selectedDateStr)).length > 0 ? (
            filteredEvents.filter(e => isEventOnDate(e, selectedDateStr)).map((evt) => (
              <div
                key={evt.id}
                onClick={() => setViewEvent(evt)}
                style={{
                  background: 'var(--bg-main)',
                  border: `1px solid ${evt.color || 'var(--border-color)'}`,
                  borderLeft: `5px solid ${evt.color || 'var(--color-accent)'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className="badge" style={{ background: evt.color || 'var(--color-primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                      {evt.type}
                    </span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-accent)', fontSize: '0.75rem' }}>
                      {evt.workType}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                      {evt.title}
                    </h3>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#8D99AE', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>📍 장소: <strong style={{ color: '#fff' }}>{evt.location}</strong></span>
                    <span>⏰ 시간: {evt.time}</span>
                    <span>📅 기간: {evt.periodText}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {(evt.workers && evt.workers.length > 0 ? evt.workers : [evt.assignee]).map((w, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        👤 {w}
                      </span>
                    ))}
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                    🔍 상세
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#8D99AE', background: 'var(--bg-main)', borderRadius: '8px' }}>
              {selectedDateStr} 날짜에 배정된 일정이나 작업이 없습니다.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
