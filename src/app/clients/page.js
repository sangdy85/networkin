'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = ['전체', 'IT/통신', '제조업', '금융', '물류/유통', '공공기관', '교육/의료', '기타'];
const CONTRACT_STATUSES = ['전체', '유지보수 계약중', '시공 진행중', '계약 완료', '상담중'];

export default function ClientsPage() {
  const { currentUser } = useAuth();

  const [clients, setClients] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [industryFilter, setIndustryFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('IT/통신');
  const [formContactName, setFormContactName] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContractStatus, setFormContractStatus] = useState('유지보수 계약중');
  const [formContractDate, setFormContractDate] = useState('');
  const [formAssignedPm, setFormAssignedPm] = useState('');
  const [formMemo, setFormMemo] = useState('');

  // Fetch clients & registered users
  useEffect(() => {
    fetchClientsFromAPI();
    fetchUsersFromAPI();
  }, []);

  const fetchClientsFromAPI = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data || []);
      }
    } catch (e) {
      console.error('Fetch clients error', e);
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
      console.warn('Fetch users error in clients page', e);
    }
  };

  // Registered PM user list (excluding master admin)
  const pmUserList = registeredUsers.filter(u => u.id.toLowerCase() !== 'netadmin' && u.name !== '마스터 관리자' && u.role !== '마스터 관리자');

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormIndustry('IT/통신');
    setFormContactName('');
    setFormContactPhone('');
    setFormContactEmail('');
    setFormAddress('');
    setFormContractStatus('유지보수 계약중');
    setFormContractDate(new Date().toISOString().split('T')[0]);
    setFormAssignedPm(pmUserList[0]?.name || currentUser?.name || '담당자');
    setFormMemo('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cli) => {
    setEditingClient(cli);
    setFormName(cli.name);
    setFormIndustry(cli.industry || 'IT/통신');
    setFormContactName(cli.contact_name || '');
    setFormContactPhone(cli.contact_phone || '');
    setFormContactEmail(cli.contact_email || '');
    setFormAddress(cli.address || '');
    setFormContractStatus(cli.contract_status || '유지보수 계약중');
    setFormContractDate(cli.contract_date || new Date().toISOString().split('T')[0]);
    setFormAssignedPm(cli.assigned_pm || pmUserList[0]?.name || '담당자');
    setFormMemo(cli.memo || '');
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('고객사명을 입력해주세요.');
      return;
    }

    const payload = {
      id: editingClient ? editingClient.id : undefined,
      name: formName.trim(),
      industry: formIndustry,
      contact_name: formContactName.trim(),
      contact_phone: formContactPhone.trim(),
      contact_email: formContactEmail.trim(),
      address: formAddress.trim(),
      contract_status: formContractStatus,
      contract_date: formContractDate,
      assigned_pm: formAssignedPm,
      memo: formMemo.trim()
    };

    try {
      const method = editingClient ? 'PUT' : 'POST';
      const res = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingClient ? '고객사 정보가 수정되었습니다.' : '신규 고객사가 등록되었습니다.');
        setIsModalOpen(false);
        fetchClientsFromAPI();
      } else {
        const errData = await res.json();
        alert(`저장 실패: ${errData.error}`);
      }
    } catch (err) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  // Delete Client
  const handleDeleteClient = async (id) => {
    if (confirm('이 고객사 정보를 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          fetchClientsFromAPI();
        }
      } catch (err) {
        console.error('Delete client error', err);
      }
    }
  };

  // Filtering Logic
  const filteredClients = clients.filter(c => {
    const industryMatch = industryFilter === '전체' || c.industry === industryFilter;
    const statusMatch = statusFilter === '전체' || c.contract_status === statusFilter;
    const searchMatch = !searchQuery.trim() ||
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contact_phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.assigned_pm || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase());

    return industryMatch && statusMatch && searchMatch;
  });

  // Summary Metrics
  const totalCount = clients.length;
  const maintenanceCount = clients.filter(c => c.contract_status === '유지보수 계약중').length;
  const constructionCount = clients.filter(c => c.contract_status === '시공 진행중').length;

  return (
    <div>
      {/* Top Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">🏢 고객사 관리 센터 (Client Hub)</h1>
          <p className="portal-subtitle">아인스텍 주요 고객사 인프라 계약 현황, 담당 PM, 연락처 정보 대시보드</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-accent" style={{ padding: '0.65rem 1.2rem', fontWeight: 600 }}>
          + 신규 고객사 등록
        </button>
      </header>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="panel" style={{ padding: '1.1rem', background: 'rgba(0,180,216,0.06)', borderLeft: '4px solid #00B4D8' }}>
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>총 등록 고객사</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>{totalCount} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>개사</span></div>
        </div>

        <div className="panel" style={{ padding: '1.1rem', background: 'rgba(56,176,0,0.06)', borderLeft: '4px solid #38B000' }}>
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>유지보수 계약 고객사</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38B000', marginTop: '0.2rem' }}>{maintenanceCount} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>개사</span></div>
        </div>

        <div className="panel" style={{ padding: '1.1rem', background: 'rgba(255,183,3,0.06)', borderLeft: '4px solid #FFB703' }}>
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>시공/공사 진행 고객사</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFB703', marginTop: '0.2rem' }}>{constructionCount} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>개사</span></div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Industry Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>업종:</span>
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}>
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Contract Status Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>계약상태:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}>
              {CONTRACT_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="고객사명, 코드, 담당자, 주소 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '250px' }}
          />
        </div>

      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>
                {editingClient ? '✏️ 고객사 정보 수정' : '🏢 신규 고객사 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사 / 기관명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 삼성전자 천안사업장"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>업종 분류</label>
                  <select
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    {INDUSTRIES.filter(i => i !== '전체').map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>계약 상태</label>
                  <select
                    value={formContractStatus}
                    onChange={(e) => setFormContractStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                  >
                    {CONTRACT_STATUSES.filter(s => s !== '전체').map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사 담당자명</label>
                  <input
                    type="text"
                    placeholder="예: 김민지 과장"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>담당자 연락처</label>
                  <input
                    type="text"
                    placeholder="예: 010-1234-5678"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>이메일</label>
                  <input
                    type="email"
                    placeholder="mj@client.com"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>사업장 주소</label>
                <input
                  type="text"
                  placeholder="예: 충남 천안시 서북구 성성동 123"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>계약/등록일</label>
                  <input
                    type="date"
                    value={formContractDate}
                    onChange={(e) => setFormContractDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>👤 사내 전담 PM / 엔지니어</label>
                  <select
                    value={formAssignedPm}
                    onChange={(e) => setFormAssignedPm(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                  >
                    {pmUserList.map(u => {
                      const nameRank = `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim();
                      return (
                        <option key={u.id} value={nameRank}>{nameRank}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>비고 및 메모 사항</label>
                <textarea
                  rows={3}
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  placeholder="특이사항, 회선 정보, 네트워크 인프라 요구사항 메모..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingClient ? '수정 완료' : '고객사 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Drawer */}
      {viewClient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {viewClient.code}
                  </span>
                  <span className="badge" style={{ background: viewClient.contract_status === '유지보수 계약중' ? 'rgba(56,176,0,0.2)' : 'rgba(255,183,3,0.2)', color: viewClient.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703', fontSize: '0.75rem' }}>
                    {viewClient.contract_status}
                  </span>
                </div>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff' }}>{viewClient.name}</h2>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.2rem' }}>업종: <strong style={{ color: '#fff' }}>{viewClient.industry}</strong></div>
              </div>
              <button onClick={() => setViewClient(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>고객사 담당자:</span> <strong>{viewClient.contact_name || '-'}</strong></div>
                <div><span style={{ color: '#aaa' }}>연락처:</span> <strong>{viewClient.contact_phone || '-'}</strong></div>
                <div><span style={{ color: '#aaa' }}>이메일:</span> <strong>{viewClient.contact_email || '-'}</strong></div>
                <div><span style={{ color: '#aaa' }}>계약일자:</span> <strong>{viewClient.contract_date || '-'}</strong></div>
              </div>

              <div style={{ background: 'rgba(0,180,216,0.06)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.2)' }}>
                <span style={{ color: '#00B4D8', fontWeight: 700, fontSize: '0.85rem' }}>👤 사내 전담 PM / 담당 엔지니어:</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{viewClient.assigned_pm || '미지정'}</div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📍 사업장 주소:</span>
                <div style={{ color: '#fff', fontWeight: 500 }}>{viewClient.address || '주소 미입력'}</div>
              </div>

              {viewClient.memo && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 비고 및 특이사항:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewClient.memo}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewClient); setViewClient(null); }} className="btn btn-accent">✏️ 정보 수정</button>
              <button onClick={() => setViewClient(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">🏢 고객사 목록 현황</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredClients.length}개사</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>고객사 코드</th>
              <th>고객사명</th>
              <th>업종</th>
              <th>담당자 / 연락처</th>
              <th>사업장 주소</th>
              <th>계약 상태</th>
              <th>전담 PM</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{c.code}</td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{c.name}</td>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {c.industry}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.contact_name || '-'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{c.contact_phone}</div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#ccc', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: c.contract_status === '유지보수 계약중' ? 'rgba(56,176,0,0.15)' : 'rgba(255,183,3,0.15)',
                      color: c.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703'
                    }}>
                      {c.contract_status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: '#00B4D8', fontWeight: 600 }}>
                      👤 {c.assigned_pm || '미지정'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => setViewClient(c)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        🔍 상세
                      </button>
                      <button onClick={() => handleOpenEditModal(c)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        ✏️ 수정
                      </button>
                      <button onClick={() => handleDeleteClient(c.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E63946' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 고객사 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
