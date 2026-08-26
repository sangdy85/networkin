'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import Link from 'next/link';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModals from './components/AuthModals';
import { useRouter, usePathname } from 'next/navigation';

function SidebarNav() {
  const { currentUser, isInitialized, logout, updateAccountInfo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const handleOpenMyProfile = () => {
    if (!currentUser) return;
    setProfileForm({
      name: currentUser.name || '',
      password: currentUser.password || '',
      mobile: currentUser.mobile || '',
      phone: currentUser.phone || '',
      fax: currentUser.fax || '',
      address: currentUser.address || '',
      task: currentUser.task || ''
    });
    setIsMyProfileOpen(true);
  };

  const handleSaveMyProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const res = await updateAccountInfo(currentUser.id, profileForm);
    if (res.success) {
      alert('회원 정보가 성공적으로 수정되었습니다!');
      setIsMyProfileOpen(false);
    } else {
      alert(`수정 실패: ${res.message}`);
    }
  };

  const isMaster = currentUser?.id === 'netadmin' || currentUser?.role === '마스터 관리자';

  // Purge legacy mock data from browser localStorage once and for all
  useEffect(() => {
    try {
      const legacyKeys = [
        'networkin_network_items',
        'networkin_ipt_items',
        'networkin_projects',
        'networkin_meeting_items',
        'networkin_schedules_v3',
        'networkin_documents',
        'networkin_inventory',
        'networkin_board_posts',
        'networkin_maintenance'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }, []);

  return (
    <>
      <aside className="sidebar">
        {/* Top Left Brand Logo */}
        <Link href="/" className="sidebar-brand" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <span>Networkin</span>
          <span className="sidebar-badge">STAFF</span>
        </Link>

        <ul className="sidebar-menu">
          {/* 1. 대시보드 */}
          <li className={`sidebar-item ${pathname === '/' ? 'active' : ''}`}>
            <Link href="/">
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <span>대시보드</span>
            </Link>
          </li>

          {/* 2. 웹메일 */}
          <li className={`sidebar-item ${pathname === '/mail' ? 'active' : ''}`}>
            <Link href="/mail">
              <span style={{ fontSize: '1.2rem' }}>✉️</span>
              <span>웹메일</span>
            </Link>
          </li>

          {/* 3. 일정관리 */}
          <li className={`sidebar-item ${pathname === '/schedule' ? 'active' : ''}`}>
            <Link href="/schedule">
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <span>일정관리</span>
            </Link>
          </li>

          {/* 3-1. 사내망 관리 */}
          <li className={`sidebar-item ${pathname === '/intranet' ? 'active' : ''}`}>
            <Link href="/intranet">
              <span style={{ fontSize: '1.2rem' }}>🖥️</span>
              <span>사내망 관리</span>
            </Link>
          </li>

          {/* 4. IPT */}
          <li className={`sidebar-item ${pathname === '/ipt' ? 'active' : ''}`}>
            <Link href="/ipt">
              <span style={{ fontSize: '1.2rem' }}>📞</span>
              <span>IPT (인터넷전화)</span>
            </Link>
          </li>

          {/* 5. 네트워크 */}
          <li className={`sidebar-item ${pathname === '/network' ? 'active' : ''}`}>
            <Link href="/network">
              <span style={{ fontSize: '1.2rem' }}>🌐</span>
              <span>네트워크 관리</span>
            </Link>
          </li>

          {/* 6. 시공현장 */}
          <li className={`sidebar-item ${pathname === '/projects' ? 'active' : ''}`}>
            <Link href="/projects">
              <span style={{ fontSize: '1.2rem' }}>🏗️</span>
              <span>시공 현장</span>
            </Link>
          </li>

          {/* 7. 회의/컨설팅 */}
          <li className={`sidebar-item ${pathname === '/meeting' ? 'active' : ''}`}>
            <Link href="/meeting">
              <span style={{ fontSize: '1.2rem' }}>💬</span>
              <span>회의 / 컨설팅</span>
            </Link>
          </li>

          {/* 8. 문서관리 */}
          <li className={`sidebar-item ${pathname === '/documents' ? 'active' : ''}`}>
            <Link href="/documents">
              <span style={{ fontSize: '1.2rem' }}>📁</span>
              <span>문서 관리</span>
            </Link>
          </li>

          {/* 9. 자재&장비관리 */}
          <li className={`sidebar-item ${pathname === '/inventory' ? 'active' : ''}`}>
            <Link href="/inventory">
              <span style={{ fontSize: '1.2rem' }}>📦</span>
              <span>자재 & 장비</span>
            </Link>
          </li>

          {/* 10. 게시판 */}
          <li className={`sidebar-item ${pathname === '/board' ? 'active' : ''}`}>
            <Link href="/board">
              <span style={{ fontSize: '1.2rem' }}>📋</span>
              <span>게시판</span>
            </Link>
          </li>

          {/* Master Admin / User Management Link */}
          <li className={`sidebar-item ${pathname === '/admin' ? 'active' : ''}`} style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
            <Link href="/admin" style={{ color: isMaster ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
              <span style={{ fontSize: '1.2rem' }}>🔐</span>
              <span>계정 & 권한 관리</span>
              {isMaster && <span style={{ fontSize: '0.65rem', background: '#E63946', color: '#fff', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: 'auto' }}>MASTER</span>}
            </Link>
          </li>
        </ul>

        {/* User Profile & Explicit Logout / Login Footer */}
        <div className="sidebar-footer">
          {isInitialized && currentUser ? (
            <div>
              <div className="user-profile-summary" style={{ marginBottom: '0.8rem' }}>
                <div className="avatar" style={{ background: currentUser.id === 'netadmin' ? 'linear-gradient(135deg, #E63946, #FFB703)' : 'linear-gradient(135deg, #00B4D8, #3B82F6)' }}>
                  {currentUser.id.slice(0, 2).toUpperCase()}
                </div>
                <div className="user-info">
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{currentUser.name || currentUser.id}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)' }}>{currentUser.role}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  onClick={handleOpenMyProfile}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center', color: 'var(--color-accent)', borderColor: 'rgba(0,180,216,0.4)' }}
                >
                  ✏️ 내 정보 수정
                </button>
                <button
                  onClick={() => {
                    logout();
                    alert('로그아웃 되었습니다.');
                    router.push('/login');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  🔓 로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'center' }}>로그인이 필요합니다</div>
              <Link href="/login" className="btn btn-accent" style={{ width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}>
                🔑 계정 로그인
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ✏️ My Profile Edit Modal */}
      {isMyProfileOpen && currentUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '540px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="panel-header">
              <h2 className="panel-title">✏️ 내 회원정보 수정 [{currentUser.id}]</h2>
              <button onClick={() => setIsMyProfileOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMyProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>아이디 (수정불가)</label>
                  <input type="text" value={currentUser.id} disabled style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#aaa' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>성명 *</label>
                  <input type="text" value={profileForm.name || ''} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>비밀번호 (변경 시 입력)</label>
                <input type="password" value={profileForm.password || ''} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="새 비밀번호 입력" style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>휴대전화 번호</label>
                  <input type="text" value={profileForm.mobile || ''} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} placeholder="010-0000-0000" style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회사 직통전화</label>
                  <input type="text" value={profileForm.phone || ''} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="02-6207-8000" style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>팩스 번호</label>
                  <input type="text" value={profileForm.fax || ''} onChange={(e) => setProfileForm({ ...profileForm, fax: e.target.value })} style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>담당 업무</label>
                  <input type="text" value={profileForm.task || ''} onChange={(e) => setProfileForm({ ...profileForm, task: e.target.value })} style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>주소</label>
                <input type="text" value={profileForm.address || ''} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} style={{ width: '100%', padding: '0.69rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsMyProfileOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">💾 내 정보 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <AuthModals />
          <div className="portal-wrapper">
            <SidebarNav />
            <main className="portal-main">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
