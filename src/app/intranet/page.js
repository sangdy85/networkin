'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  '전체',
  '망구성도/토폴로지',
  'IP/VLAN 할당표',
  '방화벽/보안 정책',
  'VPN/원격접속',
  '사내 Wi-Fi/AP',
  '스위치/라우터 설정',
  '운영 매뉴얼'
];

const SECURITY_LEVELS = ['사내전용', '대외비', '일반'];

export default function IntranetPage() {
  const { currentUser } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('망구성도/토폴로지');
  const [formSecurityLevel, setFormSecurityLevel] = useState('사내전용');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formAuthor, setFormAuthor] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTargetInfo, setFormTargetInfo] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileSize, setFormFileSize] = useState('2.5 MB');
  const [formDescription, setFormDescription] = useState('');

  // Fetch documents from backend API `/api/intranet`
  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/intranet');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
        return;
      }
    } catch (e) {
      console.warn('Failed to load intranet documents', e);
    }
    setDocuments([]);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormCode(`INT-NET-${String(Date.now()).slice(-4)}`);
    setFormTitle('');
    setFormCategory('망구성도/토폴로지');
    setFormSecurityLevel('사내전용');
    setFormVersion('v1.0');
    setFormAuthor(currentUser?.name || currentUser?.id || '이강욱 팀장');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTargetInfo('');
    setFormFileName('');
    setFormFileSize('3.5 MB');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (doc) => {
    setEditingDoc(doc);
    setFormCode(doc.code);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormSecurityLevel(doc.securityLevel || '사내전용');
    setFormVersion(doc.version || 'v1.0');
    setFormAuthor(doc.author);
    setFormDate(doc.date);
    setFormTargetInfo(doc.targetInfo || '');
    setFormFileName(doc.fileName);
    setFormFileSize(doc.fileSize || '2.5 MB');
    setFormDescription(doc.description || '');
    setIsModalOpen(true);
  };

  // Submit Save (Create / Edit)
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('사내망 문서 제목을 입력해 주세요.');
      return;
    }

    const docData = {
      id: editingDoc ? editingDoc.id : undefined,
      code: formCode.trim() || `INT-NET-${String(Date.now()).slice(-4)}`,
      title: formTitle.trim(),
      category: formCategory,
      securityLevel: formSecurityLevel,
      version: formVersion.trim() || 'v1.0',
      author: formAuthor.trim() || (currentUser?.name || '담당자'),
      date: formDate || new Date().toISOString().split('T')[0],
      targetInfo: formTargetInfo.trim(),
      fileName: formFileName.trim() || `${formTitle.trim().replace(/\s+/g, '_')}.pdf`,
      fileSize: formFileSize.trim() || '2.5 MB',
      description: formDescription.trim()
    };

    try {
      const method = editingDoc ? 'PUT' : 'POST';
      const res = await fetch('/api/intranet', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });

      const data = await res.json();
      if (res.ok) {
        alert(editingDoc ? '사내망 관리 문서가 수정되었습니다.' : '신규 사내망 관리 문서가 등록되었습니다.');
        setIsModalOpen(false);
        fetchDocs();
      } else {
        alert(`저장 실패: ${data.error || '오류가 발생했습니다.'}`);
      }
    } catch (err) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id) => {
    if (confirm('이 사내망 관리 문서를 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/intranet?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          fetchDocs();
          if (viewDoc && viewDoc.id === id) setViewDoc(null);
        }
      } catch (err) {
        console.error('Delete error', err);
      }
    }
  };

  // Download simulation
  const handleDownload = (doc) => {
    alert(`[${doc.fileName}] 사내 네트워크 문서 다운로드가 시작되었습니다.`);
  };

  // Filter Documents
  const filteredDocs = documents.filter(doc => {
    const catMatch = activeCategory === '전체' || doc.category === activeCategory;
    const searchMatch = !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.targetInfo && doc.targetInfo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Calculate Statistics
  const totalCount = documents.length;
  const topologyCount = documents.filter(d => d.category === '망구성도/토폴로지').length;
  const ipCount = documents.filter(d => d.category === 'IP/VLAN 할당표').length;
  const securityCount = documents.filter(d => d.category === '방화벽/보안 정책' || d.category === 'VPN/원격접속').length;

  const getSecurityBadgeStyle = (level) => {
    if (level === '대외비') return { background: 'rgba(230, 57, 70, 0.15)', color: '#E63946', border: '1px solid rgba(230, 57, 70, 0.4)' };
    if (level === '사내전용') return { background: 'rgba(0, 180, 216, 0.15)', color: '#00B4D8', border: '1px solid rgba(0, 180, 216, 0.4)' };
    return { background: 'rgba(56, 176, 0, 0.15)', color: '#38B000', border: '1px solid rgba(56, 176, 0, 0.4)' };
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case '망구성도/토폴로지': return '🗺️';
      case 'IP/VLAN 할당표': return '🔢';
      case '방화벽/보안 정책': return '🛡️';
      case 'VPN/원격접속': return '🔒';
      case '사내 Wi-Fi/AP': return '📶';
      case '스위치/라우터 설정': return '⚙️';
      case '운영 매뉴얼': return '📖';
      default: return '🖥️';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="portal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🖥️</span> 사내망 관리 (Intranet Network Document Hub)
          </h1>
          <p className="portal-subtitle">
            아인스텍 사내 네트워크 망구성도, IP 대역 할당표, 방화벽/VPN 정책 및 장비 구성 문서를 한눈에 관리하는 중앙 센터
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn btn-accent"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.2rem', fontSize: '0.92rem', fontWeight: 600 }}
        >
          ➕ 신규 사내망 문서 등록
        </button>
      </div>

      {/* 2. Overview KPI Stat Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-label">📄 전체 사내망 문서</div>
          <div className="stat-value" style={{ color: '#00B4D8' }}>{totalCount} <span style={{ fontSize: '0.9rem', color: '#8D99AE' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#8D99AE' }}>등록된 사내 네트워크 관리 문서 수</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">🗺️ 망구성도 / 토폴로지</div>
          <div className="stat-value" style={{ color: '#FFB703' }}>{topologyCount} <span style={{ fontSize: '0.9rem', color: '#8D99AE' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#8D99AE' }}>본사/지사 백본 및 랙 구성도</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">🔢 IP / VLAN 할당표</div>
          <div className="stat-value" style={{ color: '#38B000' }}>{ipCount} <span style={{ fontSize: '0.9rem', color: '#8D99AE' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#8D99AE' }}>사내 서브넷 & VLAN 대역 매핑</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">🛡️ 보안 & 방화벽 / VPN 정책</div>
          <div className="stat-value" style={{ color: '#E63946' }}>{securityCount} <span style={{ fontSize: '0.9rem', color: '#8D99AE' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#8D99AE' }}>UTM 방화벽 룰 및 VPN 접속 지침</div>
        </div>
      </div>

      {/* 3. Filter Bar & View Mode Toggle */}
      <div className="panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn ${activeCategory === cat ? 'btn-accent' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  fontWeight: activeCategory === cat ? 600 : 400
                }}
              >
                {cat === '전체' ? '📁 전체' : `${getCategoryIcon(cat)} ${cat}`}
              </button>
            ))}
          </div>

          {/* Search Bar & View Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <input
                type="text"
                placeholder="문서명, 문서코드, 관련 IP/장비, 작성자 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem 0.6rem 2.2rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8D99AE' }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8D99AE', cursor: 'pointer' }}
                >
                  ✖
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>보기 방식:</span>
              <button
                onClick={() => setViewMode('card')}
                className={`btn ${viewMode === 'card' ? 'btn-accent' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
              >
                🎴 카드형
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`btn ${viewMode === 'table' ? 'btn-accent' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
              >
                📄 목록형
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Document List Display */}
      {filteredDocs.length === 0 ? (
        <div className="panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>조건에 부합하는 사내망 관리 문서가 없습니다.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>검색어를 변경하거나 신규 사내망 문서를 등록해 보세요.</p>
        </div>
      ) : viewMode === 'card' ? (
        /* Card Layout */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
            >
              <div>
                {/* Card Top Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'rgba(0, 180, 216, 0.15)', color: 'var(--color-accent)', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {getCategoryIcon(doc.category)} {doc.category}
                    </span>
                    <span className="badge" style={{ ...getSecurityBadgeStyle(doc.securityLevel), fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {doc.securityLevel}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {doc.version}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#8D99AE', fontFamily: 'monospace' }}>
                    {doc.code}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => setViewDoc(doc)}
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '0.6rem',
                    lineHeight: '1.4',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  {doc.title}
                </h3>

                {/* Target Info (IP / Equipment) */}
                {doc.targetInfo && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    color: 'var(--color-accent)',
                    marginBottom: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span>💻</span>
                    <span style={{ fontWeight: 500 }}>관련 IP/장비:</span>
                    <span style={{ color: '#fff', fontFamily: 'monospace' }}>{doc.targetInfo}</span>
                  </div>
                )}

                {/* Description Snippet */}
                {doc.description && (
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.8rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {doc.description}
                  </p>
                )}
              </div>

              {/* Card Footer Info & Actions */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#8D99AE', marginBottom: '0.75rem' }}>
                  <span>✍️ {doc.author}</span>
                  <span>📅 {doc.date}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setViewDoc(doc)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  >
                    👁️ 상세
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', color: 'var(--color-accent)', borderColor: 'rgba(0,180,216,0.3)' }}
                  >
                    📥 받기
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(doc)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.76rem', color: '#E63946' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Table Layout */
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlig: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>코드</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>분류</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>보안등급</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>문서 제목</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>관련 IP/장비</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>작성자</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>등록일</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#8D99AE', fontSize: '0.8rem' }}>
                    {doc.code}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                      {getCategoryIcon(doc.category)} {doc.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge" style={{ ...getSecurityBadgeStyle(doc.securityLevel), fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {doc.securityLevel}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, cursor: 'pointer' }} onClick={() => setViewDoc(doc)}>
                    <span style={{ color: '#fff' }}>{doc.title}</span>
                    <span style={{ fontSize: '0.72rem', color: '#8D99AE', marginLeft: '0.4rem' }}>({doc.version})</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--status-pending)' }}>
                    {doc.targetInfo || '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>
                    {doc.author}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {doc.date}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                      <button onClick={() => setViewDoc(doc)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>상세</button>
                      <button onClick={() => handleDownload(doc)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-accent)' }}>받기</button>
                      <button onClick={() => handleOpenEditModal(doc)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>수정</button>
                      <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', color: '#E63946' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Document Detail View Modal */}
      {viewDoc && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge" style={{ ...getSecurityBadgeStyle(viewDoc.securityLevel), fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {viewDoc.securityLevel}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#8D99AE', fontFamily: 'monospace' }}>{viewDoc.code}</span>
              </div>
              <button
                onClick={() => setViewDoc(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            {/* Title & Category */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              {viewDoc.title}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', marginBottom: '1.25rem' }}>
              {getCategoryIcon(viewDoc.category)} 카테고리: {viewDoc.category} | 버젼: {viewDoc.version}
            </div>

            {/* Target Info Quick Box */}
            {viewDoc.targetInfo && (
              <div style={{
                background: 'rgba(0, 180, 216, 0.1)',
                border: '1px solid rgba(0, 180, 216, 0.3)',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
                  💻 관련 사내 IP 대역 및 장비 정보
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>
                  {viewDoc.targetInfo}
                </div>
              </div>
            )}

            {/* Meta Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#8D99AE' }}>작성자: </span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{viewDoc.author}</span>
              </div>
              <div>
                <span style={{ color: '#8D99AE' }}>등록/수정일: </span>
                <span style={{ color: '#fff' }}>{viewDoc.date}</span>
              </div>
              <div>
                <span style={{ color: '#8D99AE' }}>첨부 파일: </span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>{viewDoc.fileName}</span>
              </div>
              <div>
                <span style={{ color: '#8D99AE' }}>파일 크기: </span>
                <span style={{ color: '#fff' }}>{viewDoc.fileSize || '2.5 MB'}</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#8D99AE', marginBottom: '0.5rem' }}>📝 상세 설명 및 메모</h4>
              <div style={{
                background: 'var(--bg-main)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                color: '#E0E6ED',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {viewDoc.description || '등록된 상세 설명이 없습니다.'}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                onClick={() => handleDeleteDoc(viewDoc.id)}
                className="btn btn-secondary"
                style={{ color: '#E63946', borderColor: 'rgba(230,57,70,0.4)', fontSize: '0.85rem' }}
              >
                🗑️ 삭제하기
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownload(viewDoc)}
                  className="btn btn-accent"
                  style={{ fontSize: '0.85rem' }}
                >
                  📥 첨부문서 다운로드
                </button>
                <button
                  onClick={() => { setViewDoc(null); handleOpenEditModal(viewDoc); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  ✏️ 문서 수정
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Add/Edit Document Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                {editingDoc ? '✏️ 사내망 관리 문서 수정' : '➕ 신규 사내망 문서 등록'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Row 1: Code & Version */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>문서 코드</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>버전</label>
                  <input
                    type="text"
                    required
                    value={formVersion}
                    onChange={e => setFormVersion(e.target.value)}
                    placeholder="v1.0"
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Row 2: Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>문서 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: [망구성도] 본사/지사 백본 네트워크 토폴로지"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>

              {/* Row 3: Category & Security Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>카테고리</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  >
                    {CATEGORIES.filter(c => c !== '전체').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>보안 등급</label>
                  <select
                    value={formSecurityLevel}
                    onChange={e => setFormSecurityLevel(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  >
                    {SECURITY_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Author & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>작성자 / 담당자</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={e => setFormAuthor(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>등록/개정일</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Row 5: Target Equipment / Subnet */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>
                  관련 IP 대역 / 장비명 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 192.168.1.0/24, CoreSwitch-01, UTM-FW-01"
                  value={formTargetInfo}
                  onChange={e => setFormTargetInfo(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', fontFamily: 'monospace' }}
                />
              </div>

              {/* Row 6: File Name & Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>첨부 파일명</label>
                  <input
                    type="text"
                    placeholder="예: Einstec_Intranet_Topology.pdf"
                    value={formFileName}
                    onChange={e => setFormFileName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>파일 용량</label>
                  <input
                    type="text"
                    placeholder="3.5 MB"
                    value={formFileSize}
                    onChange={e => setFormFileSize(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Row 7: Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>상세 설명 및 특이사항</label>
                <textarea
                  rows={4}
                  placeholder="네트워크 구성 변경 내역, 보안 주의사항, 접속 포트 정보 등 관련 내용을 자유롭게 기재하세요."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.2rem' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  style={{ padding: '0.55rem 1.4rem', fontWeight: 600 }}
                >
                  {editingDoc ? '수정 완료' : '등록 저장'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
