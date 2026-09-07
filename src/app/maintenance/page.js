'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_TICKETS = [];

export default function MaintenancePage() {
  const { currentUser } = useAuth();

  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [clients, setClients] = useState([]);
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
  const [formWorkers, setFormWorkers] = useState([]);
  const [formCustomWorker, setFormCustomWorker] = useState('');
  const [formResolutionNote, setFormResolutionNote] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formExistingFiles, setFormExistingFiles] = useState([]);
  const [formNewFiles, setFormNewFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [syncTarget, setSyncTarget] = useState('network'); // 'network' | 'ipt' | 'none'

  // Fetch maintenance tickets & registered users
  useEffect(() => {
    fetchTicketsFromAPI();
    fetchUsersFromAPI();
    fetchClientsFromAPI();
  }, []);

  const fetchClientsFromAPI = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch clients error', e);
    }
  };

  const fetchTicketsFromAPI = async () => {
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const data = await res.json();
        setTickets(data || []);
      }
    } catch (e) {
      console.error('Fetch maintenance tickets error', e);
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

  // List of available workers built from registered database users (excluding master admin)
  const activeUsers = registeredUsers.filter(u => u.id.toLowerCase() !== 'netadmin' && u.name !== '마스터 관리자' && u.role !== '마스터 관리자');
  const workerList = activeUsers.length > 0
    ? activeUsers.map(u => `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim())
    : ['이강욱 팀장', '김철수 과장', '박민우 대리', '최현우 과장'];

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTicket(null);
    setFormSite('');
    setFormTitle('');
    setFormIssue('');
    setFormCategory('네트워크 장애');
    setFormUrgency('긴급');
    setFormStatus('접수');
    setFormWorkers([currentUser?.name || workerList[0] || '담당자']);
    setFormCustomWorker('');
    setFormResolutionNote('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormExistingFiles([]);
    setFormNewFiles([]);
    setSyncTarget('network');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tck) => {
    setEditingTicket(tck);
    setFormSite(tck.site);
    setFormTitle(tck.title);
    setFormIssue(tck.issue || '');
    setFormCategory(tck.category);
    setFormUrgency(tck.priority || tck.urgency || '보통');
    setFormStatus(tck.status);
    setFormWorkers(tck.workers || []);
    setFormCustomWorker('');
    setFormResolutionNote(tck.resolutionNote || '');
    setFormDate(tck.date || new Date().toISOString().split('T')[0]);
    const existing = Array.isArray(tck.files) && tck.files.length > 0 
      ? tck.files 
      : (tck.fileName && tck.filePath ? [{ fileName: tck.fileName, filePath: tck.filePath }] : []);
    setFormExistingFiles(existing);
    setFormNewFiles([]);
    const defaultSync = tck.category?.includes('IPT') ? 'ipt' : (tck.category?.includes('네트워크') ? 'network' : 'none');
    setSyncTarget(defaultSync);
    setIsModalOpen(true);
  };

  // Worker Toggle
  const handleWorkerToggle = (workerName) => {
    if (formWorkers.includes(workerName)) {
      if (formWorkers.length === 1) return;
      setFormWorkers(formWorkers.filter(w => w !== workerName));
    } else {
      setFormWorkers([...formWorkers, workerName]);
    }
  };

  // Add Custom Worker
  const handleAddCustomWorker = () => {
    if (!formCustomWorker.trim()) return;
    if (formWorkers.includes(formCustomWorker.trim())) return;
    setFormWorkers([...formWorkers, formCustomWorker.trim()]);
    setFormCustomWorker('');
  };

  // Handle Multi-file Selection
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFormNewFiles(prev => [...prev, ...selected]);
    }
    e.target.value = '';
  };

  const handleRemoveExistingFile = (idx) => {
    setFormExistingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveNewFile = (idx) => {
    setFormNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Save Ticket
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formSite.trim() || !formTitle.trim()) {
      alert('사이트명과 장애 접수 제목을 입력해 주세요.');
      return;
    }

    setUploadingFile(true);

    try {
      let uploadedFiles = [];
      if (formNewFiles.length > 0) {
        for (const file of formNewFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/api/clients/documents/upload', {
            method: 'POST',
            body: formData
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedFiles.push({
              fileName: uploadData.fileName,
              filePath: uploadData.filePath,
              fileSize: uploadData.fileSize
            });
          } else {
            throw new Error(`파일(${file.name}) 업로드 실패`);
          }
        }
      }

      const allFiles = [...formExistingFiles, ...uploadedFiles];

      const ticketData = {
        id: editingTicket ? editingTicket.id : undefined,
        ticketNo: editingTicket ? (editingTicket.ticketNo || editingTicket.id) : undefined,
        site: formSite.trim(),
        title: formTitle.trim(),
        category: formCategory,
        priority: formUrgency,
        status: formStatus,
        workers: formWorkers.length > 0 ? formWorkers : [currentUser?.name || '담당자'],
        resolutionNote: formResolutionNote.trim(),
        date: formDate,
        files: allFiles,
        syncTarget: syncTarget
      };

      const method = editingTicket ? 'PUT' : 'POST';
      const res = await fetch('/api/maintenance', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      if (res.ok) {
        alert(editingTicket ? '장애 처리 티켓 정보가 수정되었습니다.' : '긴급 장애/유지보수 티켓이 접수되었습니다.');
        setIsModalOpen(false);
        fetchTicketsFromAPI();
      } else {
        const err = await res.json();
        alert(err.error || '저장에 실패했습니다.');
      }
    } catch (e) {
      alert(e.message || '저장에 실패했습니다.');
      console.error(e);
    } finally {
      setUploadingFile(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (id) => {
    if (confirm('이 유지보수/장애 티켓을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/maintenance?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          fetchTicketsFromAPI();
        }
      } catch (err) {
        console.error('Delete ticket error', err);
      }
    }
  };

  // Filtering Logic
  const filteredTickets = tickets.filter(t => {
    const statusMatch = activeTab === 'all' 
      ? true 
      : activeTab === 'pending' 
      ? t.status !== '처리완료' 
      : t.status === activeTab;

    const urgencyMatch = urgencyFilter === 'all' || (t.priority || t.urgency) === urgencyFilter;

    const searchMatch = !searchQuery.trim() ||
      (t.site || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.engineer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.workers || []).some(w => w.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && urgencyMatch && searchMatch;
  });

  return (
    <div>
      {/* Top Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">🛠️ 유지보수 & 장애 관리 센터</h1>
          <p className="portal-subtitle">고객사 24시간 긴급 출동, 네트워크 장애 조치 및 정기점검 티켓 관리</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-accent" style={{ padding: '0.65rem 1.2rem', fontWeight: 600 }}>
          🚨 긴급 장애 / 유지보수 접수
        </button>
      </header>

      {/* Filter Toolbar */}
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('all')} className={`btn ${activeTab === 'all' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>전체 티켓</button>
          <button onClick={() => setActiveTab('pending')} className={`btn ${activeTab === 'pending' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>미완료 티켓</button>
          <button onClick={() => setActiveTab('접수')} className={`btn ${activeTab === '접수' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>접수</button>
          <button onClick={() => setActiveTab('이동중')} className={`btn ${activeTab === '이동중' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>이동중</button>
          <button onClick={() => setActiveTab('처리중')} className={`btn ${activeTab === '처리중' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>처리중</button>
          <button onClick={() => setActiveTab('처리완료')} className={`btn ${activeTab === '처리완료' ? 'btn-accent' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>처리완료</button>
        </div>

        {/* Search & Urgency Filters */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}>
            <option value="all">전체 긴급도</option>
            <option value="긴급">🔴 긴급</option>
            <option value="보통">🟡 보통</option>
          </select>
          <input
            type="text"
            placeholder="사이트명, 제목, 엔지니어 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '220px' }}
          />
        </div>

      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>
                {editingTicket ? '✏️ 유지보수 티켓 수정' : '🚨 긴급 장애 / 유지보수 티켓 접수'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사 / 사이트명 *</label>
                <input
                  type="text"
                  required
                  list="clients-list"
                  placeholder="예: [아인스텍 본사] 3층 서버실 (직접 입력 또는 선택)"
                  value={formSite}
                  onChange={(e) => setFormSite(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
                <datalist id="clients-list">
                  {clients.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>장애 접수 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 메인 백본 스위치 포트 핑 손실 및 랙 전원 다운"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>유지보수 구분</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setFormCategory(cat);
                      if (cat.includes('IPT')) setSyncTarget('ipt');
                      else if (cat.includes('네트워크')) setSyncTarget('network');
                    }}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    <option value="네트워크 장애">네트워크 장애</option>
                    <option value="IPT 전화 장애">IPT 전화 장애</option>
                    <option value="서버/UTM 점검">서버/UTM 점검</option>
                    <option value="정기 점검">정기 점검</option>
                    <option value="기타 긴급 조치">기타 긴급 조치</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>긴급도</label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    <option value="긴급">🔴 긴급</option>
                    <option value="보통">🟡 보통</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>처리 상태</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                  >
                    <option value="접수">접수</option>
                    <option value="이동중">이동중</option>
                    <option value="처리중">처리중</option>
                    <option value="처리완료">처리완료</option>
                  </select>
                </div>
              </div>

              {/* 관리 메뉴 자동 연동 선택 */}
              <div style={{ background: 'rgba(0,180,216,0.06)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.83rem', color: '#00B4D8', fontWeight: 700 }}>
                    🔄 관리 메뉴 자동 연동 등록 (IPT / 네트워크)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>선택 시 해당 메뉴의 작업 목록 및 일정에 자동 생성</span>
                </div>
                <select
                  value={syncTarget}
                  onChange={(e) => setSyncTarget(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <option value="network">🌐 네트워크 관리 메뉴에 자동 등록 및 연동</option>
                  <option value="ipt">📞 IPT (인터넷전화) 관리 메뉴에 자동 등록 및 연동</option>
                  <option value="none">연동 안 함 (유지보수 티켓에만 단독 등록)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>접수/조치 일자 (일정 자동연동)</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              {/* Real Registered Users Selection for Workers */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  👷 담당 엔지니어 및 출동자 배정 (등록 회원 선택)
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {workerList.map(w => {
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
                          background: isSelected ? 'rgba(0,180,216,0.25)' : 'rgba(255,255,255,0.05)',
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

                {/* External Custom Worker Add */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="외부/협력사 출동자 직접 입력..."
                    value={formCustomWorker}
                    onChange={(e) => setFormCustomWorker(e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomWorker}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                  >
                    추가
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>장애 현상 및 점검 상세 내용</label>
                <textarea
                  rows={3}
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="현장 장애 현상이나 점검 상세 내용을 작성하세요..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>
                  📁 첨부파일 (조치 보고서, 사진 등 - 다중 선택 가능)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
                
                {/* Existing Attached Files */}
                {formExistingFiles.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '0.2rem' }}>
                      기존 등록 파일 ({formExistingFiles.length}개):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {formExistingFiles.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                          <a href={f.filePath} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#00B4D8', textDecoration: 'none' }}>
                            📁 {f.fileName}
                          </a>
                          <button type="button" onClick={() => handleRemoveExistingFile(i)} style={{ background: 'none', border: 'none', color: '#E63946', cursor: 'pointer', fontSize: '0.85rem' }}>✕ 삭제</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newly Selected Files */}
                {formNewFiles.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#00B4D8', display: 'block', marginBottom: '0.2rem' }}>
                      새로 첨부할 파일 ({formNewFiles.length}개):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {formNewFiles.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,180,216,0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#fff' }}>
                            📄 {f.name} <span style={{ color: '#aaa', fontSize: '0.75rem' }}>({(f.size / 1024).toFixed(1)} KB)</span>
                          </span>
                          <button type="button" onClick={() => handleRemoveNewFile(i)} style={{ background: 'none', border: 'none', color: '#E63946', cursor: 'pointer', fontSize: '0.85rem' }}>✕ 취소</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>💡 조치 결과 및 완료 보고서 (처리완료 시)</label>
                <textarea
                  rows={3}
                  value={formResolutionNote}
                  onChange={(e) => setFormResolutionNote(e.target.value)}
                  placeholder="현장 조치 내용 및 부품 교체 내역 등 결과 작성..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.3)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" disabled={uploadingFile} className="btn btn-accent">{uploadingFile ? '업로드 중...' : (editingTicket ? '수정 완료' : '티켓 접수 (일정 자동연동)')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Drawer */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {viewTicket.ticketNo || viewTicket.id}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: (viewTicket.priority || viewTicket.urgency) === '긴급' ? '#E63946' : '#FFB703', fontWeight: 700 }}>
                    ⚡ {viewTicket.priority || viewTicket.urgency}
                  </span>
                </div>
                <h2 className="panel-title" style={{ fontSize: '1.2rem', color: '#fff' }}>{viewTicket.title}</h2>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.3rem' }}>사이트명: <strong style={{ color: '#fff' }}>{viewTicket.site}</strong></div>
              </div>
              <button onClick={() => setViewTicket(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>구분:</span> <strong>{viewTicket.category}</strong></div>
                <div><span style={{ color: '#aaa' }}>일시:</span> <strong>{viewTicket.date}</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👷 담당 엔지니어 및 출동자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(Array.isArray(viewTicket.workers) && viewTicket.workers.length > 0 ? viewTicket.workers : [viewTicket.engineer || '담당자']).map((w, i) => (
                    <span key={i} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {w}
                    </span>
                  ))}
                </div>
              </div>

              {viewTicket.issue && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #E63946' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>🚨 장애 및 점검 상세 내용:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewTicket.issue}</p>
                </div>
              )}

              {viewTicket.resolutionNote && (
                <div style={{ background: 'rgba(56,176,0,0.08)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #38B000' }}>
                  <span style={{ fontSize: '0.8rem', color: '#38B000', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>✅ 조치 완료 보고서:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewTicket.resolutionNote}</p>
                </div>
              )}

              {/* View Attached Files */}
              {((Array.isArray(viewTicket.files) && viewTicket.files.length > 0) || (viewTicket.fileName && viewTicket.filePath)) && (
                <div style={{ background: 'rgba(0,180,216,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.2)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#00B4D8', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                    📁 첨부파일 ({viewTicket.files?.length || 1}개):
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {Array.isArray(viewTicket.files) && viewTicket.files.length > 0 ? (
                      viewTicket.files.map((f, i) => (
                        <a key={i} href={f.filePath} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#00B4D8', background: 'rgba(0,180,216,0.15)', padding: '0.3rem 0.7rem', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(0,180,216,0.3)' }}>
                          📥 {f.fileName} {f.fileSize ? `(${f.fileSize})` : ''}
                        </a>
                      ))
                    ) : (
                      <a href={viewTicket.filePath} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#00B4D8', background: 'rgba(0,180,216,0.15)', padding: '0.3rem 0.7rem', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(0,180,216,0.3)' }}>
                        📥 {viewTicket.fileName}
                      </a>
                    )}
                  </div>
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
              <th>장애 접수 제목</th>
              <th>구분</th>
              <th>긴급도</th>
              <th>담당 엔지니어</th>
              <th>일시</th>
              <th>상태</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map(t => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{t.ticketNo || t.id}</td>
                  <td style={{ fontWeight: 600 }}>{t.site}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{t.title}</span>
                      {((Array.isArray(t.files) && t.files.length > 0) || (t.fileName && t.filePath)) && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          📎 {t.files?.length || 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {t.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.78rem',
                      color: (t.priority || t.urgency) === '긴급' ? '#E63946' : '#FFB703',
                      fontWeight: 700 
                    }}>
                      ● {t.priority || t.urgency || '보통'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {(Array.isArray(t.workers) && t.workers.length > 0 ? t.workers : [t.engineer || '담당자']).map((w, idx) => (
                        <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {w}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#aaa' }}>{t.date}</td>
                  <td><span className={`badge ${t.badgeClass || (t.status === '처리완료' ? 'badge-active' : 'badge-pending')}`}>{t.status}</span></td>
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
