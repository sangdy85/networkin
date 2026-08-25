'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_TICKETS = [];

const COMPANY_WORKERS = ['이강욱 팀장', '김철수 과장', '박민우 대리', '최현우 과장'];

export default function MaintenancePage() {
  const { currentUser } = useAuth();

  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [activeTab, setActiveTab] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);

  // Form State
  const [formSite, setFormSite] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formIssue, setFormIssue] = useState('');
  const [formCategory, setFormCategory] = useState('네트워크 장애');
  const [formUrgency, setFormUrgency] = useState('긴급');
  const [formStatus, setFormStatus] = useState('접수');
  const [formWorkers, setFormWorkers] = useState(['최현우 과장']);
  const [formResolutionNote, setFormResolutionNote] = useState('');
  const [formDate, setFormDate] = useState('2026-08-19');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('networkin_maintenance');
    if (saved) {
      try { setTickets(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Sync Schedule Helper to register maintenance ticket in /schedule
  const syncToSchedule = (ticketData) => {
    try {
      const savedSchedules = localStorage.getItem('networkin_schedules_v3');
      let currentSchedules = savedSchedules ? JSON.parse(savedSchedules) : [];

      let primaryType = '네트워크';
      let workType = '장애처리';
      let color = '#E63946';

      if (ticketData.category.includes('IPT')) {
        primaryType = 'IPT';
        workType = ticketData.category.includes('장애') ? '장애처리' : '유지보수';
        color = ticketData.urgency === '긴급' ? '#D90429' : '#3B82F6';
      } else {
        primaryType = '네트워크';
        workType = ticketData.category.includes('장애') ? '장애처리' : '유지보수';
        color = ticketData.urgency === '긴급' ? '#E63946' : '#FFB703';
      }

      const scheduleId = `MAINT-SCHED-${ticketData.id}`;
      const newScheduleItem = {
        id: scheduleId,
        date: ticketData.date || '2026-08-19',
        time: '10:00 - 12:00',
        title: `[유지보수/장애] ${ticketData.title}`,
        type: primaryType,
        workType: workType,
        location: ticketData.site,
        assignee: ticketData.engineer,
        workers: ticketData.workers,
        color: color
      };

      const filtered = currentSchedules.filter(s => s.id !== scheduleId);
      const updatedSchedules = [newScheduleItem, ...filtered];
      localStorage.setItem('networkin_schedules_v3', JSON.stringify(updatedSchedules));
    } catch (err) {
      console.error('Schedule sync error:', err);
    }
  };

  const saveTickets = (newTickets) => {
    setTickets(newTickets);
    localStorage.setItem('networkin_maintenance', JSON.stringify(newTickets));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTicket(null);
    setFormSite('');
    setFormTitle('');
    setFormIssue('');
    setFormCategory('네트워크 장애');
    setFormUrgency('긴급');
    setFormStatus('접수');
    setFormWorkers([currentUser?.name || currentUser?.id || '최현우 과장']);
    setFormResolutionNote('');
    setFormDate('2026-08-19');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tck) => {
    setEditingTicket(tck);
    setFormSite(tck.site);
    setFormTitle(tck.title);
    setFormIssue(tck.issue);
    setFormCategory(tck.category);
    setFormUrgency(tck.urgency);
    setFormStatus(tck.status);
    setFormWorkers(tck.workers || [tck.engineer]);
    setFormResolutionNote(tck.resolutionNote || '');
    setFormDate(tck.date || '2026-08-19');
    setIsModalOpen(true);
  };

  // Toggle Worker
  const handleWorkerToggle = (wName) => {
    if (formWorkers.includes(wName)) {
      if (formWorkers.length === 1) return;
      setFormWorkers(formWorkers.filter(w => w !== wName));
    } else {
      setFormWorkers([...formWorkers, wName]);
    }
  };

  // Save Ticket with Schedule Auto Sync!
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formSite.trim() || !formTitle.trim()) {
      alert('사이트명과 장애 접수 제목을 입력해 주세요.');
      return;
    }

    let badgeClass = 'badge-active';
    if (formStatus === '처리완료') badgeClass = 'badge-complete';
    if (formUrgency === '긴급' && formStatus !== '처리완료') badgeClass = 'badge-urgent';

    const ticketData = {
      id: editingTicket ? editingTicket.id : `TCK-2026-${String(tickets.length + 82).padStart(3, '0')}`,
      site: formSite.trim(),
      title: formTitle.trim(),
      issue: formIssue.trim(),
      category: formCategory,
      urgency: formUrgency,
      status: formStatus,
      engineer: formWorkers[0] || '담당자',
      workers: formWorkers,
      date: formDate,
      time: editingTicket ? editingTicket.time : `${formDate} 10:15`,
      badgeClass,
      resolutionNote: formResolutionNote.trim()
    };

    if (editingTicket) {
      const updated = tickets.map(t => t.id === editingTicket.id ? ticketData : t);
      saveTickets(updated);
      syncToSchedule(ticketData);
      alert('장애 처리 티켓 정보가 수정되었으며, [일정 관리]에도 자동 동기화되었습니다.');
    } else {
      const updated = [ticketData, ...tickets];
      saveTickets(updated);
      syncToSchedule(ticketData);
      alert('긴급 장애/유지보수 티켓이 접수되었으며, [일정 관리] 캘린더에 자동 동기화되었습니다!');
    }

    setIsModalOpen(false);
  };

  // Delete Ticket
  const handleDeleteTicket = (id) => {
    if (confirm('이 유지보수/장애 티켓을 삭제하시겠습니까? (연동된 일정도 함께 정리됩니다)')) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);

      try {
        const savedSchedules = localStorage.getItem('networkin_schedules_v3');
        if (savedSchedules) {
          const currentSchedules = JSON.parse(savedSchedules);
          const filtered = currentSchedules.filter(s => s.id !== `MAINT-SCHED-${id}`);
          localStorage.setItem('networkin_schedules_v3', JSON.stringify(filtered));
        }
      } catch (err) {}
    }
  };

  // Filtering Logic
  const filteredTickets = tickets.filter(t => {
    const statusMatch = activeTab === 'all' 
      ? true 
      : activeTab === 'pending' 
      ? t.status !== '처리완료' 
      : t.status === activeTab;

    const urgencyMatch = urgencyFilter === 'all' || t.urgency === urgencyFilter;

    const searchMatch = !searchQuery.trim() ||
      t.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.engineer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && urgencyMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">🛠️ 유지보수 / 장애처리 센터</h1>
          <p className="portal-subtitle">장애 접수 시 [일정 관리] 캘린더 자동 동기화 및 24시간 현장 처리 지원</p>
        </div>
        <button className="btn btn-accent" onClick={handleOpenCreateModal}>⚡ 긴급 장애 / 유지보수 접수</button>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'all' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
            style={{ fontSize: '0.85rem' }}
          >
            전체 티켓 ({tickets.length})
          </button>
          <button 
            className={`btn ${activeTab === 'pending' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pending')}
            style={{ fontSize: '0.85rem' }}
          >
            ⚡ 처리 대기/진행 중 ({tickets.filter(t => t.status !== '처리완료').length})
          </button>
          <button 
            className={`btn ${activeTab === '처리완료' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveTab('처리완료')}
            style={{ fontSize: '0.85rem' }}
          >
            ✅ 완료된 장애 ({tickets.filter(t => t.status === '처리완료').length})
          </button>
        </div>

        {/* Urgency & Search */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
          >
            <option value="all">긴급도 전체</option>
            <option value="긴급">⚡ 긴급 (즉시 출동)</option>
            <option value="보통">● 보통</option>
            <option value="낮음">● 낮음</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="사이트명/티켓번호/엔지니어 검색..."
            style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem', width: '220px' }}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="panel-header">
              <h2 className="panel-title">{editingTicket ? '✏️ 장애 티켓 & 조치 상태 수정' : '⚡ 긴급 장애 / 유지보수 접수'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>사이트명 / 고객사 *</label>
                <input
                  type="text"
                  value={formSite}
                  onChange={(e) => setFormSite(e.target.value)}
                  placeholder="사이트명 / 고객사명을 입력하세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>접수 제목 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="장애 / 출동 접수 제목을 입력하세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>유지보수 구분</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    <option value="네트워크 장애">🚨 네트워크 장애</option>
                    <option value="IPT 장애">🚨 IPT 장애</option>
                    <option value="네트워크 유지보수">🛠️ 네트워크 유지보수</option>
                    <option value="IPT 유지보수">⚙️ IPT 유지보수</option>
                    <option value="H/W 및 주변기기 수리">🔧 H/W 및 주변기기 수리</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>긴급도</label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: formUrgency === '긴급' ? '#E63946' : 'white', fontWeight: 700 }}
                  >
                    <option value="긴급">⚡ 긴급 (즉시출동)</option>
                    <option value="보통">● 보통</option>
                    <option value="낮음">● 낮음</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>처리 상태</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                  >
                    <option value="접수">접수</option>
                    <option value="이동중">이동중</option>
                    <option value="처리중">처리중</option>
                    <option value="처리완료">처리완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>접수 날짜 (일정 자동 동기화 날짜)</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              {/* Workers Multi-Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.4rem' }}>👷 담당 엔지니어 및 출동자 배정</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {COMPANY_WORKERS.map(w => {
                    const isSelected = formWorkers.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleWorkerToggle(w)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(0,180,216,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#00B4D8' : '#aaa',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 400,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>장애 현상 및 점검 상세 내용</label>
                <textarea
                  rows={3}
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="현장 장애 현상이나 점검 상세 내용을 작성하세요..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>💡 조치 결과 및 완료 보고서 (처리완료 시)</label>
                <textarea
                  rows={3}
                  value={formResolutionNote}
                  onChange={(e) => setFormResolutionNote(e.target.value)}
                  placeholder="현장 조치 내용 및 부품 교체 내역 등 결과 작성..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.3)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingTicket ? '수정 완료' : '티켓 접수 (일정 자동연동)'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Drawer */}
      {viewTicket && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-card)' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.9rem' }}>{viewTicket.id}</span>
                  <span className={`badge ${viewTicket.badgeClass}`}>{viewTicket.status}</span>
                  <span style={{ fontSize: '0.78rem', color: viewTicket.urgency === '긴급' ? '#E63946' : '#FFB703', fontWeight: 700 }}>
                    ⚡ {viewTicket.urgency}
                  </span>
                </div>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff' }}>{viewTicket.title}</h2>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.3rem' }}>사이트명: <strong style={{ color: '#fff' }}>{viewTicket.site}</strong></div>
              </div>
              <button onClick={() => setViewTicket(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>유지보수 구분:</span> <strong>{viewTicket.category}</strong></div>
                <div><span style={{ color: '#aaa' }}>접수 일시:</span> <strong>{viewTicket.time}</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👷 담당 엔지니어 & 출동자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(viewTicket.workers || [viewTicket.engineer]).map((w, i) => (
                    <span key={i} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {w}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #E63946' }}>
                <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>🚨 장애 및 점검 상세 내용:</span>
                <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewTicket.issue}</p>
              </div>

              {viewTicket.resolutionNote && (
                <div style={{ background: 'rgba(56,176,0,0.08)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #38B000' }}>
                  <span style={{ fontSize: '0.8rem', color: '#38B000', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>✅ 조치 완료 보고서:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewTicket.resolutionNote}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewTicket); setViewTicket(null); }} className="btn btn-accent">✏️ 상태/조치사항 변경</button>
              <button onClick={() => setViewTicket(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">🚨 유지보수 & 장애 처리 티켓 현황</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredTickets.length}건의 티켓</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>티켓 번호</th>
              <th>사이트명</th>
              <th>장애 및 점검 상세 내용</th>
              <th>구분</th>
              <th>긴급도</th>
              <th>담당 엔지니어</th>
              <th>접수시간</th>
              <th>상태</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-accent)', cursor: 'pointer' }} onClick={() => setViewTicket(t)}>
                    {t.id}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{t.site}</td>
                  <td style={{ cursor: 'pointer' }} onClick={() => setViewTicket(t)}>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{t.issue}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {t.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.78rem',
                      color: t.urgency === '긴급' ? '#E63946' : t.urgency === '보통' ? '#FFB703' : '#aaa',
                      fontWeight: 700 
                    }}>
                      ● {t.urgency}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{t.engineer}</td>
                  <td style={{ fontSize: '0.78rem', color: '#aaa' }}>{t.time}</td>
                  <td><span className={`badge ${t.badgeClass}`}>{t.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => setViewTicket(t)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        🔍 상세
                      </button>
                      <button onClick={() => handleOpenEditModal(t)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        ✏️ 조치
                      </button>
                      <button onClick={() => handleDeleteTicket(t.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E63946' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  조건에 해당하는 유지보수/장애 처리 티켓이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
