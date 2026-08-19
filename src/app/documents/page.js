'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_DOCUMENTS = [
  {
    id: 1,
    code: 'DOC-2026-DWG-001',
    title: '천안 A공장 생산라인 2구역 통합 배선 도면 (DWG)',
    category: '도면(DWG)',
    author: '김철수 과장',
    version: 'v2.1',
    date: '2026-08-18',
    fileSize: '18.4 MB',
    fileName: '천안A공장_배선도면_v2.1.dwg',
    downloads: 42,
    description: '천안 A공장 생산라인 2구역 UTP 120라인 및 광케이블 포설 기계실 계통 도면'
  },
  {
    id: 2,
    code: 'DOC-2026-PROP-012',
    title: '(주)한빛 스마트 오피스 IPT & IPCC 구축 제안서 (PDF)',
    category: '시공제안서',
    author: '박민우 대리',
    version: 'v1.0',
    date: '2026-08-12',
    fileSize: '5.2 MB',
    fileName: '한빛스마트오피스_IPT제안서.pdf',
    downloads: 18,
    description: 'UC 커뮤니케이션 및 150석 IP-PBX 교환기 연동 시스템 표준 제안서'
  },
  {
    id: 3,
    code: 'DOC-2026-TECH-NET-01',
    title: 'Cisco Catalyst 백본 스위치 VSS 이중화 및 STP 기술 매뉴얼 (PDF)',
    category: '기술문서 (네트워크)',
    author: '이강욱 팀장',
    version: 'v3.2',
    date: '2026-08-14',
    fileSize: '8.7 MB',
    fileName: 'Cisco_스위치_VSS이중화_기술매뉴얼.pdf',
    downloads: 65,
    description: '백본 스위치 이중화 가상화 VSS 구성 및 포트채널 링크 트래픽 장애 절체 기술 표준 가이드'
  },
  {
    id: 4,
    code: 'DOC-2026-TECH-IPT-02',
    title: 'Cisco IP-PBX 연동 SIP 게이트웨이 및 IP폰 내선 세팅 가이드 (PDF)',
    category: '기술문서 (IPT)',
    author: '최현우 과장',
    version: 'v2.0',
    date: '2026-08-16',
    fileSize: '6.4 MB',
    fileName: 'IPT_SIP게이트웨이_세팅가이드.pdf',
    downloads: 51,
    description: 'CUCM 교환기 단말 SIP 트렁크 연동, G.711 코덱 세팅 및 CP-7821 IP폰 내선 번호 설정 매뉴얼'
  },
  {
    id: 5,
    code: 'DOC-2026-FORM-005',
    title: '[양식] 현장 시공 준공 검사 확인서 표준 서식 (XLSX)',
    category: '서식/양식',
    author: '경영지원팀',
    version: 'v3.0',
    date: '2026-08-01',
    fileSize: '124 KB',
    fileName: '준공검사확인서_표준양식_v3.xlsx',
    downloads: 105,
    description: '아인스텍 표준 준공 검사 체크리스트 및 감리 승인 양식 서식'
  },
  {
    id: 6,
    code: 'DOC-2026-REP-008',
    title: '대전 R&D 센터 전산실 통합 네트워크 준공 보고서 (PDF)',
    category: '보고서',
    author: '이강욱 팀장',
    version: 'v1.0',
    date: '2026-08-15',
    fileSize: '12.8 MB',
    fileName: '대전RND_전산실_준공보고서.pdf',
    downloads: 29,
    description: 'Cisco 백본 스위치 이중화 구성 및 광케이블 OTDR 손실률 측정 결과 보고서'
  }
];

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

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('networkin_documents');
    if (saved) {
      try { setDocuments(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

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
  const handleSaveSubmit = (e) => {
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

    if (editingDoc) {
      const updated = documents.map(d => d.id === editingDoc.id ? docData : d);
      saveDocuments(updated);
      alert('문서 정보가 수정되었습니다.');
    } else {
      const updated = [docData, ...documents];
      saveDocuments(updated);
      alert('새로운 문서가 업로드/등록되었습니다.');
    }

    setIsModalOpen(false);
  };

  // Simulated File Download
  const handleDownloadFile = (doc) => {
    const updated = documents.map(d => {
      if (d.id === doc.id) return { ...d, downloads: d.downloads + 1 };
      return d;
    });
    saveDocuments(updated);
    alert(`[${doc.fileName}] 기술 문서 다운로드가 시작되었습니다.`);
  };

  // Delete Document
  const handleDeleteDoc = (id) => {
    if (confirm('이 문서를 완전히 삭제하시겠습니까?')) {
      const updated = documents.filter(d => d.id !== id);
      saveDocuments(updated);
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
