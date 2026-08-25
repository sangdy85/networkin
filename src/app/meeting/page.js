'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SUB_CATEGORIES = {
  '회의': ['고객사 미팅', '사내 회의'],
  '컨설팅': ['견적 사전 컨설팅', '기술 제안 미팅', '설계 컨설팅']
};

const INITIAL_MEETINGS = [];

const COMPANY_WORKERS = ['이강욱 팀장', '김철수 과장', '박민우 대리', '최현우 과장'];

export default function MeetingPage() {
  const { currentUser } = useAuth();

  const [items, setItems] = useState(INITIAL_MEETINGS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Form State
  const [formPrimaryCategory, setFormPrimaryCategory] = useState('회의');
  const [formSubCategory, setFormSubCategory] = useState('고객사 미팅');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-08-21');
  const [formTime, setFormTime] = useState('14:00 - 16:00');
  const [formSite, setFormSite] = useState('');
  const [formAttendees, setFormAttendees] = useState(['이강욱 팀장']);
  const [formCustomAttendee, setFormCustomAttendee] = useState('');
  const [formContent, setFormContent] = useState('');

  // Fetch from Real Backend SQLite API `/api/meeting`
  useEffect(() => {
    fetchItemsFromAPI();
  }, []);

  const fetchItemsFromAPI = async () => {
    try {
      const res = await fetch('/api/meeting');
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
        syncAllToSchedule(data || []);
        return;
      }
    } catch (e) {
      console.warn('Meeting API error', e);
    }
    setItems([]);
  };

  const saveItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('networkin_meeting_items', JSON.stringify(newItems));
    syncAllToSchedule(newItems);
  };

  // Sync to Schedule Hub
  const syncAllToSchedule = (mtgList) => {
    try {
      const savedSchedules = localStorage.getItem('networkin_schedules_v3');
      let currentSchedules = savedSchedules ? JSON.parse(savedSchedules) : [];
      let cleanSchedules = currentSchedules.filter(s => !s.id.startsWith('MTG-SCHED-'));

      const mtgSchedules = mtgList.map(item => {
        return {
          id: `MTG-SCHED-${item.id}`,
          date: item.date,
          startDate: item.date,
          endDate: item.date,
          time: item.time,
          title: `[${item.primaryCategory}] ${item.title}`,
          type: '회의/컨설팅',
          workType: item.subCategory,
          location: item.site,
          assignee: item.attendees[0] || '참석자',
          workers: item.attendees,
          color: '#38B000',
          periodText: `${item.date} (${item.time})`,
          memo: item.content
        };
      });

      const merged = [...mtgSchedules, ...cleanSchedules];
      localStorage.setItem('networkin_schedules_v3', JSON.stringify(merged));
    } catch (err) {
      console.error('Meeting Schedule sync error:', err);
    }
  };

  // Handle Primary Category Select
  const handlePrimaryCategoryChange = (cat) => {
    setFormPrimaryCategory(cat);
    const subOpts = SUB_CATEGORIES[cat] || [];
    setFormSubCategory(subOpts[0] || '');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormPrimaryCategory('회의');
    setFormSubCategory('고객사 미팅');
    setFormTitle('');
    setFormDate('2026-08-21');
    setFormTime('14:00 - 16:00');
    setFormSite('');
    setFormAttendees([currentUser?.name || currentUser?.id || '이강욱 팀장']);
    setFormCustomAttendee('');
    setFormContent('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormPrimaryCategory(item.primaryCategory);
    setFormSubCategory(item.subCategory);
    setFormTitle(item.title);
    setFormDate(item.date);
    setFormTime(item.time || '14:00 - 16:00');
    setFormSite(item.site);
    setFormAttendees(item.attendees || []);
    setFormCustomAttendee('');
    setFormContent(item.content || '');
    setIsModalOpen(true);
  };

  // Toggle Attendee
  const handleAttendeeToggle = (name) => {
    if (formAttendees.includes(name)) {
      if (formAttendees.length === 1) return;
      setFormAttendees(formAttendees.filter(a => a !== name));
    } else {
      setFormAttendees([...formAttendees, name]);
    }
  };

  // Add Custom External Attendee
  const handleAddCustomAttendee = () => {
    if (!formCustomAttendee.trim()) return;
    if (formAttendees.includes(formCustomAttendee.trim())) return;
    setFormAttendees([...formAttendees, formCustomAttendee.trim()]);
    setFormCustomAttendee('');
  };

  // Save Submit
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSite.trim()) {
      alert('제목과 고객사명(사이트명)을 입력해 주세요.');
      return;
    }

    const itemData = {
      id: editingItem ? editingItem.id : `MTG-2026-${String(items.length + 10).padStart(3, '0')}`,
      primaryCategory: formPrimaryCategory,
      subCategory: formSubCategory,
      title: formTitle.trim(),
      date: formDate,
      time: formTime,
      site: formSite.trim(),
      attendees: formAttendees,
      content: formContent.trim(),
      status: '예정'
    };

    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? itemData : i);
      saveItems(updated);
      alert('회의/컨설팅 정보가 수정되었으며, [일정관리]에 자동 반영되었습니다.');
    } else {
      const updated = [itemData, ...items];
      saveItems(updated);
      alert('신규 회의/컨설팅이 등록되었으며, [일정관리] 캘린더에 자동 연동되었습니다!');
    }

    setIsModalOpen(false);
  };

  // Delete
  const handleDeleteItem = (id) => {
    if (confirm('이 회의/컨설팅 항목을 삭제하시겠습니까? (연동된 일정도 함께 삭제됩니다)')) {
      const updated = items.filter(i => i.id !== id);
      saveItems(updated);
    }
  };

  // Filtered Items
  const filteredItems = items.filter(item => {
    const filterMatch = activeFilter === 'all' || item.primaryCategory === activeFilter;
    const searchMatch = !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    return filterMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">💬 회의 / 컨설팅 센터</h1>
          <p className="portal-subtitle">고객사 미팅, 사내 회의, 기술 제안 및 사전 컨설팅 일정 등록 및 [일정관리] 자동 연동</p>
        </div>
        <button className="btn btn-accent" onClick={handleOpenCreateModal}>+ 회의/컨설팅 등록</button>
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
          <button
            className={`btn ${activeFilter === '회의' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('회의')}
            style={{ fontSize: '0.85rem' }}
          >
            💬 회의 ({items.filter(i => i.primaryCategory === '회의').length})
          </button>
          <button
            className={`btn ${activeFilter === '컨설팅' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('컨설팅')}
            style={{ fontSize: '0.85rem' }}
          >
            💼 컨설팅 ({items.filter(i => i.primaryCategory === '컨설팅').length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목/사이트명/구분 검색..."
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
              <h2 className="panel-title">{editingItem ? '✏️ 회의/컨설팅 수정' : '➕ 신규 회의/컨설팅 등록'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* 1차 & 2차 동적 카테고리 연동 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(56,176,0,0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(56,176,0,0.2)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#38B000', fontWeight: 700, marginBottom: '0.3rem' }}>
                    1차 구분 *
                  </label>
                  <select
                    value={formPrimaryCategory}
                    onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid #38B000', color: 'white', fontWeight: 700 }}
                  >
                    <option value="회의">💬 회의</option>
                    <option value="컨설팅">💼 컨설팅</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#38B000', fontWeight: 700, marginBottom: '0.3rem' }}>
                    2차 세부 구분 *
                  </label>
                  <select
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid #38B000', color: 'white', fontWeight: 600 }}
                  >
                    {(SUB_CATEGORIES[formPrimaryCategory] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 / 컨설팅 제목 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="회의 / 컨설팅 제목을 입력해 주세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사명 (사이트명) *</label>
                <input
                  type="text"
                  value={formSite}
                  onChange={(e) => setFormSite(e.target.value)}
                  placeholder="장소 / 고객사명을 입력해 주세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 일자 *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 시간 *</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="예: 14:00 - 16:00"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              {/* Attendance Selection */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#38B000', fontWeight: 600, marginBottom: '0.5rem' }}>
                  👥 회의 및 컨설팅 참석자
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {COMPANY_WORKERS.map(w => {
                    const isSelected = formAttendees.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleAttendeeToggle(w)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #38B000' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(56,176,0,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#38B000' : '#aaa',
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
                    value={formCustomAttendee}
                    onChange={(e) => setFormCustomAttendee(e.target.value)}
                    placeholder="외부 고객사/파트너 참석자 이름 입력..."
                    style={{ flex: 1, padding: '0.5rem 0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
                  />
                  <button type="button" onClick={handleAddCustomAttendee} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
                    + 외부참석자 추가
                  </button>
                </div>
              </div>

              {/* 내용 기재칸 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 및 컨설팅 상세 내용 기재칸</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="회의 안건, 컨설팅 요약 및 결론 내용을 작성해 주세요..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingItem ? '수정 완료' : '회의/컨설팅 등록 (일정 자동연동)'}</button>
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
                <span style={{ fontSize: '0.8rem', color: '#38B000', fontWeight: 700 }}>
                  [{viewItem.primaryCategory}] {viewItem.subCategory}
                </span>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff', marginTop: '0.2rem' }}>{viewItem.title}</h2>
              </div>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>고객사 (사이트명):</span> <strong>{viewItem.site}</strong></div>
                <div><span style={{ color: '#aaa' }}>일시:</span> <strong>{viewItem.date} ({viewItem.time})</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👥 참석자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {viewItem.attendees.map((a, i) => (
                    <span key={i} style={{ background: 'rgba(56,176,0,0.15)', color: '#38B000', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {a}
                    </span>
                  ))}
                </div>
              </div>

              {viewItem.content && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #38B000' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 상세 안건 및 기록:</span>
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
          <h2 className="panel-title">📋 회의 및 컨설팅 목록</h2>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>총 {filteredItems.length}건</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>1차/2차 구분</th>
              <th>고객사명(사이트명)</th>
              <th>일시</th>
              <th>참석자</th>
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
                    <span style={{ fontSize: '0.78rem', background: 'rgba(56,176,0,0.15)', color: '#38B000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      [{item.primaryCategory}] {item.subCategory}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{item.site}</td>
                  <td style={{ fontSize: '0.8rem', color: '#aaa' }}>{item.date} ({item.time})</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {item.attendees.map((a, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginRight: '0.2rem' }}>
                        {a}
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
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 회의/컨설팅이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
