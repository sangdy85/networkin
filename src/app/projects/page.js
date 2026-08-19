'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_PROJECTS = [
  {
    id: 1,
    name: '천안 A공장 생산라인 2구역 UTP/광배선 구축',
    client: '(주)천안정밀',
    type: '인프라구축',
    category: '공장자동화',
    pm: '김철수 과장',
    workers: ['김철수 과장', '박민우 대리'],
    period: '2026.08.01 ~ 2026.08.28',
    startDate: '2026-08-01',
    endDate: '2026-08-28',
    includeWeekends: true,
    progress: 85,
    status: '시공중',
    budget: '4,500만원',
    badgeClass: 'badge-active',
    memo: '천안 1공장 2구역 UTP 120라인 포설 및 광케이블 접속 완료. 랙정리 진행 중.'
  },
  {
    id: 2,
    name: '(주)한빛 스마트 오피스 IPT 교환기 및 IP폰 구축',
    client: '(주)한빛인베스트',
    type: 'IPT구축',
    category: 'UC/IPT',
    pm: '박민우 대리',
    workers: ['박민우 대리'],
    period: '2026.08.10 ~ 2026.09.05',
    startDate: '2026-08-10',
    endDate: '2026-09-05',
    includeWeekends: false,
    progress: 45,
    status: '시공중',
    badgeClass: 'badge-active',
    budget: '3,200만원',
    memo: 'IP-PBX 교환기 랙 입고 완료. 층별 IP폰 150대 내선 번호 세팅 중.'
  }
];

const COMPANY_WORKERS = ['이강욱 팀장', '김철수 과장', '박민우 대리', '최현우 과장'];

