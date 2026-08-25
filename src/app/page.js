'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function EmployeeDashboard() {
  const { currentUser, isInitialized, logout } = useAuth();
  
  const [scheduleTab, setScheduleTab] = useState('today'); // 'today' | 'weekly'
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending' | 'ref'

  // DB에서 읽어온 실제 동적 데이타 상태
  const [dashboardData, setDashboardData] = useState({
    iptCount: 0,
    networkCount: 0,
    projectCount: 0,
    documentCount: 0,
    recentProjects: [],
    recentDocuments: []
  });

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      const [iptRes, netRes, projRes, docRes] = await Promise.all([
        fetch('/api/ipt').catch(() => null),
        fetch('/api/network').catch(() => null),
        fetch('/api/projects').catch(() => null),
        fetch('/api/documents').catch(() => null)
      ]);

      const ipt = iptRes?.ok ? await iptRes.json() : [];
      const net = netRes?.ok ? await netRes.json() : [];
      const proj = projRes?.ok ? await projRes.json() : [];
      const doc = docRes?.ok ? await docRes.json() : [];

      setDashboardData({
        iptCount: ipt.length,
        networkCount: net.length,
        projectCount: proj.length,
        documentCount: doc.length,
        recentProjects: proj.slice(0, 3),
        recentDocuments: doc.slice(0, 3)
      });
    } catch (e) {
      console.warn('Failed to load dashboard summary', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Dashboard Header */}
      <header className="portal-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="portal-title">
            {isInitialized && currentUser ? `${currentUser.name || currentUser.id} 님의 개인 업무 대시보드` : '개인 업무 통합 대시보드'}
          </h1>
          <p className="portal-subtitle">아인스텍 / Networkin 사내 포털 개인 업무 현황 및 일간 스케줄 종합 센터</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isInitialized && currentUser ? (
            <>
              <span className="badge badge-active" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                👤 {currentUser.name || currentUser.id} ({currentUser.role})
              </span>
              <button onClick={logout} className="btn btn-secondary">🔓 로그아웃</button>
            </>
          ) : (
            <Link href="/login" className="btn btn-accent">🔑 로그인</Link>
          )}
        </div>
      </header>

      {/* 2. Top Personal KPI Stats */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-label">📬 메일함 용량</div>
          <div className="stat-value" style={{ color: '#00B4D8', fontSize: '1.5rem' }}>0.00 GB <span style={{ fontSize: '0.9rem', color: '#aaa' }}>/ 4 GB</span></div>
          <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: '0%' }}></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📅 금일 개인/부서 일정</div>
          <div className="stat-value" style={{ color: '#FFB703' }}>0 <span style={{ fontSize: '1rem' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#aaa' }}>등록된 오늘 일정이 없습니다.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📑 결재 대기 (미결문서)</div>
          <div className="stat-value" style={{ color: '#38B000' }}>0 <span style={{ fontSize: '1rem' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#aaa' }}>대기 중인 결재 문서가 없습니다.</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💬 안 읽은 쪽지 / 알림</div>
          <div className="stat-value" style={{ color: '#38B000' }}>0 <span style={{ fontSize: '1rem' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#aaa' }}>새로운 알림이 없습니다.</div>
        </div>
      </div>

      {/* 3. Main 2-Column Personal Work Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Personal Work Modules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 📬 메일함 (Mailbox Widget) */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📫 최근 메일함
              </h2>
              <Link href="/mail" style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>+ MORE</Link>
            </div>

            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#aaa', fontSize: '0.88rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
              수신된 최근 메일이 없습니다.
            </div>
          </div>

          {/* 💬 쪽지함 (Messages Widget) */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✉️ 최근 쪽지함 및 알림
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', cursor: 'pointer' }}>+ MORE</span>
            </div>

            <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#aaa', fontSize: '0.88rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
              등록된 쪽지 및 알림이 없습니다.
            </div>
          </div>

          {/* 📅 달력 및 일정 (Calendar & Schedule Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            
            {/* Mini Calendar */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.6rem', color: 'var(--color-accent)' }}>
                ◀ 2026.08 ▶
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#E63946' }}>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span style={{ color: '#00B4D8' }}>토</span>
                <span></span><span></span><span></span><span></span><span></span><span></span><span style={{ color: '#00B4D8' }}>01</span>
                <span style={{ color: '#E63946' }}>02</span><span>03</span><span>04</span><span>05</span><span>06</span><span>07</span><span style={{ color: '#00B4D8' }}>08</span>
                <span style={{ color: '#E63946' }}>09</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span style={{ color: '#00B4D8' }}>15</span>
                <span style={{ color: '#E63946' }}>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span style={{ color: '#00B4D8' }}>22</span>
                <span style={{ color: '#E63946' }}>23</span><span>24</span><span style={{ background: 'var(--color-accent)', color: '#000', borderRadius: '50%', fontWeight: 700 }}>25</span><span>26</span><span>27</span><span>28</span><span style={{ color: '#00B4D8' }}>29</span>
                <span style={{ color: '#E63946' }}>30</span><span>31</span>
              </div>
            </div>

            {/* Today / Weekly Schedule Tabs */}
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button
                  onClick={() => setScheduleTab('today')}
                  className={`btn ${scheduleTab === 'today' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  오늘일정 (0)
                </button>
                <button
                  onClick={() => setScheduleTab('weekly')}
                  className={`btn ${scheduleTab === 'weekly' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  주간일정 (0)
                </button>
              </div>

              <div style={{ padding: '1rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>
                등록된 일정이 없습니다.
              </div>
            </div>

          </div>

          {/* 📑 전자결재 & 미결문서 (Approval Pending Widget) */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setApprovalTab('pending')}
                  className={`btn ${approvalTab === 'pending' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                >
                  미결문서 (0)
                </button>
                <button
                  onClick={() => setApprovalTab('ref')}
                  className={`btn ${approvalTab === 'ref' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                >
                  참조문서 (0)
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', cursor: 'pointer' }}>+ MORE</span>
            </div>

            <div style={{ padding: '1rem', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>
              {approvalTab === 'pending' ? '대기 중인 결재 문서가 없습니다.' : '참조 또는 열람 문서가 없습니다.'}
            </div>
          </div>

        </div>

        {/* Right Sidebar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 전체 공지사항 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent)' }}>전체공지</h3>
              <Link href="/board" style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</Link>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#aaa', textAlign: 'center', padding: '0.8rem 0' }}>
              등록된 공지사항이 없습니다.
            </div>
          </div>

          {/* 전자결재 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid #00B4D8', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#00B4D8' }}>전자결재</h3>
              <span style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#aaa', textAlign: 'center', padding: '0.8rem 0' }}>
              완료된 전자결재가 없습니다.
            </div>
          </div>

          {/* 시공현장 / 프로젝트 현황 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid #3B82F6', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3B82F6' }}>최근 시공현장 ({dashboardData.projectCount})</h3>
              <Link href="/projects" style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</Link>
            </div>
            {dashboardData.recentProjects.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                {dashboardData.recentProjects.map(p => (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· {p.name}</span>
                    <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{p.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#aaa', textAlign: 'center', padding: '0.8rem 0' }}>
                등록된 프로젝트가 없습니다.
              </div>
            )}
          </div>

          {/* 최근 문서 (최근게시물 위치 대체) */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid #9290C3', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9290C3' }}>최근 등록 문서 ({dashboardData.documentCount})</h3>
              <Link href="/documents" style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</Link>
            </div>
            {dashboardData.recentDocuments.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                {dashboardData.recentDocuments.map(d => (
                  <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· {d.title}</span>
                    <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{d.date}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#aaa', textAlign: 'center', padding: '0.8rem 0' }}>
                등록된 최근 문서가 없습니다.
              </div>
            )}
          </div>

          {/* QUICK LINK */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ marginBottom: '0.8rem', borderBottom: '2px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent)' }}>LINK</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <a href="#" style={{ color: '#ccc' }}>· 우리회사 사내망</a>
              <a href="https://www.naver.com" target="_blank" rel="noreferrer" style={{ color: '#ccc' }}>· 네이버 (Naver)</a>
              <a href="#" style={{ color: '#ccc' }}>· 서식/양식 다운로드</a>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Bottom Section: 아인스텍 핵심 사업 부문별 현황 */}
      <div className="panel" style={{ marginTop: '1rem', marginBottom: 0 }}>
        <div className="panel-header">
          <h2 className="panel-title">🏢 아인스텍 / Networkin 핵심 사업 부문별 현황</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>사업소개 기준</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏭 인프라 구축</div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>네트워크 Infra 구축</h3>
            <ul style={{ fontSize: '0.82rem', color: '#aaa', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>사무/주거환경 & 공장건물 Infra</li>
              <li>제조업 생산라인 네트워크 Infra</li>
              <li>통합 전산기계실 네트워크 Infra</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌐 네트워크 구축</div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>설계 및 컨설팅</h3>
            <ul style={{ fontSize: '0.82rem', color: '#aaa', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>공장자동화 네트워크 구축 및 유지보수</li>
              <li>통합 전산기계실 구축 및 컨설팅</li>
              <li>대규모 LAN / WAN 네트워크 공사</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📞 IPT 구축</div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>통신 및 부가서비스</h3>
            <ul style={{ fontSize: '0.82rem', color: '#aaa', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>IPT (IP Telephony) 구축 및 유지보수</li>
              <li>IPCC (콜센터) 구축 서비스</li>
              <li>UC 및 부가서비스 통합 구축</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛠️ 유지보수 사업</div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>H/W, S/W 및 아웃소싱</h3>
            <ul style={{ fontSize: '0.82rem', color: '#aaa', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>H/W, S/W 유지보수 정기 점검</li>
              <li>주변기기 수리 및 긴급 복구</li>
              <li>유지보수 전문 인력 아웃소싱</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
