'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_IPT_ITEMS = [];

const WORK_TYPES = ['작업', '정기점검', '유지보수', '장애처리', '구축', '기타'];
const COMPANY_WORKERS = ['이강욱 팀장', '김철수 과장', '박민우 대리', '최현우 과장'];

export default function IPTPage() {
  const { currentUser } = useAuth();

  const [items, setItems] = useState(INITIAL_IPT_ITEMS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Form State
  const [formWorkType, setFormWorkType] = useState('작업');
  const [formCustomWorkType, setFormCustomWorkType] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-08-19');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('2026-08-19');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formIncludeWeekends, setFormIncludeWeekends] = useState(false);
  const [formSite, setFormSite] = useState('');
  const [formWorkers, setFormWorkers] = useState(['박민우 대리']);
  const [formCustomWorker, setFormCustomWorker] = useState('');
  const [formContent, setFormContent] = useState('');

  // Fetch from Real Backend SQLite API `/api/ipt`
  useEffect(() => {
    fetchItemsFromAPI();
  }, []);

  const fetchItemsFromAPI = async () => {
    try {
      const res = await fetch('/api/ipt');
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
        return;
      }
    } catch (e) {
      console.warn('IPT API error', e);
    }
    setItems([]);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormWorkType('작업');
    setFormCustomWorkType('');
    setFormTitle('');
    setFormStartDate('2026-08-19');
    setFormStartTime('09:00');
    setFormEndDate('2026-08-19');
    setFormEndTime('18:00');
    setFormIncludeWeekends(false);
    setFormSite('');
    setFormWorkers([currentUser?.name || currentUser?.id || '박민우 대리']);
    setFormCustomWorker('');
    setFormContent('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormWorkType(item.workType);
    setFormCustomWorkType(item.customWorkType || '');
    setFormTitle(item.title);
    setFormStartDate(item.startDate);
    setFormStartTime(item.startTime || '09:00');
    setFormEndDate(item.endDate || item.startDate);
    setFormEndTime(item.endTime || '18:00');
    setFormIncludeWeekends(item.includeWeekends ?? false);
    setFormSite(item.site);
    setFormWorkers(item.workers || []);
    setFormCustomWorker('');
    setFormContent(item.content || '');
    setIsModalOpen(true);
  };

  // Toggle Worker selection
  const handleWorkerToggle = (wName) => {
    if (formWorkers.includes(wName)) {
      if (formWorkers.length === 1) return;
      setFormWorkers(formWorkers.filter(w => w !== wName));
    } else {
      setFormWorkers([...formWorkers, wName]);
    }
  };

  // Add External Worker
  const handleAddExternalWorker = () => {
    if (!formCustomWorker.trim()) return;
    if (formWorkers.includes(formCustomWorker.trim())) return;
    setFormWorkers([...formWorkers, formCustomWorker.trim()]);
    setFormCustomWorker('');
  };

  // Save Submit (API + Local Backup)
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSite.trim()) {
      alert('제목과 고객사명(사이트명)을 입력해 주세요.');
      return;
    }

    const itemData = {
      id: editingItem ? editingItem.id : `IPT-2026-${String(items.length + 10).padStart(3, '0')}`,
      workType: formWorkType,
      customWorkType: formWorkType === '기타' ? formCustomWorkType.trim() : '',
      title: formTitle.trim(),
      startDate: formStartDate,
      startTime: formStartTime,
      endDate: formEndDate,
      endTime: formEndTime,
      includeWeekends: formIncludeWeekends,
      site: formSite.trim(),
      workers: formWorkers,
      content: formContent.trim(),
      status: '진행중'
    };

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch('/api/ipt', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        await fetchItemsFromAPI();
        alert(editingItem ? 'IPT 작업 정보가 수정되었습니다.' : '신규 IPT 작업이 등록되었습니다.');
      }
    } catch (e) {
      console.error('Save error', e);
    }

    setIsModalOpen(false);
  };

  // Delete
  const handleDeleteItem = async (id) => {
    if (confirm('이 IPT 작업 항목을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/ipt?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchItemsFromAPI();
        }
      } catch (e) {
        console.error('Delete error', e);
      }
    }
  };

  // Filtered Items
  const filteredItems = items.filter(item => {
    const filterMatch = activeFilter === 'all' || item.workType === activeFilter;
    const searchMatch = !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return filterMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">📞 IPT 작업 & 장애관리 (DB 연동 완료)</h1>
          <p className="portal-subtitle">SQLite 데이터베이스 실시간 연동 및 [일정관리] 자동 연동</p>
        </div>
        <button className="btn btn-accent" onClick={handleOpenCreateModal}>+ IPT 작업 등록</button>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeFilter === 'all' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('all')}
            style={{ fontSize: '0.85rem' }}
          >
            전체 보기 ({items.length})
          </button>
          {WORK_TYPES.map((wt) => (
            <button
              key={wt}
              className={`btn ${activeFilter === wt ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => setActiveFilter(wt)}
              style={{ fontSize: '0.85rem' }}
            >
              {wt} ({items.filter(i => i.workType === wt).length})
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목/사이트명/관리코드 검색..."
          style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem', width: '220px' }}
        />
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '640px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="panel-header">
              <h2 className="panel-title">{editingItem ? '✏️ IPT 작업 수정' : '➕ IPT 작업 등록'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* 작업 구분 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  작업 구분 *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: formWorkType === '기타' ? '0.5rem' : '0' }}>
                  {WORK_TYPES.map((wt) => (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => setFormWorkType(wt)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        border: formWorkType === wt ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                        background: formWorkType === wt ? 'rgba(0,180,216,0.2)' : 'rgba(255,255,255,0.05)',
                        color: formWorkType === wt ? '#00B4D8' : '#aaa',
                        fontWeight: formWorkType === wt ? 700 : 400,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {wt}
                    </button>
                  ))}
                </div>

                {formWorkType === '기타' && (
                  <input
                    type="text"
                    value={formCustomWorkType}
                    onChange={(e) => setFormCustomWorkType(e.target.value)}
                    placeholder="기타 세부 작업 내용을 직접 작성해 주세요..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>작업 제목 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="작업 제목을 입력해 주세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사명 (사이트명) *</label>
                <input
                  type="text"
                  value={formSite}
                  onChange={(e) => setFormSite(e.target.value)}
                  placeholder="고객사명 / 사이트명을 입력하세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              {/* Date & Time Controls */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>시작일 *</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>시작 시간 *</label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>종료일 *</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>종료 시간 *</label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', background: 'rgba(0,180,216,0.08)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(0,180,216,0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formIncludeWeekends}
                      onChange={(e) => setFormIncludeWeekends(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#00B4D8', cursor: 'pointer' }}
                    />
                    📅 주말 및 공휴일 포함하여 일정 등록
                  </label>
                </div>
              </div>

              {/* Workers Assignment */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  👷 작업자 배정 (Workers)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
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

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    value={formCustomWorker}
                    onChange={(e) => setFormCustomWorker(e.target.value)}
                    placeholder="외부 시공/작업자 이름 입력..."
                    style={{ flex: 1, padding: '0.5rem 0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
                  />
                  <button type="button" onClick={handleAddExternalWorker} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
                    + 외부작업자 추가
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>작업 상세 내용 기재칸</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="작업 내용 및 현장 진행상황, 특이사항을 작성해 주세요..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingItem ? 'DB 수정 저장' : 'IPT 작업 DB 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Drawer */}
      {viewItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                  [{viewItem.workType === '기타' ? viewItem.customWorkType || '기타' : viewItem.workType}]
                </span>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff', marginTop: '0.2rem' }}>{viewItem.title}</h2>
              </div>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>고객사 (사이트명):</span> <strong>{viewItem.site}</strong></div>
                <div><span style={{ color: '#aaa' }}>일시:</span> <strong>{viewItem.startDate} ~ {viewItem.endDate} ({viewItem.startTime} ~ {viewItem.endTime})</strong></div>
                <div><span style={{ color: '#aaa' }}>주말/공휴일 포함:</span> <strong>{viewItem.includeWeekends ? '포함' : '미포함 (평일만)'}</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👷 배정 작업자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {viewItem.workers.map((w, i) => (
                    <span key={i} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {w}
                    </span>
                  ))}
                </div>
              </div>

              {viewItem.content && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 작업 상세 내용:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewItem.content}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewItem); setViewItem(null); }} className="btn btn-accent">✏️ 수정</button>
              <button onClick={() => setViewItem(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📋 IPT 작업 목록 (SQLite DB 연동)</h2>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>총 {filteredItems.length}건</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>작업 제목</th>
              <th>작업 구분</th>
              <th>고객사명(사이트명)</th>
              <th>일시</th>
              <th>주말/공휴일</th>
              <th>배정 작업자</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: '#fff', cursor: 'pointer' }} onClick={() => setViewItem(item)}>
                    {item.title}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {item.workType === '기타' ? item.customWorkType || '기타' : item.workType}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{item.site}</td>
                  <td style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    {item.startDate === item.endDate ? `${item.startDate} (${item.startTime}~${item.endTime})` : `${item.startDate} ~ ${item.endDate}`}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: item.includeWeekends ? '#00B4D8' : '#aaa', fontWeight: 600 }}>
                      {item.includeWeekends ? '☑️ 포함' : '☐ 평일만'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {item.workers.map((w, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginRight: '0.2rem' }}>
                        {w}
                      </span>
                    ))}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => setViewItem(item)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        🔍 상세
                      </button>
                      <button onClick={() => handleOpenEditModal(item)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        ✏️ 수정
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E63946' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 IPT 작업이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
