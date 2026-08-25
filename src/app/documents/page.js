'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_DOCUMENTS = [];

export default function DocumentsPage() {
  const { currentUser } = useAuth();

  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);

  // Upload Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('도면(DWG)');
  const [formAuthor, setFormAuthor] = useState('');
  const [formVersion, setFormVersion] = useState('v1.0');
  const [formFileName, setFormFileName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Fetch from Real Backend SQLite API `/api/documents`
  useEffect(() => {
    fetchDocsFromAPI();
  }, []);

  const fetchDocsFromAPI = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
        return;
      }
    } catch (e) {
      console.warn('Docs API error', e);
    }
    setDocuments([]);
  };

  const saveDocuments = (newDocs) => {
    setDocuments(newDocs);
    localStorage.setItem('networkin_documents', JSON.stringify(newDocs));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormTitle('');
    setFormCategory('기술문서 (네트워크)');
    setFormAuthor(currentUser?.name || currentUser?.id || '이강욱 팀장');
    setFormVersion('v1.0');
    setFormFileName('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (doc) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormAuthor(doc.author);
    setFormVersion(doc.version);
    setFormFileName(doc.fileName);
    setFormDescription(doc.description || '');
    setIsModalOpen(true);
  };

  // Save Document (Create / Edit)
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('문서 제목을 입력해 주세요.');
      return;
    }

    const catPrefix = formCategory.includes('네트워크') ? 'TECH-NET' : formCategory.includes('IPT') ? 'TECH-IPT' : formCategory.slice(0, 3).toUpperCase();

    const docData = {
      id: editingDoc ? editingDoc.id : Date.now(),
      code: editingDoc ? editingDoc.code : `DOC-2026-${catPrefix}-${String(documents.length + 10).padStart(3, '0')}`,
      title: formTitle.trim(),
      category: formCategory,
      author: formAuthor.trim() || '담당자',
      version: formVersion.trim() || 'v1.0',
      date: new Date().toISOString().split('T')[0],
      fileSize: editingDoc ? editingDoc.fileSize : '4.2 MB',
      fileName: formFileName.trim() || `${formTitle.trim().replace(/\s+/g, '_')}.${formCategory.includes('도면') ? 'dwg' : 'pdf'}`,
      downloads: editingDoc ? editingDoc.downloads : 0,
      description: formDescription.trim()
    };

    try {
      const method = editingDoc ? 'PUT' : 'POST';
      const res = await fetch('/api/documents', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      if (res.ok) {
        alert(editingDoc ? '문서 정보가 수정되었습니다.' : '새로운 문서가 업로드/등록되었습니다.');
        fetchDocsFromAPI();
      }
    } catch (err) {
      console.error('Doc save error', err);
    }

    setIsModalOpen(false);
  };

  // Simulated File Download
  const handleDownloadFile = (doc) => {
    alert(`[${doc.fileName}] 기술 문서 다운로드가 시작되었습니다.`);
  };

  // Delete Document
  const handleDeleteDoc = async (id) => {
    if (confirm('이 문서를 완전히 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          fetchDocsFromAPI();
        }
      } catch (err) {
        console.error('Doc delete error', err);
      }
    }
  };

  // Filtering Logic
  const filteredDocuments = documents.filter(doc => {
    const catMatch = activeCategory === 'all' || doc.category === activeCategory;
    const searchMatch = !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">📁 문서 관리 센터 (Document Hub)</h1>
          <p className="portal-subtitle">네트워크 & IPT 기술문서, 시공 도면(DWG), 사업 제안서, 준공보고서 통합 관리</p>
        </div>
        <button className="btn btn-accent" onClick={handleOpenCreateModal}>+ 신규 문서 업로드</button>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Category Tabs Including 기술문서 (네트워크) and 기술문서 (IPT) */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeCategory === 'all' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('all')}
            style={{ fontSize: '0.85rem' }}
          >
            전체 문서 ({documents.length})
          </button>
          <button 
            className={`btn ${activeCategory === '기술문서 (네트워크)' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('기술문서 (네트워크)')}
            style={{ fontSize: '0.85rem' }}
          >
            📘 기술문서 (네트워크) ({documents.filter(d => d.category === '기술문서 (네트워크)').length})
          </button>
          <button 
            className={`btn ${activeCategory === '기술문서 (IPT)' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('기술문서 (IPT)')}
            style={{ fontSize: '0.85rem' }}
          >
            📞 기술문서 (IPT) ({documents.filter(d => d.category === '기술문서 (IPT)').length})
          </button>
          <button 
            className={`btn ${activeCategory === '도면(DWG)' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('도면(DWG)')}
            style={{ fontSize: '0.85rem' }}
          >
            📐 도면(DWG)
          </button>
          <button 
            className={`btn ${activeCategory === '시공제안서' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('시공제안서')}
            style={{ fontSize: '0.85rem' }}
          >
            📑 시공제안서
          </button>
          <button 
            className={`btn ${activeCategory === '서식/양식' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('서식/양식')}
            style={{ fontSize: '0.85rem' }}
          >
            📝 서식/양식
          </button>
          <button 
            className={`btn ${activeCategory === '보고서' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('보고서')}
            style={{ fontSize: '0.85rem' }}
          >
            📊 보고서
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="문서명/코드/작성자 검색..."
          style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem', width: '220px' }}
        />
      </div>

      {/* Upload Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)' }}>
            <div className="panel-header">
              <h2 className="panel-title">{editingDoc ? '✏️ 문서 정보 수정' : '➕ 신규 문서 업로드'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>문서 제목 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="예: Cisco 스위치 VSS 이중화 구성 매뉴얼"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.3rem' }}>문서 분류 *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 600 }}
                  >
                    <option value="기술문서 (네트워크)">📘 기술문서 (네트워크)</option>
                    <option value="기술문서 (IPT)">📞 기술문서 (IPT)</option>
                    <option value="도면(DWG)">📐 도면(DWG)</option>
                    <option value="시공제안서">📑 시공제안서</option>
                    <option value="서식/양식">📝 서식/양식</option>
                    <option value="보고서">📊 보고서</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>버전 (Version)</label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="예: v1.0, v3.2"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>작성자 / 등록자</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="예: 이강욱 팀장"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>첨부 파일명</label>
                  <input
                    type="text"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    placeholder="예: Cisco_스위치_VSS매뉴얼.pdf"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>기술문서 개요 및 설명</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="기술 개요, 장비 연동 세팅 매뉴얼 요약을 입력해 주세요..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingDoc ? '수정 완료' : '업로드 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Drawer */}
      {viewDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700 }}>{viewDoc.code}</span>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff', marginTop: '0.2rem' }}>{viewDoc.title}</h2>
              </div>
              <button onClick={() => setViewDoc(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>분류:</span> <strong>{viewDoc.category}</strong></div>
                <div><span style={{ color: '#aaa' }}>버전:</span> <strong>{viewDoc.version}</strong></div>
                <div><span style={{ color: '#aaa' }}>작성자:</span> <strong>{viewDoc.author}</strong></div>
                <div><span style={{ color: '#aaa' }}>등록일:</span> <strong>{viewDoc.date}</strong></div>
              </div>

              {viewDoc.description && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 기술문서 개요:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.5' }}>{viewDoc.description}</p>
                </div>
              )}

              <div style={{ background: 'rgba(0,180,216,0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>📎 {viewDoc.fileName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '0.2rem' }}>파일 크기: {viewDoc.fileSize} | 다운로드: {viewDoc.downloads}회</div>
                </div>
                <button onClick={() => handleDownloadFile(viewDoc)} className="btn btn-accent" style={{ fontSize: '0.82rem' }}>⬇️ 파일 다운로드</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewDoc); setViewDoc(null); }} className="btn btn-secondary">✏️ 수정</button>
              <button onClick={() => setViewDoc(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📋 보관 및 공유 문서 목록</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredDocuments.length}건 목록</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>문서코드</th>
              <th>문서 제목</th>
              <th>분류</th>
              <th>작성자</th>
              <th>버전</th>
              <th>등록일</th>
              <th>용량</th>
              <th style={{ width: '160px', textAlign: 'center' }}>다운로드 및 관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent)', fontSize: '0.85rem' }}>{doc.code}</td>
                  <td style={{ fontWeight: 600, color: '#fff', cursor: 'pointer' }} onClick={() => setViewDoc(doc)}>
                    {doc.title}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      background: doc.category.includes('네트워크') ? 'rgba(0,180,216,0.15)' : doc.category.includes('IPT') ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                      color: doc.category.includes('네트워크') ? '#00B4D8' : doc.category.includes('IPT') ? '#3B82F6' : '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {doc.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{doc.author}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600 }}>{doc.version}</td>
                  <td style={{ fontSize: '0.8rem', color: '#aaa' }}>{doc.date}</td>
                  <td style={{ fontSize: '0.8rem', color: '#aaa' }}>{doc.fileSize}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => handleDownloadFile(doc)} className="btn btn-accent" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}>
                        ⬇️ 받기 ({doc.downloads})
                      </button>
                      <button onClick={() => setViewDoc(doc)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        🔍
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E63946' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 문서가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
