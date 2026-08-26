'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SUB_CATEGORIES = {
  '회의': ['고객사 미팅', '사내 회의'],
  '컨설팅': ['견적 사전 컨설팅', '기술 제안 미팅', '설계 컨설팅']
};

const INITIAL_MEETINGS = [];

export default function MeetingPage() {
  const { currentUser } = useAuth();

  const [items, setItems] = useState(INITIAL_MEETINGS);
  const [registeredUsers, setRegisteredUsers] = useState([]);
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
  const [formAttendees, setFormAttendees] = useState([]);
  const [formCustomAttendee, setFormCustomAttendee] = useState('');
  const [formContent, setFormContent] = useState('');

  // Fetch Meeting items & Registered DB Users
  useEffect(() => {
    fetchItemsFromAPI();
    fetchUsersFromAPI();
  }, []);

  const fetchItemsFromAPI = async () => {
    try {
      const res = await fetch('/api/meeting');
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
      }
    } catch (e) {
      console.warn('Meeting API error', e);
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
      console.warn('Fetch users error', e);
    }
  };

  // Available attendees built from real registered DB users (excluding master admin)
  const activeUsers = registeredUsers.filter(u => u.id.toLowerCase() !== 'netadmin' && u.name !== '마스터 관리자' && u.role !== '마스터 관리자');
  const attendeeList = activeUsers.length > 0
    ? activeUsers.map(u => `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim())
    : ['이강욱 팀장', '김철수 과장', '박민우 대리', '최현우 과장'];

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
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('14:00 - 16:00');
    setFormSite('');
    setFormAttendees([currentUser?.name || attendeeList[0] || '이강욱 팀장']);
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

  // Submit Save Item
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSite.trim()) {
      alert('제목과 참석 기관/고객사명을 입력해 주세요.');
      return;
    }

    const meetingData = {
      id: editingItem ? editingItem.id : undefined,
      primaryCategory: formPrimaryCategory,
      subCategory: formSubCategory,
      title: formTitle.trim(),
      date: formDate,
      time: formTime,
      site: formSite.trim(),
      attendees: formAttendees.length > 0 ? formAttendees : [currentUser?.name || '참석자'],
      content: formContent.trim()
    };

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch('/api/meeting', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
      });

      const data = await res.json();
      if (res.ok) {
        alert(editingItem ? '회의/컨설팅 정보가 수정되었습니다.' : '신규 회의/컨설팅이 등록되었습니다.');
        setIsModalOpen(false);
        fetchItemsFromAPI();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id) => {
    if (confirm('이 회의/컨설팅 내역을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/meeting?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          fetchItemsFromAPI();
        }
      } catch (err) {
        console.error('Delete meeting error', err);
      }
    }
  };

  // Filtering Logic
  const filteredItems = items.filter(item => {
    const filterMatch = activeFilter === 'all'
      ? true
      : activeFilter === '회의' || activeFilter === '컨설팅'
      ? item.primaryCategory === activeFilter
      : item.subCategory === activeFilter;

    const searchMatch = !searchQuery.trim() ||
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.site || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.attendees || []).some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    return filterMatch && searchMatch;
  });

  return (
    <div>
      {/* Top Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">🤝 회의 & 컨설팅 관리</h1>
          <p className="portal-subtitle">고객사 미팅, 사내 회의, 사전 기술 제안 컨설팅 기록 및 일정 관리</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-accent" style={{ padding: '0.65rem 1.2rem', fontWeight: 600 }}>
          📝 회의 / 컨설팅 신규 등록
        </button>
      </header>

      {/* Filter Toolbar */}
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveFilter('all')} className={`btn ${activeFilter === 'all' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>전체 보기</button>
          <button onClick={() => setActiveFilter('회의')} className={`btn ${activeFilter === '회의' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>🏢 회의 전체</button>
          <button onClick={() => setActiveFilter('고객사 미팅')} className={`btn ${activeFilter === '고객사 미팅' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>🤝 고객사 미팅</button>
          <button onClick={() => setActiveFilter('사내 회의')} className={`btn ${activeFilter === '사내 회의' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>👥 사내 회의</button>
          <button onClick={() => setActiveFilter('컨설팅')} className={`btn ${activeFilter === '컨설팅' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>💡 컨설팅 전체</button>
        </div>

        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="회의 제목, 고객사, 참석자 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '240px' }}
          />
        </div>

      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>
                {editingItem ? '✏️ 회의/컨설팅 정보 수정' : '📝 회의 / 컨설팅 신규 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>대분류 *</label>
                  <select
                    value={formPrimaryCategory}
                    onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    <option value="회의">🏢 회의</option>
                    <option value="컨설팅">💡 컨설팅</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>세부 분류</label>
                  <select
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    {(SUB_CATEGORIES[formPrimaryCategory] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 및 컨설팅 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 아인스텍 본사 신규 UTM 방화벽 도입 기술 컨설팅"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 날짜 *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 시간</label>
                  <input
                    type="text"
                    placeholder="예: 14:00 - 16:00"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사 / 기관명 및 회의 장소 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: [천안센터] 대회의실"
                  value={formSite}
                  onChange={(e) => setFormSite(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              {/* Real Registered Users Selection for Attendees */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#38B000', fontWeight: 600, marginBottom: '0.4rem' }}>
                  👥 참석자 선택 (등록 회원 선택)
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {attendeeList.map(aName => {
                    const isSelected = formAttendees.includes(aName);
                    return (
                      <button
                        key={aName}
                        type="button"
                        onClick={() => handleAttendeeToggle(aName)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #38B000' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(56,176,0,0.25)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#38B000' : '#aaa',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 400,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {aName}
                      </button>
                    );
                  })}
                </div>

                {/* External Custom Attendee Add */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="외부/고객사 참석자 직접 입력..."
                    value={formCustomAttendee}
                    onChange={(e) => setFormCustomAttendee(e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAttendee}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                  >
                    추가
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회의 안건 및 컨설팅 수립 내용</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="회의 안건, 결정 사항, 사전 기술 검토 내용을 작성하세요..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingItem ? '수정 완료' : '회의 등록 (일정 자동연동)'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Detail View Drawer */}
      {viewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.75rem' }}>
                    {viewItem.primaryCategory}
                  </span>
                  <span className="badge" style={{ background: 'rgba(56,176,0,0.15)', color: '#38B000', fontSize: '0.75rem' }}>
                    {viewItem.subCategory}
                  </span>
                </div>
                <h2 className="panel-title" style={{ fontSize: '1.2rem', color: '#fff' }}>{viewItem.title}</h2>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.3rem' }}>장소/고객사: <strong style={{ color: '#fff' }}>{viewItem.site}</strong></div>
              </div>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>일시:</span> <strong>{viewItem.date}</strong></div>
                <div><span style={{ color: '#aaa' }}>시간:</span> <strong>{viewItem.time || '14:00 - 16:00'}</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👥 회의 참석자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(viewItem.attendees || []).map((a, i) => (
                    <span key={i} style={{ background: 'rgba(56,176,0,0.15)', color: '#38B000', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {a}
                    </span>
                  ))}
                </div>
              </div>

              {viewItem.content && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #38B000' }}>
                  <span style={{ fontSize: '0.8rem', color: '#38B000', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>📝 회의 안건 및 결정 내용:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewItem.content}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewItem); setViewItem(null); }} className="btn btn-accent">✏️ 정보 수정</button>
              <button onClick={() => setViewItem(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">🤝 회의 및 컨설팅 현황</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredItems.length}건</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>대분류</th>
              <th>세부분류</th>
              <th>제목</th>
              <th>일시 (시간)</th>
              <th>장소 / 고객사</th>
              <th>참석자</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {item.primaryCategory}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>{item.subCategory}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{item.title}</div>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#aaa' }}>{item.date} ({item.time || '14:00 - 16:00'})</td>
                  <td style={{ fontWeight: 500 }}>{item.site}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {(item.attendees || []).map((a, idx) => (
                        <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(56,176,0,0.15)', color: '#38B000', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {a}
                        </span>
                      ))}
                    </div>
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
                  등록된 회의/컨설팅 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
