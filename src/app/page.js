'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function EmployeeDashboard() {
  const { currentUser, isInitialized, logout } = useAuth();
  
  const [scheduleTab, setScheduleTab] = useState('today'); // 'today' | 'weekly'
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending' | 'ref'

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
          <div className="stat-value" style={{ color: '#00B4D8', fontSize: '1.5rem' }}>2.42 GB <span style={{ fontSize: '0.9rem', color: '#aaa' }}>/ 4 GB</span></div>
          <div className="progress-bar-bg" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: '60.5%' }}></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📅 금일 개인/부서 일정</div>
          <div className="stat-value" style={{ color: '#FFB703' }}>3 <span style={{ fontSize: '1rem' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#aaa' }}>오전 현장 시공 1건 / 회의 1건</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📑 결재 대기 (미결문서)</div>
          <div className="stat-value" style={{ color: '#E63946' }}>1 <span style={{ fontSize: '1rem' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#E63946' }}>⚡ 결재 진행 필요</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💬 안 읽은 쪽지 / 알림</div>
          <div className="stat-value" style={{ color: '#38B000' }}>2 <span style={{ fontSize: '1rem' }}>건</span></div>
          <div className="stat-desc" style={{ color: '#aaa' }}>전자결재 완료 알림 2건</div>
        </div>
      </div>

      {/* 3. Main 2-Column Personal Work Grid (Matching User Screenshot Layout) */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', minWidth: '60px' }}>장기범</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    RE: Re:RE: Re:[SBI저축은행]원방빌딩 11층 케이블 테스트 결과 보고
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '1rem', flexShrink: 0 }}>2026-08-19</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', minWidth: '60px' }}>김영석</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    [SBI저축은행] 시스코 OS 업그레이드 작업 일정 수정 건
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '1rem', flexShrink: 0 }}>2026-08-18</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', minWidth: '60px' }}>류영철</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    RE: [넷워크인] 시스코 스위치 및 라우터 임대 발주 요청
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '1rem', flexShrink: 0 }}>2026-08-18</span>
              </div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38B000', minWidth: '60px' }}>장기범</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    내가 올린 전자결재 문서가 종결(전결) 되었습니다. [천안시공건]
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '1rem', flexShrink: 0 }}>2026-08-19 09:37</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFB703', minWidth: '60px' }}>이동중</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    내가 올린 전자결재 문서가 종결(전결) 되었습니다.
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: '1rem', flexShrink: 0 }}>2026-08-13 14:43</span>
              </div>
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
                <span style={{ color: '#E63946' }}>16</span><span>17</span><span>18</span><span style={{ background: 'var(--color-accent)', color: '#000', borderRadius: '50%', fontWeight: 700 }}>19</span><span>20</span><span>21</span><span style={{ color: '#00B4D8' }}>22</span>
                <span style={{ color: '#E63946' }}>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span><span style={{ color: '#00B4D8' }}>29</span>
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
                  오늘일정 (3)
                </button>
                <button
                  onClick={() => setScheduleTab('weekly')}
                  className={`btn ${scheduleTab === 'weekly' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  주간일정 (5)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(0,180,216,0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>09:30</span> 천안 A공장 UTP 배선 2차 현장 시공
                </div>
                <div style={{ background: 'rgba(146,144,195,0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#9290C3', fontWeight: 700 }}>13:00</span> 주간 네트워크 사업부 팀장 회의
                </div>
                <div style={{ background: 'rgba(255,183,3,0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#FFB703', fontWeight: 700 }}>15:30</span> 아산 B동 서버실 광케이블 월간 점검
                </div>
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
                  미결문서 (1)
                </button>
                <button
                  onClick={() => setApprovalTab('ref')}
                  className={`btn ${approvalTab === 'ref' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                >
                  참조문서 (2)
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', cursor: 'pointer' }}>+ MORE</span>
            </div>

            {approvalTab === 'pending' ? (
              <div style={{ background: 'rgba(230,57,70,0.08)', padding: '0.8rem 1rem', borderRadius: '8px', borderLeft: '3px solid #E63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>[결재대기] (주)한빛 스마트오피스 IPT 장비 추가 기안서</span>
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.2rem' }}>기안자: 박민우 대리 | 결재선: 이강욱 팀장</div>
                </div>
                <button className="btn btn-accent" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>결재하기</button>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic', padding: '0.5rem 0' }}>
                참조 및 열람 가능한 결재 문서는 2건입니다.
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar Section (Widgets matching User Screenshot) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 전체 공지사항 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent)' }}>전체공지</h3>
              <Link href="/board" style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</Link>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· [3분기] 2026 직무교육 실시 안내</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-08-10</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· 카페24 웹메일 관련 공지</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-07-28</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· [공지사항] 사내 경비 지급 정산</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-04-02</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· [공지사항] 시간 외 근무 지침</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-04-02</span>
              </li>
            </ul>
          </div>

          {/* 전자결재 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid #00B4D8', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#00B4D8' }}>전자결재</h3>
              <span style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#aaa', textAlign: 'center', padding: '0.8rem 0' }}>
              새로운 전자결재가 완료되었습니다.
            </div>
          </div>

          {/* 일정업무 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid #3B82F6', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3B82F6' }}>일정업무</h3>
              <Link href="/schedule" style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</Link>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· [부서] SBI일산지점 레...</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-08-29</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· [부서] AIA생명 VG IOS...</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-08-22</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· [개인] [SBI저축은행] 삼...</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-08-20</span>
              </li>
            </ul>
          </div>

          {/* 최근게시물 */}
          <div className="panel" style={{ marginBottom: 0, padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '2px solid #9290C3', paddingBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9290C3' }}>최근게시물</h3>
              <Link href="/board" style={{ fontSize: '0.75rem', color: '#aaa' }}>+ MORE</Link>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· KB국민은행 정기점검서</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2026-08-19</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· 롯데 cimc 업그레이드</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2025-10-17</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>· 환경안전 보건 소식지 24...</span>
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>2024-11-25</span>
              </li>
            </ul>
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

      {/* 4. Bottom Section: 아인스텍 핵심 사업 부문별 현황 (MOVED TO VERY BOTTOM) */}
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