export default function ProjectsPage() {
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formType, setFormType] = useState('인프라구축');
  const [formPm, setFormPm] = useState('김철수 과장');
  const [formWorkers, setFormWorkers] = useState(['김철수 과장']);
  const [formStartDate, setFormStartDate] = useState('2026-08-19');
  const [formEndDate, setFormEndDate] = useState('2026-08-28');
  const [formIncludeWeekends, setFormIncludeWeekends] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [formStatus, setFormStatus] = useState('시공중');
  const [formBudget, setFormBudget] = useState('3,000만원');
  const [formMemo, setFormMemo] = useState('');

  // Load from localStorage & sync all projects on startup
  useEffect(() => {
    const saved = localStorage.getItem('networkin_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
        syncAllProjectsToSchedule(parsed);
      } catch (e) {}
    } else {
      syncAllProjectsToSchedule(INITIAL_PROJECTS);
    }
  }, []);

  // Sync All Projects to Schedule
  const syncAllProjectsToSchedule = (projList) => {
    try {
      const savedSchedules = localStorage.getItem('networkin_schedules_v3');
      let currentSchedules = savedSchedules ? JSON.parse(savedSchedules) : [];
      let cleanSchedules = currentSchedules.filter(s => !s.id.startsWith('PROJ-SCHED-'));

      const newProjSchedules = projList.map(proj => {
        let primaryType = '시공현장';
        let workType = '구축';
        let color = '#535C91';

        if (proj.type === 'IPT구축') {
          primaryType = 'IPT';
          workType = '구축';
          color = '#3B82F6';
        } else if (proj.type === '네트워크구축') {
          primaryType = '네트워크';
          workType = '구축';
          color = '#00B4D8';
        } else if (proj.type === '인프라구축') {
          primaryType = '시공현장';
          workType = '배선 공사';
          color = '#535C91';
        }

        return {
          id: `PROJ-SCHED-${proj.id}`,
          date: proj.startDate || '2026-08-19',
          startDate: proj.startDate || '2026-08-19',
          endDate: proj.endDate || proj.startDate || '2026-08-28',
          includeWeekends: proj.includeWeekends ?? false,
          time: '전일 공사 (09:00 - 18:00)',
          title: `[시공현장] ${proj.name} (${proj.progress}%)`,
          type: primaryType,
          workType: workType,
          location: proj.client,
          assignee: proj.pm,
          workers: proj.workers || [proj.pm],
          color: color,
          periodText: `${proj.startDate} ~ ${proj.endDate} (${proj.includeWeekends ? '주말/공휴일 포함' : '평일만'})`
        };
      });

      const merged = [...newProjSchedules, ...cleanSchedules];
      localStorage.setItem('networkin_schedules_v3', JSON.stringify(merged));
    } catch (err) {
      console.error('Schedule multi-day sync error:', err);
    }
  };

  const saveProjects = (newProjects) => {
    setProjects(newProjects);
    localStorage.setItem('networkin_projects', JSON.stringify(newProjects));
    syncAllProjectsToSchedule(newProjects);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormClient('');
    setFormType('인프라구축');
    setFormPm(currentUser?.name || currentUser?.id || '김철수 과장');
    setFormWorkers([currentUser?.name || currentUser?.id || '김철수 과장']);
    setFormStartDate('2026-08-19');
    setFormEndDate('2026-08-28');
    setFormIncludeWeekends(false);
    setFormProgress(0);
    setFormStatus('시공중');
    setFormBudget('');
    setFormMemo('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setFormName(proj.name);
    setFormClient(proj.client);
    setFormType(proj.type);
    setFormPm(proj.pm);
    setFormWorkers(proj.workers || [proj.pm]);
    setFormStartDate(proj.startDate || '2026-08-19');
    setFormEndDate(proj.endDate || '2026-08-28');
    setFormIncludeWeekends(proj.includeWeekends ?? false);
    setFormProgress(proj.progress);
    setFormStatus(proj.status);
    setFormBudget(proj.budget);
    setFormMemo(proj.memo || '');
    setIsModalOpen(true);
  };

  // Toggle Worker selection
  const handleWorkerToggle = (wName) => {
    if (formWorkers.includes(wName)) {
      if (formWorkers.length === 1) return;
      setFormWorkers(formWorkers.filter(w => w !== wName));
    } else {
      setFormWorkers([...formWorkers, wName]);
    }
  };

  // Save Project
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formClient.trim()) {
      alert('프로젝트명과 발주처를 입력해 주세요.');
      return;
    }

    let badgeClass = 'badge-active';
    if (formStatus === '완료') badgeClass = 'badge-complete';
    if (formStatus === '착수단계') badgeClass = 'badge-urgent';

    const projData = {
      id: editingProject ? editingProject.id : Date.now(),
      name: formName.trim(),
      client: formClient.trim(),
      type: formType,
      category: formType,
      pm: formPm,
      workers: formWorkers,
      startDate: formStartDate,
      endDate: formEndDate,
      includeWeekends: formIncludeWeekends,
      period: `${formStartDate.replace(/-/g, '.')} ~ ${formEndDate.replace(/-/g, '.')}`,
      progress: parseInt(formProgress, 10),
      status: formStatus,
      budget: formBudget.trim() || '미정',
      badgeClass,
      memo: formMemo.trim()
    };

    if (editingProject) {
      const updated = projects.map(p => p.id === editingProject.id ? projData : p);
      saveProjects(updated);
      alert(`[${projData.name}] 시공 프로젝트 정보가 수정되었습니다.`);
    } else {
      const updated = [projData, ...projects];
      saveProjects(updated);
      alert(`[${projData.name}] 새로운 시공 프로젝트가 등록되었습니다.`);
    }

    setIsModalOpen(false);
  };

  // Delete Project
  const handleDeleteProject = (id) => {
    if (confirm('이 프로젝트를 삭제하시겠습니까? (연동된 일정도 함께 삭제됩니다)')) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
    }
  };

  // Filtering Logic
  const filteredProjects = projects.filter(p => {
    const typeMatch = activeFilter === 'all' || p.type === activeFilter;
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    const searchMatch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pm.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">🏗️ 시공현장 관리 (Projects Hub)</h1>
          <p className="portal-subtitle">공사기간(착공일~준공일) 및 평일/주말 선택 포함 [일정 관리] 캘린더 자동 연동</p>
        </div>
        <button className="btn btn-accent" onClick={handleOpenCreateModal}>+ 신규 시공 프로젝트 등록</button>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeFilter === 'all' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('all')}
            style={{ fontSize: '0.85rem' }}
          >
            전체 보기 ({projects.length})
          </button>
          <button 
            className={`btn ${activeFilter === '인프라구축' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('인프라구축')}
            style={{ fontSize: '0.85rem' }}
          >
            🏭 인프라 구축 ({projects.filter(p => p.type === '인프라구축').length})
          </button>
          <button 
            className={`btn ${activeFilter === '네트워크구축' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('네트워크구축')}
            style={{ fontSize: '0.85rem' }}
          >
            🌐 네트워크 구축 ({projects.filter(p => p.type === '네트워크구축').length})
          </button>
          <button 
            className={`btn ${activeFilter === 'IPT구축' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('IPT구축')}
            style={{ fontSize: '0.85rem' }}
          >
            📞 IPT 구축 ({projects.filter(p => p.type === 'IPT구축').length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
          >
            <option value="all">상태 전체</option>
            <option value="시공중">시공중</option>
            <option value="완료">완료</option>
            <option value="착수단계">착수단계</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="프로젝트/발주처/PM 검색..."
            style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem', width: '200px' }}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '620px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="panel-header">
              <h2 className="panel-title">{editingProject ? '✏️ 프로젝트 & 공정률 수정' : '➕ 신규 시공 프로젝트 등록'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>프로젝트 / 현장명 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 천안 A공장 생산라인 2구역 UTP/광배선 구축"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>발주처 / 고객사 (사이트명) *</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    placeholder="예: (주)천안정밀"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>사업 구분</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontWeight: 600 }}
                  >
                    <option value="인프라구축">🏭 인프라구축</option>
                    <option value="네트워크구축">🌐 네트워크구축</option>
                    <option value="IPT구축">📞 IPT구축</option>
                    <option value="유지보수사업">🛠️ 유지보수사업</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>담당 PM</label>
                  <select
                    value={formPm}
                    onChange={(e) => setFormPm(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    {COMPANY_WORKERS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>사업 예산 / 계약금액</label>
                  <input
                    type="text"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="예: 4,500만원"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              {/* Progress & Status Slider */}
              <div style={{ background: 'rgba(0,180,216,0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,180,216,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                    📊 현재 공정률: {formProgress}%
                  </label>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                    상태:
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white' }}
                    >
                      <option value="시공중">시공중</option>
                      <option value="완료">완료</option>
                      <option value="착수단계">착수단계</option>
                    </select>
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formProgress}
                  onChange={(e) => setFormProgress(e.target.value)}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {/* Date Range + Weekends/Holidays Checkbox */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  📅 전체 공사 기간
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>착공일 (시작일) *</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>준공 예정일 (종료일) *</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                  </div>
                </div>

                {/* 주말, 공휴일 포함 체크박스 */}
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', background: 'rgba(0,180,216,0.08)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(0,180,216,0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formIncludeWeekends}
                      onChange={(e) => setFormIncludeWeekends(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#00B4D8', cursor: 'pointer' }}
                    />
                    📅 주말 및 공휴일 포함하여 시공 일정 등록
                  </label>
                  <span style={{ fontSize: '0.75rem', color: formIncludeWeekends ? '#00B4D8' : '#aaa' }}>
                    {formIncludeWeekends ? '✓ 공사기간 내 모든 날짜(주말/공휴일 포함)에 일정이 반영됩니다' : '✓ 평일(월~금)만 일정에 포함되며 주말/공휴일은 제외됩니다'}
                  </span>
                </div>
              </div>

              {/* Workers Multi-Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.4rem' }}>👷 현장 투입 작업자 배정</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {COMPANY_WORKERS.map(w => {
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
                          background: isSelected ? 'rgba(0,180,216,0.2)' : 'rgba(255,255,255,0.05)',
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>현장 특이사항 및 메모</label>
                <textarea
                  rows={3}
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  placeholder="현장 시공 관련 특이사항이나 자재 요청 메모..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingProject ? '수정 완료' : '프로젝트 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Drawer */}
      {viewProject && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-card)' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className={`badge ${viewProject.badgeClass}`} style={{ marginBottom: '0.3rem' }}>{viewProject.status}</span>
                <h2 className="panel-title" style={{ fontSize: '1.3rem', color: '#fff' }}>{viewProject.name}</h2>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.3rem' }}>발주처: <strong style={{ color: '#fff' }}>{viewProject.client}</strong></div>
              </div>
              <button onClick={() => setViewProject(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ background: 'rgba(0,180,216,0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,180,216,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <span>📊 공정 진행률</span>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{viewProject.progress}%</span>
                </div>
                <div className="progress-bar-bg" style={{ height: '10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${viewProject.progress}%` }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <div><span style={{ color: '#aaa' }}>사업 구분:</span> <strong>{viewProject.type}</strong></div>
                <div><span style={{ color: '#aaa' }}>계약 금액:</span> <strong>{viewProject.budget}</strong></div>
                <div><span style={{ color: '#aaa' }}>담당 PM:</span> <strong>{viewProject.pm}</strong></div>
                <div><span style={{ color: '#aaa' }}>공사 기간:</span> <strong>{viewProject.period}</strong></div>
                <div><span style={{ color: '#aaa' }}>주말/공휴일:</span> <strong>{viewProject.includeWeekends ? '포함' : '미포함 (평일만)'}</strong></div>
              </div>

              <div>
                <span style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem' }}>👷 현장 투입 작업자:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(viewProject.workers || [viewProject.pm]).map((w, i) => (
                    <span key={i} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.29rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      👤 {w}
                    </span>
                  ))}
                </div>
              </div>

              {viewProject.memo && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '0.3rem' }}>📌 현장 메모:</span>
                  <p style={{ color: '#ddd', fontSize: '0.88rem', lineHeight: '1.5' }}>{viewProject.memo}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => { handleOpenEditModal(viewProject); setViewProject(null); }} className="btn btn-accent">✏️ 정보/공정률 수정</button>
              <button onClick={() => setViewProject(null)} className="btn btn-secondary">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📋 진행 중인 시공 목록</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredProjects.length}건의 시공 건</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>프로젝트/현장명</th>
              <th>발주처</th>
              <th>사업구분</th>
              <th>담당 PM 및 작업자</th>
              <th>전체 공사기간</th>
              <th>주말/공휴일</th>
              <th style={{ width: '170px' }}>공정률</th>
              <th>상태</th>
              <th style={{ width: '130px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#fff', cursor: 'pointer' }} onClick={() => setViewProject(p)}>
                    {p.name}
                  </td>
                  <td>{p.client}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--color-accent)' }}>
                      {p.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div><strong>PM:</strong> {p.pm}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>{p.period}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: p.includeWeekends ? '#00B4D8' : '#aaa', fontWeight: 600 }}>
                      {p.includeWeekends ? '☑️ 포함' : '☐ 평일만'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${p.progress}%` }}></div>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: p.progress === 100 ? '#38B000' : '#00B4D8' }}>
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td><span className={`badge ${p.badgeClass}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => setViewProject(p)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        🔍 상세
                      </button>
                      <button onClick={() => handleOpenEditModal(p)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        ✏️ 수정
                      </button>
                      <button onClick={() => handleDeleteProject(p.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E63946' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 시공 프로젝트가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
