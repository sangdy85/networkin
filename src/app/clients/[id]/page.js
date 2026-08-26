'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const CONTRACT_STATUSES = ['유지보수 계약중', '프로젝트 진행중', '계약 완료', '상담중'];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id;
  const { currentUser } = useAuth();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Active Tab: 'info' | 'history' | 'network'
  const [activeTab, setActiveTab] = useState('info');

  // Work History State
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('전체');
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit Basic Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formContacts, setFormContacts] = useState([]);
  const [formAddress, setFormAddress] = useState('');
  const [formContractStatus, setFormContractStatus] = useState('유지보수 계약중');
  const [formContractDate, setFormContractDate] = useState('');
  const [formEngineerPrimary, setFormEngineerPrimary] = useState('');
  const [formEngineerSecondary, setFormEngineerSecondary] = useState('미지정');
  const [formMemo, setFormMemo] = useState('');

  // Network Config State
  const [netConfig, setNetConfig] = useState({
    isp: '',
    ipSubnet: '',
    gateway: '',
    dnsPrimary: '',
    dnsSecondary: '',
    equipments: [],
    notes: ''
  });

  // Equipment Add Form inside Tab 3
  const [newEquipType, setNewEquipType] = useState('UTM 방화벽');
  const [newEquipModel, setNewEquipModel] = useState('');
  const [newEquipLocation, setNewEquipLocation] = useState('');

  // Fetch client details & users
  useEffect(() => {
    if (clientId) {
      fetchClientDetail();
      fetchUsersFromAPI();
    }
  }, [clientId]);

  const fetchClientDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        const found = data.find(c => String(c.id) === String(clientId));
        if (found) {
          setClient(found);
          initClientForms(found);
          fetchClientHistory(found.name);
        } else {
          alert('존재하지 않는 고객사입니다.');
          router.push('/clients');
        }
      }
    } catch (e) {
      console.error('Fetch client detail error', e);
    } finally {
      setLoading(false);
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

  const fetchClientHistory = async (clientName) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/clients/history?clientName=${encodeURIComponent(clientName)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data || []);
      }
    } catch (e) {
      console.error('Fetch history error', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const initClientForms = (cli) => {
    setFormName(cli.name || '');
    setFormIndustry(cli.industry || '');
    setFormContacts(Array.isArray(cli.contacts) && cli.contacts.length > 0 ? cli.contacts : [{ name: cli.contact_name || '', phone: cli.contact_phone || '', email: cli.contact_email || '', duty: '대표 담당자' }]);
    setFormAddress(cli.address || '');
    setFormContractStatus(cli.contract_status || '유지보수 계약중');
    setFormContractDate(cli.contract_date || new Date().toISOString().split('T')[0]);
    setFormEngineerPrimary(cli.engineer_primary || cli.assigned_pm || '담당자');
    setFormEngineerSecondary(cli.engineer_secondary || '미지정');
    setFormMemo(cli.memo || '');

    const cfg = cli.network_config || {};
    setNetConfig({
      isp: cfg.isp || 'KT 전용회선 (1G)',
      ipSubnet: cfg.ipSubnet || '192.168.10.0/24',
      gateway: cfg.gateway || '192.168.10.1',
      dnsPrimary: cfg.dnsPrimary || '168.126.63.1',
      dnsSecondary: cfg.dnsSecondary || '168.126.63.2',
      equipments: Array.isArray(cfg.equipments) ? cfg.equipments : [],
      notes: cfg.notes || ''
    });
  };

  // Engineer user list (excluding master admin)
  const engineerUsers = registeredUsers.filter(u => u.id.toLowerCase() !== 'netadmin' && u.name !== '마스터 관리자' && u.role !== '마스터 관리자');

  // Contact helper handlers
  const handleAddContact = () => {
    setFormContacts([...formContacts, { name: '', phone: '', email: '', duty: '담당자' }]);
  };

  const handleRemoveContact = (idx) => {
    if (formContacts.length === 1) return;
    setFormContacts(formContacts.filter((_, i) => i !== idx));
  };

  const handleContactChange = (idx, field, val) => {
    const updated = [...formContacts];
    updated[idx][field] = val;
    setFormContacts(updated);
  };

  // Save Basic Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('고객사명을 입력해주세요.');
      return;
    }

    const payload = {
      id: client.id,
      name: formName.trim(),
      industry: formIndustry.trim(),
      contacts: formContacts.filter(c => c.name.trim() || c.phone.trim()),
      address: formAddress.trim(),
      contract_status: formContractStatus,
      contract_date: formContractDate,
      engineer_primary: formEngineerPrimary,
      engineer_secondary: formEngineerSecondary,
      memo: formMemo.trim(),
      network_config: netConfig
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('고객사 기본 정보가 수정되었습니다.');
        setIsEditModalOpen(false);
        fetchClientDetail();
      } else {
        alert('수정 실패');
      }
    } catch (err) {
      alert(`수정 오류: ${err.message}`);
    }
  };

  // Save Network Config
  const handleSaveNetworkConfig = async () => {
    const payload = {
      id: client.id,
      name: client.name,
      industry: client.industry,
      contacts: client.contacts,
      address: client.address,
      contract_status: client.contract_status,
      contract_date: client.contract_date,
      engineer_primary: client.engineer_primary,
      engineer_secondary: client.engineer_secondary,
      memo: client.memo,
      network_config: netConfig
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('네트워크 구성 정보 및 인프라 설정이 저장되었습니다!');
        fetchClientDetail();
      } else {
        alert('저장 실패');
      }
    } catch (err) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  // Equipment Add & Remove
  const handleAddEquipment = () => {
    if (!newEquipModel.trim()) return;
    setNetConfig({
      ...netConfig,
      equipments: [
        ...netConfig.equipments,
        { type: newEquipType, model: newEquipModel.trim(), location: newEquipLocation.trim() || '서버실' }
      ]
    });
    setNewEquipModel('');
    setNewEquipLocation('');
  };

  const handleRemoveEquipment = (index) => {
    setNetConfig({
      ...netConfig,
      equipments: netConfig.equipments.filter((_, idx) => idx !== index)
    });
  };

  // Delete Client
  const handleDeleteClient = async () => {
    if (confirm(`'${client.name}' 고객사를 삭제하시겠습니까? 관련 데이터는 복구할 수 없습니다.`)) {
      try {
        const res = await fetch(`/api/clients?id=${encodeURIComponent(client.id)}`, { method: 'DELETE' });
        if (res.ok) {
          alert('고객사가 삭제되었습니다.');
          router.push('/clients');
        }
      } catch (e) {
        console.error('Delete error', e);
      }
    }
  };

  // History Filtering
  const filteredHistory = history.filter(h => {
    const typeMatch = historyFilter === '전체' || h.category.includes(historyFilter);
    const searchMatch = !historySearch.trim() ||
      (h.title || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (h.content || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (h.workers || []).some(w => w.toLowerCase().includes(historySearch.toLowerCase()));

    return typeMatch && searchMatch;
  });

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>
        고객사 상세 정보를 불러오는 중...
      </div>
    );
  }

  if (!client) return null;

  return (
    <div>
      {/* Top Breadcrumb & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/clients" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
          ◀ 고객사 목록으로 돌아가기
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsEditModalOpen(true)} className="btn btn-accent" style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
            ✏️ 정보 수정
          </button>
          <Link href="/maintenance" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem 0.9rem', color: '#E63946', borderColor: '#E63946' }}>
            🚨 장애/유지보수 접수
          </Link>
          <button onClick={handleDeleteClient} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', color: '#aaa' }}>
            🗑️ 삭제
          </button>
        </div>
      </div>

      {/* Main Client Header Panel */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(11,19,43,0.9) 0%, rgba(27,38,59,0.9) 100%)', borderLeft: '6px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {client.code}
              </span>
              <span className="badge" style={{ background: client.contract_status === '유지보수 계약중' ? 'rgba(56,176,0,0.25)' : 'rgba(255,183,3,0.25)', color: client.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703', fontSize: '0.8rem', fontWeight: 700 }}>
                ● {client.contract_status}
              </span>
              {client.industry && (
                <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', color: '#ddd', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {client.industry}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              🏢 {client.name}
            </h1>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.4rem', margin: 0 }}>📍 사업장 주소: <strong style={{ color: '#fff' }}>{client.address || '주소 미등록'}</strong></p>
          </div>

          {/* Quick Contact & PM Summary Card */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <span style={{ color: '#00B4D8', fontWeight: 700, display: 'block' }}>👤 전담 엔지니어 (정)</span>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{client.engineer_primary || '미지정'}</strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                <span style={{ color: '#aaa', fontWeight: 600, display: 'block' }}>👤 전담 엔지니어 (부)</span>
                <strong style={{ color: '#ddd', fontSize: '0.95rem' }}>{client.engineer_secondary || '미지정'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="panel" style={{ padding: '1rem', background: 'rgba(0,180,216,0.06)', borderLeft: '4px solid #00B4D8' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>등록 담당자</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
            {Array.isArray(client.contacts) ? client.contacts.length : 1} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>명</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem', background: 'rgba(56,176,0,0.06)', borderLeft: '4px solid #38B000' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>수행 작업 이력</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38B000', marginTop: '0.2rem' }}>
            {history.length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>건</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem', background: 'rgba(255,183,3,0.06)', borderLeft: '4px solid #FFB703' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>구축 인프라 장비</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFB703', marginTop: '0.2rem' }}>
            {netConfig.equipments.length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>대</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn ${activeTab === 'info' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          📋 고객사 프로필 & 👥 담당자 관리
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          🛠️ 통합 작업 & 장애 처리 이력 ({history.length}건)
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`btn ${activeTab === 'network' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          🌐 네트워크 회선 & 인프라 자산 관리
        </button>
      </div>

      {/* TAB 1: Profile & Contacts */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Contacts Section */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>👥 고객사 담당자 목록 ({formContacts.length}명)</h2>
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                ✏️ 담당자 추가/수정
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {formContacts.map((cnt, i) => (
                <div key={i} style={{ background: 'var(--bg-main)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{cnt.name || '담당자'}</strong>
                      {cnt.duty && (
                        <span style={{ fontSize: '0.78rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {cnt.duty}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                      {cnt.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>📞</span> <a href={`tel:${cnt.phone}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>{cnt.phone}</a>
                        </div>
                      )}
                      {cnt.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>✉️</span> <a href={`mailto:${cnt.email}`} style={{ color: '#00B4D8', textDecoration: 'none' }}>{cnt.email}</a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    {cnt.phone && (
                      <a href={`tel:${cnt.phone}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem' }}>
                        📞 전화연결
                      </a>
                    )}
                    {cnt.email && (
                      <a href={`mailto:${cnt.email}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem' }}>
                        ✉️ 이메일 작성
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Cards */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>📋 계약 및 고객사 세부 프로필</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#aaa' }}>고객사 코드:</span> <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{client.code}</strong></div>
                <div><span style={{ color: '#aaa' }}>업종 분류:</span> <strong style={{ color: '#fff' }}>{client.industry || '미지정'}</strong></div>
                <div><span style={{ color: '#aaa' }}>계약 상태:</span> <strong style={{ color: client.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703' }}>{client.contract_status}</strong></div>
                <div><span style={{ color: '#aaa' }}>계약/등록일자:</span> <strong style={{ color: '#fff' }}>{client.contract_date || '-'}</strong></div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#aaa' }}>전담 엔지니어 (정):</span> <strong style={{ color: '#00B4D8' }}>👤 {client.engineer_primary || '미지정'}</strong></div>
                <div><span style={{ color: '#aaa' }}>전담 엔지니어 (부):</span> <strong style={{ color: '#ddd' }}>👤 {client.engineer_secondary || '미지정'}</strong></div>
                <div><span style={{ color: '#aaa' }}>사업장 주소:</span> <strong style={{ color: '#fff' }}>{client.address || '미입력'}</strong></div>
              </div>
            </div>

            {client.memo && (
              <div style={{ marginTop: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--color-accent)' }}>
                <span style={{ fontSize: '0.82rem', color: '#aaa', display: 'block', marginBottom: '0.35rem' }}>📌 고객사 특이사항 및 유지보수 메모:</span>
                <p style={{ color: '#ddd', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-line', margin: 0 }}>{client.memo}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: Work History Timeline */}
      {activeTab === 'history' && (
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>🛠️ 고객사 수행 작업 및 처리 이력 ({filteredHistory.length}건)</h2>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, marginTop: '0.2rem' }}>유지보수/장애, IPT, 네트워크, 시공현장, 회의 실시간 집계</p>
            </div>

            {/* History Filter Toolbar */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}>
                <option value="전체">전체 작업 구분</option>
                <option value="유지보수">🔴 유지보수/장애</option>
                <option value="IPT">📞 IPT전화</option>
                <option value="네트워크">🌐 네트워크</option>
                <option value="시공">🏗️ 시공현장</option>
                <option value="회의">🤝 회의/컨설팅</option>
              </select>

              <input
                type="text"
                placeholder="제목, 엔지니어, 내용 검색..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '220px' }}
              />

              <button onClick={() => fetchClientHistory(client.name)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}>
                🔄 새로고침
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>작업 이력을 조회하는 중...</div>
          ) : filteredHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {filteredHistory.map(h => (
                <div key={h.id} style={{ background: 'var(--bg-main)', padding: '1.1rem 1.25rem', borderRadius: '10px', border: `1px solid ${h.badgeColor || 'var(--border-color)'}`, borderLeft: `5px solid ${h.badgeColor || 'var(--color-accent)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span className="badge" style={{ background: h.badgeColor || 'var(--color-primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
                        {h.category}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600 }}>📅 {h.date}</span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.75rem' }}>
                        {h.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, marginBottom: '0.3rem' }}>{h.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.5' }}>{h.content}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(h.workers || []).map((w, idx) => (
                      <span key={idx} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        👤 {w}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px' }}>
              조건에 해당하는 작업 이력이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Network Config & Equipment Asset Manager */}
      {activeTab === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ISP Line & IP Config Panel */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem', color: '#00B4D8' }}>🌐 네트워크 회선 및 메인 IP 대역 설정</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>ISP 통신사 / 회선 종류</label>
                <input
                  type="text"
                  placeholder="예: KT 전용회선 (1G / 10G)"
                  value={netConfig.isp}
                  onChange={e => setNetConfig({ ...netConfig, isp: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>메인 IP 대역 (CIDR)</label>
                <input
                  type="text"
                  placeholder="예: 211.234.100.0/24"
                  value={netConfig.ipSubnet}
                  onChange={e => setNetConfig({ ...netConfig, ipSubnet: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>게이트웨이 (Gateway)</label>
                <input
                  type="text"
                  placeholder="예: 211.234.100.1"
                  value={netConfig.gateway}
                  onChange={e => setNetConfig({ ...netConfig, gateway: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>Primary DNS</label>
                <input
                  type="text"
                  placeholder="예: 168.126.63.1"
                  value={netConfig.dnsPrimary}
                  onChange={e => setNetConfig({ ...netConfig, dnsPrimary: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Equipment Assets Panel */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>💻 구축 인프라 및 장비 자산 관리 ({netConfig.equipments.length}대)</h2>
            </div>

            {/* Add Equipment Row */}
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr auto', gap: '0.6rem', alignItems: 'center' }}>
              <select
                value={newEquipType}
                onChange={e => setNewEquipType(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
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
                placeholder="장비 모델명 및 시리얼 (예: FortiGate 100F / FG100F-8821)"
                value={newEquipModel}
                onChange={e => setNewEquipModel(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
              />

              <input
                type="text"
                placeholder="설치 위치 (예: 3층 서버실 랙 1)"
                value={newEquipLocation}
                onChange={e => setNewEquipLocation(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
              />

              <button type="button" onClick={handleAddEquipment} className="btn btn-accent" style={{ padding: '0.6rem 1.2rem', fontWeight: 600 }}>
                + 장비 추가
              </button>
            </div>

            {netConfig.equipments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>장비 구분</th>
                    <th>모델명 및 정보</th>
                    <th>설치 장소</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {netConfig.equipments.map((eq, idx) => (
                    <tr key={idx}>
                      <td>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                          {eq.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{eq.model}</td>
                      <td style={{ color: '#ccc' }}>📍 {eq.location}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => handleRemoveEquipment(idx)} style={{ background: 'none', border: 'none', color: '#E63946', cursor: 'pointer', fontSize: '1rem' }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px' }}>
                등록된 구축 장비 자산이 없습니다. 상단 입력창에서 장비를 추가하세요.
              </div>
            )}
          </div>

          {/* Config Notes & Save */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>📌 네트워크 이중화 & 기술 구성 특이사항 메모</h2>
            </div>
            <textarea
              rows={4}
              value={netConfig.notes}
              onChange={e => setNetConfig({ ...netConfig, notes: e.target.value })}
              placeholder="네트워크 이중화 설정, 포트 포워딩, VLAN 구역 분리 및 정책 특이사항을 기록하세요..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
            ></textarea>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={handleSaveNetworkConfig} className="btn btn-accent" style={{ padding: '0.7rem 1.6rem', fontWeight: 700, fontSize: '0.95rem' }}>
                💾 네트워크 구성 정보 및 장비 현황 전체 저장
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>✏️ 고객사 기본 프로필 수정</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사 / 기관명 *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>업종 분류</label>
                  <input
                    type="text"
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
                    👥 고객사 담당자 정보
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
                        placeholder="담당자명"
                        value={cnt.name}
                        onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="연락처"
                        value={cnt.phone}
                        onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="email"
                        placeholder="이메일"
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
                          style={{ background: 'none', border: 'none', color: '#E63946', fontSize: '1rem', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineers selection */}
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
                    {CONTRACT_STATUSES.map(st => (
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
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">수정 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
