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
  '회의/컨설팅': ['전체', '사내 회의', '고객사 미팅', '견적 사전 컨설팅', '기술 제안 미팅', '설계 컨설팅']
};

const CATEGORIES = ['전체', 'IPT', '네트워크', '시공현장', '회의/컨설팅'];

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedWorkSubCategory, setSelectedWorkSubCategory] = useState('전체');

  // Dynamic Year & Month State (Default: 2026년 8월)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [selectedDay, setSelectedDay] = useState(19);
  const [filterBySelectedDayOnly, setFilterBySelectedDayOnly] = useState(false);

  // Read-only detail view drawer
  const [viewEvent, setViewEvent] = useState(null);

  // Fetch aggregated schedules directly from Backend `/api/schedule` endpoint
  useEffect(() => {
    fetchSchedulesFromAPI();
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

  // Format holiday name to break lines cleanly: "대체공휴일 (부처님오신날)" -> "대체공휴일\n(부처님오신날)"
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
        if (KOREAN_HOLIDAYS_2026[targetDateStr]) return false; // Exclude official holidays!
      }
      return true;
    }
    return false;
  };

  // Calculate Calendar Grid properties for currentYear, currentMonth
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const selectedDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const filteredEvents = events.filter(e => {
    const categoryMatch = selectedCategory === '전체' || e.type === selectedCategory;
    const subCategoryMatch = selectedWorkSubCategory === '전체' || e.workType === selectedWorkSubCategory;
    
    // Check if event falls into the currently displayed month
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const inCurrentMonth = (e.date && e.date.startsWith(currentMonthPrefix)) || 
      (e.startDate && e.startDate.slice(0, 7) <= currentMonthPrefix && currentMonthPrefix <= (e.endDate || e.startDate).slice(0, 7));

    const dayMatch = filterBySelectedDayOnly ? isEventOnDate(e, selectedDateStr) : inCurrentMonth;
    return categoryMatch && subCategoryMatch && dayMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">📅 전사 통합 일정 관리 (SQLite DB 실시간 집계)</h1>
          <p className="portal-subtitle">IPT, 네트워크, 시공현장, 회의/컨설팅 DB 테이블 통합 쿼리 집계 캘린더</p>
        </div>
        <div style={{ background: 'rgba(0,180,216,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.3)', fontSize: '0.82rem', color: '#00B4D8', fontWeight: 600 }}>
          🔒 읽기 전용 캘린더 (SQLite DB 실시간 쿼리 연동)
        </div>
      </header>

      {/* 1차 일정 구분 Filter Tabs Bar */}
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

        <button
          onClick={() => setFilterBySelectedDayOnly(!filterBySelectedDayOnly)}
          className={`btn ${filterBySelectedDayOnly ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          {filterBySelectedDayOnly ? `📌 ${currentMonth}월 ${selectedDay}일 일정만 보기 (ON)` : `📅 ${currentYear}년 ${currentMonth}월 전체 일정 보기`}
        </button>
      </div>

      {/* 2차 작업 구분 Sub-Filter Bar */}
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
                  {(viewEvent.workers || [viewEvent.assignee]).map((w, i) => (
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => setViewEvent(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout: Calendar Grid + Schedule List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Dynamic Month Interactive Calendar Panel */}
        <div className="panel" style={{ minWidth: '300px' }}>
          
          {/* Dynamic Month Navigation Controls */}
          <div className="panel-header" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                ◀
              </button>
              <h2 className="panel-title" style={{ fontSize: '1.25rem', color: '#fff', minWidth: '130px', textAlign: 'center' }}>
                {currentYear}년 {currentMonth}월
              </h2>
              <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                ▶
              </button>
            </div>

            <button
              onClick={handleGoToday}
              className="btn btn-accent"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
            >
              오늘 (8/19)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <div style={{ color: '#E63946', fontWeight: 700, paddingBottom: '0.4rem' }}>일</div>
            <div style={{ fontWeight: 700, paddingBottom: '0.4rem' }}>월</div>
            <div style={{ fontWeight: 700, paddingBottom: '0.4rem' }}>화</div>
            <div style={{ fontWeight: 700, paddingBottom: '0.4rem' }}>수</div>
            <div style={{ fontWeight: 700, paddingBottom: '0.4rem' }}>목</div>
            <div style={{ fontWeight: 700, paddingBottom: '0.4rem' }}>금</div>
            <div style={{ color: '#00B4D8', fontWeight: 700, paddingBottom: '0.4rem' }}>토</div>

            {/* Empty padding cells before Day 1 */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ padding: '0.6rem 0.2rem', opacity: 0.15 }} />
            ))}

            {/* Dynamic Days 1 to daysInMonth */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${day < 10 ? '0' + day : day}`;
              const dayEvents = events.filter(e => isEventOnDate(e, dateStr));
              const holidayName = KOREAN_HOLIDAYS_2026[dateStr];
              const isSelected = selectedDay === day;

              const dateObj = new Date(dateStr);
              const isSunday = dateObj.getDay() === 0;
              const isSaturday = dateObj.getDay() === 6;

              let textColor = '#fff';
              if (isSelected) {
                textColor = '#000';
              } else if (holidayName || isSunday) {
                textColor = '#E63946';
              } else if (isSaturday) {
                textColor = '#00B4D8';
              }

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setFilterBySelectedDayOnly(true);
                  }}
                  style={{
                    padding: '0.45rem 0.1rem',
                    borderRadius: '8px',
                    backgroundColor: isSelected 
                      ? 'var(--color-accent)' 
                      : holidayName 
                      ? 'rgba(230,57,70,0.14)' 
                      : dayEvents.length > 0 
                      ? 'rgba(255,255,255,0.08)' 
                      : 'rgba(0,0,0,0.2)',
                    color: textColor,
                    fontWeight: isSelected || holidayName ? 700 : 500,
                    border: isSelected 
                      ? '2px solid #fff' 
                      : holidayName 
                      ? '1px solid rgba(230,57,70,0.6)' 
                      : dayEvents.length > 0 
                      ? '1px solid rgba(0,180,216,0.4)' 
                      : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>{day}</span>

                  {/* Holiday Badge */}
                  {holidayName && (
                    <span style={{
                      fontSize: '0.62rem',
                      color: isSelected ? '#000' : '#E63946',
                      fontWeight: 700,
                      marginTop: '3px',
                      whiteSpace: 'pre-line',
                      textAlign: 'center',
                      lineHeight: '1.15',
                      wordBreak: 'keep-all'
                    }}>
                      {formatHolidayName(holidayName)}
                    </span>
                  )}

                  {/* Event Dots */}
                  {dayEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: 'auto', marginBottom: '2px' }}>
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#000' : (e.color || '#00B4D8')
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#aaa', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>🔴 SQLite DB 실시간 쿼리 연동 완료</span>
            <span>선택일: <strong>{currentMonth}월 {selectedDay}일</strong></span>
          </div>
        </div>

        {/* Schedule List Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">📌 {currentYear}년 {currentMonth}월 일정 목록 (DB 실시간)</h2>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.2rem' }}>
                {filterBySelectedDayOnly ? `${currentMonth}월 ${selectedDay}일 일정` : selectedCategory !== '전체' ? `[${selectedCategory}] ${selectedWorkSubCategory !== '전체' ? '> ' + selectedWorkSubCategory : ''} 일정` : `${currentYear}년 ${currentMonth}월 전체 일정`} ({filteredEvents.length}건)
              </div>
            </div>
            {filterBySelectedDayOnly && (
              <button
                onClick={() => setFilterBySelectedDayOnly(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                월 전체보기 ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((evt) => (
                <div key={evt.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: `4px solid ${evt.color || '#00B4D8'}`,
                  padding: '1.2rem',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setViewEvent(evt)}>
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: `${evt.color || '#00B4D8'}25`,
                        color: evt.color || '#00B4D8',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: `1px solid ${evt.color || '#00B4D8'}60`
                      }}>
                        {evt.type}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>▶</span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {evt.workType || evt.type}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginLeft: '0.4rem' }}>
                        {evt.periodText ? `📅 ${evt.periodText}` : `${evt.date} (${evt.time})`}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.3rem', color: '#fff' }}>
                      {evt.title}
                    </h3>

                    <div style={{ fontSize: '0.82rem', color: '#aaa', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <span>📍 고객사(사이트명): <strong style={{ color: '#fff' }}>{evt.location}</strong></span>
                      <span>
                        👷 작업자: {evt.workers && evt.workers.length > 0 ? (
                          evt.workers.map((w, i) => (
                            <span key={i} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.2rem', fontWeight: 600 }}>
                              {w}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#fff' }}>{evt.assignee}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      onClick={() => setViewEvent(evt)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                    >
                      🔍 상세
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ fontSize: '0.95rem' }}>{currentYear}년 {currentMonth}월에 해당하는 등록된 일정이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
