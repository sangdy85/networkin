'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  '전체',
  '망구성도',
  '토폴로지',
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('망구성도');
  const [formSecurityLevel, setFormSecurityLevel] = useState('사내전용');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formAuthor, setFormAuthor] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTargetInfo, setFormTargetInfo] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFilePath, setFormFilePath] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPrimary, setFormIsPrimary] = useState(true);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);

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

  // Primary Network Diagram (대표 망구성도)
  const primaryNetworkDiagram = documents.find(d => d.category === '망구성도' && d.isPrimary)
    || documents.filter(d => d.category === '망구성도')[0]
    || null;

  // History list for 망구성도
  const networkDiagramHistory = documents.filter(d => d.category === '망구성도');

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/intranet/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormFileName(data.fileName);
        setFormFilePath(data.filePath);
        setFormFileSize(data.fileSize);
        if (!formTitle.trim()) {
          setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      } else {
        alert(`파일 업로드 실패: ${data.error || '오류가 발생했습니다.'}`);
      }
    } catch (err) {
      alert(`업로드 중 오류 발생: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (presetCategory = '망구성도') => {
    setEditingDoc(null);
    setFormCode(`INT-NET-${String(Date.now()).slice(-4)}`);
    setFormTitle('');
    setFormCategory(presetCategory);
    setFormSecurityLevel('사내전용');

    // Auto calculate version for 망구성도
    if (presetCategory === '망구성도' && networkDiagramHistory.length > 0) {
      const nextVer = `v${(networkDiagramHistory.length + 1).toFixed(1)}`;
      setFormVersion(nextVer);
    } else {
      setFormVersion('v1.0');
    }

    setFormAuthor(currentUser?.name || currentUser?.id || '이강욱 팀장');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTargetInfo('');
    setFormFileName('');
    setFormFilePath('');
    setFormFileSize('');
    setFormDescription('');
    setFormIsPrimary(true);
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
    setFormFilePath(doc.filePath || '');
    setFormFileSize(doc.fileSize || '');
    setFormDescription(doc.description || '');
    setFormIsPrimary(doc.isPrimary);
    setIsModalOpen(true);
  };

  // Submit Save (Create / Edit)
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('문서 제목을 입력해 주세요.');
      return;
    }

    if (!formFileName.trim() && !formFilePath.trim()) {
      alert('첨부 파일을 선택/업로드해 주세요.');
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
      fileName: formFileName.trim() || 'file.pdf',
      filePath: formFilePath.trim(),
      fileSize: formFileSize.trim() || '0 KB',
      isPrimary: formIsPrimary,
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
        alert(editingDoc ? '문서 정보가 수정되었습니다.' : '신규 문서가 성공적으로 업로드/등록되었습니다.');
        setIsModalOpen(false);
        fetchDocs();
      } else {
        alert(`저장 실패: ${data.error || '오류가 발생했습니다.'}`);
      }
    } catch (err) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  // Set as primary representative document
  const handleSetPrimary = async (docId) => {
    try {
      const res = await fetch('/api/intranet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, action: 'setPrimary' })
      });
      if (res.ok) {
        alert('선택한 버젼이 대표 망구성도로 변경되었습니다.');
        fetchDocs();
      }
    } catch (err) {
      alert(`대표 변경 오류: ${err.message}`);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id) => {
    if (confirm('이 문서를 완전히 삭제하시겠습니까?')) {
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

  // Helper check for image formats
  const isImageFile = (fileName = '', filePath = '') => {
    const target = (fileName || filePath).toLowerCase();
    return target.endsWith('.png') || target.endsWith('.jpg') || target.endsWith('.jpeg') ||
           target.endsWith('.gif') || target.endsWith('.svg') || target.endsWith('.webp');
  };

  // Filter Documents for display
  const filteredDocs = documents.filter(doc => {
    // If 망구성도 category selected, only display the Primary document in the main list
    if (activeCategory === '망구성도') {
      if (!doc.isPrimary) return false;
    } else {
      if (activeCategory !== '전체' && doc.category !== activeCategory) return false;
    }

    const searchMatch = !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.targetInfo && doc.targetInfo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());

    return searchMatch;
  });

  const getSecurityBadgeStyle = (level) => {
    if (level === '대외비') return { background: 'rgba(230, 57, 70, 0.15)', color: '#E63946', border: '1px solid rgba(230, 57, 70, 0.4)' };
    if (level === '사내전용') return { background: 'rgba(0, 180, 216, 0.15)', color: '#00B4D8', border: '1px solid rgba(0, 180, 216, 0.4)' };
    return { background: 'rgba(56, 176, 0, 0.15)', color: '#38B000', border: '1px solid rgba(56, 176, 0, 0.4)' };
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case '망구성도': return '🗺️';
      case '토폴로지': return '🌐';
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
            아인스텍 사내 대표 망구성도, 토폴로지, IP 대역 할당표 및 네트워크 관리 문서 통합 관리 센터
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {networkDiagramHistory.length > 0 && (
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', fontSize: '0.88rem' }}
            >
              📜 망구성도 히스토리 ({networkDiagramHistory.length}개)
            </button>
          )}
          <button
            onClick={() => handleOpenCreateModal(activeCategory === '전체' ? '망구성도' : activeCategory)}
            className="btn btn-accent"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.2rem', fontSize: '0.92rem', fontWeight: 600 }}
          >
            📤 문서 업로드 / 등록
          </button>
        </div>
      </div>

      {/* 2. Featured Representative Network Diagram Section (대표 망구성도 메인 뷰어) */}
      <div className="panel" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(28, 37, 65, 0.95), rgba(11, 19, 43, 0.95))',
        border: '1px solid rgba(0, 180, 216, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📌</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                사내 대표 망구성도
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                현재 사내 망에서 최신 표준으로 지정된 대표 네트워크 구성도입니다.
              </span>
            </div>
          </div>

          {primaryNetworkDiagram && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#00B4D8', color: '#000', fontWeight: 700, fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                대표 문서 ({primaryNetworkDiagram.version})
              </span>
              <span className="badge" style={{ ...getSecurityBadgeStyle(primaryNetworkDiagram.securityLevel), fontSize: '0.78rem' }}>
                {primaryNetworkDiagram.securityLevel}
              </span>
            </div>
          )}
        </div>

        {primaryNetworkDiagram ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Title & Info Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(0, 180, 216, 0.08)', padding: '0.85rem 1.1rem', borderRadius: '10px', border: '1px solid rgba(0, 180, 216, 0.2)' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                  {primaryNetworkDiagram.title}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#8D99AE', flexWrap: 'wrap' }}>
                  <span>✍️ 작성자: {primaryNetworkDiagram.author}</span>
                  <span>📅 개정일: {primaryNetworkDiagram.date}</span>
                  {primaryNetworkDiagram.targetInfo && <span style={{ color: 'var(--color-accent)', fontFamily: 'monospace' }}>💻 {primaryNetworkDiagram.targetInfo}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {primaryNetworkDiagram.filePath && (
                  <a
                    href={primaryNetworkDiagram.filePath}
                    download={primaryNetworkDiagram.fileName}
                    className="btn btn-accent"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    📥 대표 망구성도 다운로드 ({primaryNetworkDiagram.fileSize})
                  </a>
                )}
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  📜 이전 버젼 히스토리
                </button>
                <button
                  onClick={() => handleOpenCreateModal('망구성도')}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', color: 'var(--color-accent)', borderColor: 'rgba(0,180,216,0.4)' }}
                >
                  📤 새 버젼 업로드
                </button>
              </div>
            </div>

            {/* Network Diagram View Area (1st Page Preview Format) */}
            <div style={{
              background: '#070C1E',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'center',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              
              {/* Preview Bar Indicator */}
              <div style={{
                width: '100%',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                marginBottom: '0.85rem',
                paddingBottom: '0.65rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge" style={{ background: 'rgba(0, 180, 216, 0.2)', color: 'var(--color-accent)', border: '1px solid rgba(0, 180, 216, 0.4)', fontSize: '0.76rem', padding: '0.2rem 0.6rem' }}>
                    📄 첫 번째 페이지 미리보기
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#8D99AE' }}>
                    ({primaryNetworkDiagram.fileName})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {primaryNetworkDiagram.filePath && primaryNetworkDiagram.filePath.toLowerCase().endsWith('.pdf') && (
                    <>
                      <button
                        onClick={() => setPdfViewMode('page1')}
                        className={`btn ${pdfViewMode === 'page1' ? 'btn-accent' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        📄 1페이지 미리보기
                      </button>
                      <button
                        onClick={() => setPdfViewMode('full')}
                        className={`btn ${pdfViewMode === 'full' ? 'btn-accent' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        📖 전체 보기
                      </button>
                    </>
                  )}
                  {primaryNetworkDiagram.filePath && (
                    <a
                      href={primaryNetworkDiagram.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none' }}
                    >
                      🔗 새 탭에서 열기
                    </a>
                  )}
                </div>
              </div>

              {isImageFile(primaryNetworkDiagram.fileName, primaryNetworkDiagram.filePath) && primaryNetworkDiagram.filePath ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={primaryNetworkDiagram.filePath}
                      alt={primaryNetworkDiagram.title}
                      onClick={() => setLightboxImage(primaryNetworkDiagram.filePath)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '520px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        cursor: 'zoom-in',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      Page 1 (대표 이미지)
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8D99AE', marginTop: '0.6rem' }}>
                    🔍 이미지를 클릭하면 전체 화면으로 확대하여 볼 수 있습니다.
                  </div>
                </div>
              ) : primaryNetworkDiagram.filePath && primaryNetworkDiagram.filePath.toLowerCase().endsWith('.pdf') ? (
                <div style={{ width: '100%', height: '520px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe
                    src={`${primaryNetworkDiagram.filePath}${pdfViewMode === 'page1' ? '#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH' : ''}`}
                    title={primaryNetworkDiagram.title}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: '#fff' }}
                  />
                  {pdfViewMode === 'page1' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      right: '0.75rem',
                      background: 'rgba(11, 19, 43, 0.85)',
                      border: '1px solid rgba(0,180,216,0.3)',
                      color: 'var(--color-accent)',
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)',
                      pointerEvents: 'none'
                    }}>
                      📄 1페이지 미리보기 모드 활성화됨
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback File Card Preview */
                <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '3.8rem' }}>📄</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                    {primaryNetworkDiagram.fileName}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#8D99AE', maxWidth: '520px', lineHeight: '1.5' }}>
                    {primaryNetworkDiagram.description || '대표 망구성도 첨부 파일의 1페이지 미리보기입니다. 전체 파일 확인 및 다운로드는 아래 버튼을 이용하세요.'}
                  </p>
                  {primaryNetworkDiagram.filePath && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <a
                        href={primaryNetworkDiagram.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.55rem 1.2rem', fontSize: '0.88rem', textDecoration: 'none' }}
                      >
                        📖 새 탭에서 문서 열기
                      </a>
                      <a
                        href={primaryNetworkDiagram.filePath}
                        download={primaryNetworkDiagram.fileName}
                        className="btn btn-accent"
                        style={{ padding: '0.55rem 1.4rem', fontSize: '0.88rem', textDecoration: 'none' }}
                      >
                        📥 원본 다운로드 ({primaryNetworkDiagram.fileSize})
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Empty Primary State */
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>🗺️</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '0.4rem' }}>
              등록된 대표 사내 망구성도가 없습니다
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#8D99AE', marginBottom: '1.25rem' }}>
              사내 본사/지사 백본망 구성도 또는 랙 배치도 이미지/PDF 파일을 업로드하여 대표 문서로 지정해 주세요.
            </p>
            <button
              onClick={() => handleOpenCreateModal('망구성도')}
              className="btn btn-accent"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', fontWeight: 600 }}
            >
              📤 대표 망구성도 파일 업로드
            </button>
          </div>
        )}
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Category Tabs Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn ${activeCategory === cat ? 'btn-accent' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.84rem',
                  padding: '0.42rem 0.9rem',
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

          {/* Info Banner when filtering '망구성도' */}
          {activeCategory === '망구성도' && (
            <div style={{
              background: 'rgba(0, 180, 216, 0.1)',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--color-accent)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <span>💡 <strong>망구성도</strong> 카테고리는 1개의 대표 문서만 활성화되어 노출됩니다. 이전 버전은 [망구성도 히스토리]에서 확인 가능합니다.</span>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
              >
                📜 이전 버젼 히스토리 ({networkDiagramHistory.length}개)
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 4. Document List Display */}
      {filteredDocs.length === 0 ? (
        <div className="panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>등록된 문서가 없습니다</h3>
          <p style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            [{activeCategory === '전체' ? '전체 카테고리' : activeCategory}] 에 업로드된 사내망 관리 문서가 없습니다.
          </p>
          <button
            onClick={() => handleOpenCreateModal(activeCategory === '전체' ? '망구성도' : activeCategory)}
            className="btn btn-accent"
            style={{ padding: '0.6rem 1.3rem', fontSize: '0.88rem' }}
          >
            📤 첫 번째 문서 업로드하기
          </button>
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
                border: doc.isPrimary ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'rgba(0, 180, 216, 0.15)', color: 'var(--color-accent)', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {getCategoryIcon(doc.category)} {doc.category}
                    </span>
                    <span className="badge" style={{ ...getSecurityBadgeStyle(doc.securityLevel), fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {doc.securityLevel}
                    </span>
                    {doc.isPrimary && (
                      <span className="badge" style={{ background: '#00B4D8', color: '#000', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        📌 대표
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#8D99AE', fontFamily: 'monospace' }}>
                    {doc.version} | {doc.code}
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
                    <span style={{ fontWeight: 500 }}>관련 정보:</span>
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

              {/* Card Footer */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#8D99AE', marginBottom: '0.75rem' }}>
                  <span>✍️ {doc.author}</span>
                  <span>📅 {doc.date}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setViewDoc(doc)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  >
                    👁️ 상세
                  </button>

                  {doc.filePath ? (
                    <a
                      href={doc.filePath}
                      download={doc.fileName}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', color: 'var(--color-accent)', borderColor: 'rgba(0,180,216,0.3)', textDecoration: 'none' }}
                    >
                      📥 다운로드
                    </a>
                  ) : (
                    <button disabled className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', opacity: 0.5 }}>
                      📥 파일없음
                    </button>
                  )}

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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>코드</th>
                <th style={{ padding: '0.75rem 1rem' }}>분류</th>
                <th style={{ padding: '0.75rem 1rem' }}>보안등급</th>
                <th style={{ padding: '0.75rem 1rem' }}>문서 제목</th>
                <th style={{ padding: '0.75rem 1rem' }}>관련 IP/장비</th>
                <th style={{ padding: '0.75rem 1rem' }}>작성자</th>
                <th style={{ padding: '0.75rem 1rem' }}>등록일</th>
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
                    {doc.isPrimary && <span className="badge" style={{ background: '#00B4D8', color: '#000', fontSize: '0.65rem', marginLeft: '0.4rem', padding: '0.1rem 0.3rem' }}>📌 대표</span>}
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
                      {doc.filePath && (
                        <a href={doc.filePath} download={doc.fileName} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none' }}>다운로드</a>
                      )}
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
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge" style={{ ...getSecurityBadgeStyle(viewDoc.securityLevel), fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {viewDoc.securityLevel}
                </span>
                {viewDoc.isPrimary && (
                  <span className="badge" style={{ background: '#00B4D8', color: '#000', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem' }}>
                    📌 대표 문서
                  </span>
                )}
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
              {viewDoc.title}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', marginBottom: '1.25rem' }}>
              {getCategoryIcon(viewDoc.category)} 카테고리: {viewDoc.category} | 버젼: {viewDoc.version}
            </div>

            {/* File Preview Area if Image */}
            {viewDoc.filePath && isImageFile(viewDoc.fileName, viewDoc.filePath) && (
              <div style={{ background: '#000', borderRadius: '8px', padding: '0.5rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <img
                  src={viewDoc.filePath}
                  alt={viewDoc.title}
                  onClick={() => setLightboxImage(viewDoc.filePath)}
                  style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '6px' }}
                />
              </div>
            )}

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
                <span style={{ color: '#8D99AE' }}>파일 용량: </span>
                <span style={{ color: '#fff' }}>{viewDoc.fileSize || '-'}</span>
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

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                onClick={() => handleDeleteDoc(viewDoc.id)}
                className="btn btn-secondary"
                style={{ color: '#E63946', borderColor: 'rgba(230,57,70,0.4)', fontSize: '0.85rem' }}
              >
                🗑️ 삭제하기
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {viewDoc.category === '망구성도' && !viewDoc.isPrimary && (
                  <button
                    onClick={() => { handleSetPrimary(viewDoc.id); setViewDoc(null); }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', color: '#FFB703', borderColor: 'rgba(255,183,3,0.4)' }}
                  >
                    📌 대표 문서로 지정
                  </button>
                )}
                {viewDoc.filePath && (
                  <a
                    href={viewDoc.filePath}
                    download={viewDoc.fileName}
                    className="btn btn-accent"
                    style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                  >
                    📥 파일 다운로드
                  </a>
                )}
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

      {/* 6. Version History Modal for 망구성도 */}
      {isHistoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📜 사내 망구성도 버젼 히스토리
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#8D99AE' }}>
                  과거 업로드된 망구성도 이력을 확인하고 대표 문서(Primary)를 변경할 수 있습니다.
                </span>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            {networkDiagramHistory.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#8D99AE' }}>
                등록된 망구성도 이력이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {networkDiagramHistory.map((hDoc) => (
                  <div
                    key={hDoc.id}
                    style={{
                      background: hDoc.isPrimary ? 'rgba(0, 180, 216, 0.12)' : 'var(--bg-main)',
                      border: hDoc.isPrimary ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          {hDoc.version}
                        </span>
                        {hDoc.isPrimary && (
                          <span className="badge" style={{ background: '#00B4D8', color: '#000', fontSize: '0.72rem', fontWeight: 700 }}>
                            📌 현재 대표 문서
                          </span>
                        )}
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                          {hDoc.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#8D99AE', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <span>✍️ 작성자: {hDoc.author}</span>
                        <span>📅 등록일: {hDoc.date}</span>
                        <span>📄 파일: {hDoc.fileName} ({hDoc.fileSize})</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {!hDoc.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(hDoc.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', color: '#FFB703', borderColor: 'rgba(255,183,3,0.4)', padding: '0.35rem 0.65rem' }}
                        >
                          📌 대표 문서로 지정
                        </button>
                      )}
                      {hDoc.filePath && (
                        <a
                          href={hDoc.filePath}
                          download={hDoc.fileName}
                          className="btn btn-accent"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', textDecoration: 'none' }}
                        >
                          📥 다운로드
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDoc(hDoc.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', color: '#E63946', padding: '0.35rem 0.5rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1.25rem', textAlign: 'right', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. Add/Edit Document Upload Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
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
                {editingDoc ? '✏️ 문서 정보 수정' : '📤 신규 사내망 문서 업로드 / 등록'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* File Upload Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  📁 실제 첨부 파일 업로드 *
                </label>
                <div style={{
                  border: '2px dashed var(--color-accent)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: 'rgba(0, 180, 216, 0.05)',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  {isUploading ? (
                    <div style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem' }}>
                      ⏳ 파일 업로드 진행 중...
                    </div>
                  ) : formFileName ? (
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>✅</div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{formFileName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8D99AE', marginTop: '0.2rem' }}>
                        용량: {formFileSize} | 클릭하여 다른 파일로 교체 가능
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📥</div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                        이곳을 클릭하거나 파일(PNG, JPG, PDF, XLSX, 등)을 드래그하세요
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#8D99AE', marginTop: '0.25rem' }}>
                        망구성도 이미지 또는 네트워크 관리 문서를 업로드할 수 있습니다.
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                  placeholder="예: [본사/지사] 2026 통합 네트워크 망구성도"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>

              {/* Row 3: Category & Security Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>카테고리 분류</label>
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
                  관련 IP 대역 / 장비 정보 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 192.168.0.0/16, CoreSwitch-01, UTM-FW"
                  value={formTargetInfo}
                  onChange={e => setFormTargetInfo(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', fontFamily: 'monospace' }}
                />
              </div>

              {/* Checkbox for Primary Representative if 망구성도 */}
              {formCategory === '망구성도' && (
                <div style={{ background: 'rgba(0, 180, 216, 0.1)', padding: '0.65rem 0.85rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="isPrimaryCheck"
                    checked={formIsPrimary}
                    onChange={e => setFormIsPrimary(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isPrimaryCheck" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    📌 업로드 후 이 문서를 사내 대표 망구성도로 설정
                  </label>
                </div>
              )}

              {/* Row 6: Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8D99AE', marginBottom: '0.3rem' }}>상세 설명 및 메모</label>
                <textarea
                  rows={3}
                  placeholder="네트워크 변경 사항, 백본 스위치 구조, DMZ 구역 설명 등을 기재하세요."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              {/* Submit Buttons */}
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
                  disabled={isUploading}
                  className="btn btn-accent"
                  style={{ padding: '0.55rem 1.4rem', fontWeight: 600 }}
                >
                  {editingDoc ? '수정 완료' : '업로드 및 등록 저장'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 8. Image Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxImage}
            alt="망구성도 확대"
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
          />
          <button
            onClick={() => setLightboxImage(null)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '1.5rem', padding: '0.3rem 0.8rem', borderRadius: '50%', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>
      )}

    </div>
  );
}
