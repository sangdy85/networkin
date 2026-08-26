'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CONTRACT_STATUSES = ['전체', '유지보수 계약중', '프로젝트 진행중', '계약 완료', '상담중'];

export default function ClientsPage() {
  const { currentUser } = useAuth();

  const [clients, setClients] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Detail Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);

  // Detail Modal Tab & Sub-state
  const [activeDetailTab, setActiveDetailTab] = useState('info'); // 'info' | 'history' | 'network'
  const [clientHistory, setClientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Network Config Edit State inside Detail Tab 3
  const [netConfigForm, setNetConfigForm] = useState({
    isp: '',
    ipSubnet: '',
    gateway: '',
    dnsPrimary: '',
    dnsSecondary: '',
    equipments: [],
    notes: ''
  });
  const [newEquipType, setNewEquipType] = useState('UTM 방화벽');
  const [newEquipModel, setNewEquipModel] = useState('');
  const [newEquipLocation, setNewEquipLocation] = useState('');

  // Form State for Client Register/Edit
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formContacts, setFormContacts] = useState([
    { name: '', phone: '', email: '', duty: '대표 담당자' }
  ]);
  const [formAddress, setFormAddress] = useState('');
  const [formContractStatus, setFormContractStatus] = useState('유지보수 계약중');
  const [formContractDate, setFormContractDate] = useState('');
  const [formEngineerPrimary, setFormEngineerPrimary] = useState('');
  const [formEngineerSecondary, setFormEngineerSecondary] = useState('미지정');
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

  // Fetch Work History for Selected Client
  const fetchClientHistory = async (clientName) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/clients/history?clientName=${encodeURIComponent(clientName)}`);
      if (res.ok) {
        const data = await res.json();
        setClientHistory(data || []);
      }
    } catch (e) {
      console.error('Fetch history error', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Client Detail Modal View
  const handleOpenDetailModal = (cli) => {
    setViewClient(cli);
    setActiveDetailTab('info');
    fetchClientHistory(cli.name);

    // Initialize Network Config Form
    const cfg = cli.network_config || {};
    setNetConfigForm({
      isp: cfg.isp || 'KT 전용회선 (1G)',
      ipSubnet: cfg.ipSubnet || '192.168.10.0/24',
      gateway: cfg.gateway || '192.168.10.1',
      dnsPrimary: cfg.dnsPrimary || '168.126.63.1',
      dnsSecondary: cfg.dnsSecondary || '168.126.63.2',
      equipments: Array.isArray(cfg.equipments) ? cfg.equipments : [],
      notes: cfg.notes || ''
    });
  };

  // Save Network Config in Detail Tab 3
  const handleSaveNetworkConfig = async () => {
    if (!viewClient) return;
    const updatedClient = {
      ...viewClient,
      network_config: netConfigForm
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient)
      });

      if (res.ok) {
        alert('고객사 구성 정보 및 인프라 설정이 저장되었습니다!');
        setViewClient(updatedClient);
        fetchClientsFromAPI();
      } else {
        alert('구성 정보 저장 실패');
      }
    } catch (e) {
      alert(`저장 중 오류: ${e.message}`);
    }
  };

  // Add Equipment item
  const handleAddEquipment = () => {
    if (!newEquipModel.trim()) return;
    setNetConfigForm({
      ...netConfigForm,
      equipments: [
        ...netConfigForm.equipments,
        { type: newEquipType, model: newEquipModel.trim(), location: newEquipLocation.trim() || '서버실' }
      ]
    });
    setNewEquipModel('');
    setNewEquipLocation('');
  };

  const handleRemoveEquipment = (index) => {
    setNetConfigForm({
      ...netConfigForm,
      equipments: netConfigForm.equipments.filter((_, idx) => idx !== index)
    });
  };

  // Registered Engineer user list (excluding master admin)
  const engineerUsers = registeredUsers.filter(u => u.id.toLowerCase() !== 'netadmin' && u.name !== '마스터 관리자' && u.role !== '마스터 관리자');

  // Contact person helper handlers
  const handleAddContact = () => {
    setFormContacts([
      ...formContacts,
      { name: '', phone: '', email: '', duty: '담당자' }
    ]);
  };

  const handleRemoveContact = (index) => {
    if (formContacts.length === 1) return;
    setFormContacts(formContacts.filter((_, idx) => idx !== index));
  };

  const handleContactChange = (index, field, value) => {
    const updated = [...formContacts];
    updated[index][field] = value;
    setFormContacts(updated);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormIndustry('');
    setFormContacts([{ name: '', phone: '', email: '', duty: '대표 담당자' }]);
    setFormAddress('');
    setFormContractStatus('유지보수 계약중');
    setFormContractDate(new Date().toISOString().split('T')[0]);
    
    const defaultEng = engineerUsers[0]?.name ? `${engineerUsers[0].name}${engineerUsers[0].rank ? ' ' + engineerUsers[0].rank : ''}`.trim() : currentUser?.name || '담당자';
    setFormEngineerPrimary(defaultEng);
    setFormEngineerSecondary('미지정');
    setFormMemo('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cli) => {
    setEditingClient(cli);
    setFormName(cli.name);
    setFormIndustry(cli.industry || '');
    
    if (Array.isArray(cli.contacts) && cli.contacts.length > 0) {
      setFormContacts(cli.contacts);
    } else if (cli.contact_name || cli.contact_phone || cli.contact_email) {
      setFormContacts([{
        name: cli.contact_name || '',
        phone: cli.contact_phone || '',
        email: cli.contact_email || '',
        duty: '대표 담당자'
      }]);
    } else {
      setFormContacts([{ name: '', phone: '', email: '', duty: '대표 담당자' }]);
    }

    setFormAddress(cli.address || '');
    setFormContractStatus(cli.contract_status || '유지보수 계약중');
    setFormContractDate(cli.contract_date || new Date().toISOString().split('T')[0]);
    setFormEngineerPrimary(cli.engineer_primary || cli.assigned_pm || '담당자');
    setFormEngineerSecondary(cli.engineer_secondary || '미지정');
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
      industry: formIndustry.trim(),
      contacts: formContacts.filter(c => c.name.trim() || c.phone.trim()),
      address: formAddress.trim(),
      contract_status: formContractStatus,
      contract_date: formContractDate,
      engineer_primary: formEngineerPrimary,
      engineer_secondary: formEngineerSecondary,
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
    const statusMatch = statusFilter === '전체' || c.contract_status === statusFilter;
    const searchMatch = !searchQuery.trim() ||
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.engineer_primary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.engineer_secondary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contacts || []).some(cnt => (cnt.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (cnt.phone || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Summary Metrics
  const totalCount = clients.length;
  const maintenanceCount = clients.filter(c => c.contract_status === '유지보수 계약중').length;
  const projectCount = clients.filter(c => c.contract_status === '프로젝트 진행중').length;

  return (
    <div>
      {/* Top Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">🏢 고객사 관리 센터 (Client Hub)</h1>
          <p className="portal-subtitle">아인스텍 주요 고객사 인프라 구성 정보, 작업 이력, 전담 엔지니어(정/부) 통합 관리</p>
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
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>프로젝트 진행 고객사</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFB703', marginTop: '0.2rem' }}>{projectCount} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>개사</span></div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600 }}>계약 상태 필터:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--color-accent)', color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>
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
            placeholder="고객사명, 코드, 업종, 엔지니어, 담당자 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '280px' }}
          />
        </div>

      </div>

      {/* Register / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>
                {editingClient ? '✏️ 고객사 정보 수정' : '🏢 신규 고객사 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>업종 분류 (직접 입력)</label>
                  <input
                    type="text"
                    placeholder="예: 반도체 제조업, IT 네트워크..."
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              {/* Dynamic Multiple Client Contacts */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                    👥 고객사 담당자 정보 (다중 추가 가능)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="btn btn-accent"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                  >
                    + 담당자 추가
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {formContacts.map((cnt, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.5fr 0.9fr auto', gap: '0.4rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                      <input
                        type="text"
                        placeholder="담당자명 (예: 김민지)"
                        value={cnt.name}
                        onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="연락처 (예: 010-1234-5678)"
                        value={cnt.phone}
                        onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="email"
                        placeholder="이메일 (mj@client.com)"
                        value={cnt.email}
                        onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="직책/직무"
                        value={cnt.duty || ''}
                        onChange={(e) => handleContactChange(idx, 'duty', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      {formContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(idx)}
                          style={{ background: 'none', border: 'none', color: '#E63946', fontSize: '1rem', cursor: 'pointer', padding: '0 0.3rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary & Secondary Dedicated Engineers */}
              <div style={{ background: 'rgba(0,180,216,0.06)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,180,216,0.25)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#00B4D8', fontWeight: 700, marginBottom: '0.6rem' }}>
                  🛠️ 사내 전담 엔지니어 지정 (정 / 부)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>전담 엔지니어 (정) *</label>
                    <select
                      value={formEngineerPrimary}
                      onChange={(e) => setFormEngineerPrimary(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                    >
                      {engineerUsers.map(u => {
                        const label = `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim();
                        return (
                          <option key={u.id} value={label}>👤 {label} ({u.department || '네트워크'})</option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>전담 엔지니어 (부 - 백업)</label>
                    <select
                      value={formEngineerSecondary}
                      onChange={(e) => setFormEngineerSecondary(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontWeight: 500 }}
                    >
                      <option value="미지정">미지정</option>
                      {engineerUsers.map(u => {
                        const label = `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim();
                        return (
                          <option key={u.id} value={label}>👤 {label} ({u.department || '네트워크'})</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>계약 / 등록일</label>
                  <input
                    type="date"
                    value={formContractDate}
                    onChange={(e) => setFormContractDate(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>비고 및 메모 사항</label>
                <textarea
                  rows={3}
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  placeholder="특이사항, 회선 정보, 인프라 장비 메모..."
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

      {/* Comprehensive Client Detail & Management Center Modal (Opened on Click) */}
      {viewClient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', background: 'var(--bg-card)' }}>
            
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    {viewClient.code}
                  </span>
                  <span className="badge" style={{ background: viewClient.contract_status === '유지보수 계약중' ? 'rgba(56,176,0,0.2)' : 'rgba(255,183,3,0.2)', color: viewClient.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703', fontSize: '0.78rem', fontWeight: 700 }}>
                    ● {viewClient.contract_status}
                  </span>
                  {viewClient.industry && (
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', color: '#ccc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {viewClient.industry}
                    </span>
                  )}
                </div>
                <h2 className="panel-title" style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>{viewClient.name}</h2>
                <div style={{ fontSize: '0.82rem', color: '#aaa', marginTop: '0.3rem' }}>📍 {viewClient.address || '주소 미입력'}</div>
              </div>
              <button onClick={() => setViewClient(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Interactive Tab Selector Header */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveDetailTab('info')}
                className={`btn ${activeDetailTab === 'info' ? 'btn-accent' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', fontWeight: 600 }}
              >
                📋 고객사 기본 정보 & 담당자
              </button>
              <button
                onClick={() => setActiveDetailTab('history')}
                className={`btn ${activeDetailTab === 'history' ? 'btn-accent' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', fontWeight: 600 }}
              >
                🛠️ 작업 및 장애 처리 이력 ({clientHistory.length}건)
              </button>
              <button
                onClick={() => setActiveDetailTab('network')}
                className={`btn ${activeDetailTab === 'network' ? 'btn-accent' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', fontWeight: 600 }}
              >
                🌐 고객사 구성 정보 & 장비 현황
              </button>
            </div>

            {/* TAB 1: Basic Profile & Contacts */}
            {activeDetailTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                
                {/* Engineers info */}
                <div style={{ background: 'rgba(0,180,216,0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.25)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <span style={{ color: '#00B4D8', fontWeight: 700, fontSize: '0.8rem' }}>👤 전담 엔지니어 (정):</span>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{viewClient.engineer_primary || '미지정'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#aaa', fontWeight: 600, fontSize: '0.8rem' }}>👤 전담 엔지니어 (부):</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ddd', marginTop: '0.2rem' }}>{viewClient.engineer_secondary || '미지정'}</div>
                  </div>
                </div>

                {/* Contacts info list */}
                <div>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>👥 고객사 담당자 목록 ({Array.isArray(viewClient.contacts) ? viewClient.contacts.length : 1}명):</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(Array.isArray(viewClient.contacts) && viewClient.contacts.length > 0 ? viewClient.contacts : [{ name: viewClient.contact_name, phone: viewClient.contact_phone, email: viewClient.contact_email }]).map((c, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{c.name || '담당자'}</strong>
                          {c.duty && <span style={{ fontSize: '0.78rem', color: '#aaa', marginLeft: '0.5rem' }}>({c.duty})</span>}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#aaa', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {c.phone && <a href={`tel:${c.phone}`} style={{ color: '#00B4D8', textDecoration: 'none' }}>📞 {c.phone}</a>}
                          {c.email && <a href={`mailto:${c.email}`} style={{ color: '#00B4D8', textDecoration: 'none' }}>✉️ {c.email}</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                  <div><span style={{ color: '#aaa' }}>계약 등록일:</span> <strong>{viewClient.contract_date || '-'}</strong></div>
                  <div><span style={{ color: '#aaa' }}>업종 분류:</span> <strong>{viewClient.industry || '미지정'}</strong></div>
                </div>

                {viewClient.memo && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 비고 및 특이사항:</span>
                    <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{viewClient.memo}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Work & Service History */}
            {activeDetailTab === 'history' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
                    <strong>{viewClient.name}</strong> 고객사의 유지보수, IPT, 네트워크, 시공, 회의 집계 이력 목록
                  </span>
                  <button onClick={() => fetchClientHistory(viewClient.name)} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
                    🔄 새로고침
                  </button>
                </div>

                {historyLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>작업 처리 이력을 불러오는 중...</div>
                ) : clientHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '55vh', overflowY: 'auto' }}>
                    {clientHistory.map((h) => (
                      <div key={h.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: `1px solid ${h.badgeColor || 'var(--border-color)'}`, borderLeft: `4px solid ${h.badgeColor || 'var(--color-accent)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge" style={{ background: h.badgeColor || 'var(--color-primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                              {h.category}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>📅 {h.date}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#fff', fontWeight: 600 }}>
                            {h.status}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: '0.25rem' }}>{h.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#aaa' }}>
                          <div>{h.content}</div>
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            {(h.workers || []).map((w, idx) => (
                              <span key={idx} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                👤 {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#aaa', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    등록된 작업 이력이 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Client Network Config & Infrastructure Setup */}
            {activeDetailTab === 'network' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
                
                {/* Line & IP Setup */}
                <div style={{ background: 'rgba(0,180,216,0.06)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.25)' }}>
                  <span style={{ color: '#00B4D8', fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
                    🌐 네트워크 회선 및 IP 할당 정보
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '0.2rem' }}>ISP 회선종류</label>
                      <input
                        type="text"
                        placeholder="예: KT 전용회선 (1G)"
                        value={netConfigForm.isp}
                        onChange={e => setNetConfigForm({ ...netConfigForm, isp: e.target.value })}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '0.2rem' }}>메인 IP 대역 (CIDR)</label>
                      <input
                        type="text"
                        placeholder="예: 211.234.100.0/24"
                        value={netConfigForm.ipSubnet}
                        onChange={e => setNetConfigForm({ ...netConfigForm, ipSubnet: e.target.value })}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '0.2rem' }}>게이트웨이</label>
                      <input
                        type="text"
                        placeholder="예: 211.234.100.1"
                        value={netConfigForm.gateway}
                        onChange={e => setNetConfigForm({ ...netConfigForm, gateway: e.target.value })}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '0.2rem' }}>DNS 서버</label>
                      <input
                        type="text"
                        placeholder="예: 168.126.63.1"
                        value={netConfigForm.dnsPrimary}
                        onChange={e => setNetConfigForm({ ...netConfigForm, dnsPrimary: e.target.value })}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Installed Equipments Table */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.6rem' }}>
                    💻 설치 및 구축 장비 현황 ({netConfigForm.equipments.length}대)
                  </span>

                  {/* Add Equipment Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr auto', gap: '0.4rem', marginBottom: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '6px' }}>
                    <select
                      value={newEquipType}
                      onChange={e => setNewEquipType(e.target.value)}
                      style={{ padding: '0.45rem', borderRadius: '4px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="UTM 방화벽">UTM 방화벽</option>
                      <option value="백본 스위치">백본 스위치</option>
                      <option value="L2/L3 스위치">L2/L3 스위치</option>
                      <option value="무선 AP">무선 AP</option>
                      <option value="IPT 교환기">IPT 교환기</option>
                      <option value="서버/NAS">서버/NAS</option>
                      <option value="기타 인프라">기타 인프라</option>
                    </select>
                    <input
                      type="text"
                      placeholder="장비 모델명/시리얼 (예: FortiGate 100F)"
                      value={newEquipModel}
                      onChange={e => setNewEquipModel(e.target.value)}
                      style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                    />
                    <input
                      type="text"
                      placeholder="설치 위치 (예: 3층 랙1)"
                      value={newEquipLocation}
                      onChange={e => setNewEquipLocation(e.target.value)}
                      style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={handleAddEquipment} className="btn btn-accent" style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
                      + 장비 추가
                    </button>
                  </div>

                  {netConfigForm.equipments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {netConfigForm.equipments.map((eq, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.45rem 0.75rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ color: '#00B4D8', fontWeight: 600, marginRight: '0.5rem' }}>[{eq.type}]</span>
                            <strong style={{ color: '#fff' }}>{eq.model}</strong>
                            <span style={{ color: '#aaa', marginLeft: '0.6rem', fontSize: '0.78rem' }}>📍 {eq.location}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveEquipment(idx)} style={{ background: 'none', border: 'none', color: '#E63946', cursor: 'pointer', fontSize: '0.9rem' }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#aaa', padding: '0.8rem', textAlign: 'center' }}>등록된 인프라 장비가 없습니다. 위 입력창에서 추가하세요.</div>
                  )}
                </div>

                {/* Config Notes */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.2rem' }}>구성 특이사항 및 노하우 메모</label>
                  <textarea
                    rows={2}
                    value={netConfigForm.notes}
                    onChange={e => setNetConfigForm({ ...netConfigForm, notes: e.target.value })}
                    placeholder="네트워크 이중화 설정, VLAN 구역 분리 내역 작성..."
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={handleSaveNetworkConfig} className="btn btn-accent" style={{ padding: '0.5rem 1.2rem', fontWeight: 600 }}>
                    💾 구성 정보 및 장비 현황 저장
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewClient); setViewClient(null); }} className="btn btn-accent">✏️ 고객사 정보 수정</button>
              <button onClick={() => setViewClient(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">🏢 고객사 목록 현황 (클릭시 작업 이력 및 구성 정보 통합 관리)</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredClients.length}개사</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>고객사 코드</th>
              <th>고객사명</th>
              <th>업종</th>
              <th>담당자 목록</th>
              <th>사업장 주소</th>
              <th>계약 상태</th>
              <th>전담 엔지니어 (정/부)</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(c => (
                <tr
                  key={c.id}
                  onClick={() => handleOpenDetailModal(c)}
                  style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  className="table-row-hover"
                >
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{c.code}</td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>
                    <span style={{ borderBottom: '1px dotted var(--color-accent)' }}>{c.name}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {c.industry || '미지정'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      {(Array.isArray(c.contacts) && c.contacts.length > 0 ? c.contacts : [{ name: c.contact_name, phone: c.contact_phone }]).map((cnt, idx) => (
                        <div key={idx} style={{ fontSize: '0.82rem' }}>
                          <strong style={{ color: '#fff' }}>{cnt.name || '-'}</strong>
                          {cnt.phone && <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '0.3rem' }}>({cnt.phone})</span>}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#ccc', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</td>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.8rem' }}>
                      <span style={{ color: '#00B4D8', fontWeight: 600 }}>정: {c.engineer_primary || c.assigned_pm || '미지정'}</span>
                      {c.engineer_secondary && c.engineer_secondary !== '미지정' && (
                        <span style={{ color: '#aaa', fontSize: '0.75rem' }}>부: {c.engineer_secondary}</span>
                      )}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenDetailModal(c)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
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
