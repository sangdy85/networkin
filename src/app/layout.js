'use client';

import './globals.css';
import Link from 'next/link';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModals from './components/AuthModals';
import { useRouter, usePathname } from 'next/navigation';

function SidebarNav() {
  const { currentUser, isInitialized, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isMaster = currentUser?.id === 'netadmin' || currentUser?.role === '마스터 관리자';

  return (
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

        {/* 2. 메일 */}
        <li className={`sidebar-item ${pathname === '/mail' ? 'active' : ''}`}>
          <Link href="/mail">
            <span style={{ fontSize: '1.2rem' }}>✉️</span>
            <span>메일</span>
          </Link>
        </li>

        {/* 3. 일정관리 (Read-Only) */}
        <li className={`sidebar-item ${pathname === '/schedule' ? 'active' : ''}`}>
          <Link href="/schedule">
            <span style={{ fontSize: '1.2rem' }}>📅</span>
            <span>일정관리</span>
          </Link>
        </li>

        {/* 4. IPT */}
        <li className={`sidebar-item ${pathname === '/ipt' ? 'active' : ''}`}>
          <Link href="/ipt">
            <span style={{ fontSize: '1.2rem' }}>📞</span>
            <span>IPT</span>
          </Link>
        </li>

        {/* 5. 네트워크 */}
        <li className={`sidebar-item ${pathname === '/network' ? 'active' : ''}`}>
          <Link href="/network">
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <span>네트워크</span>
          </Link>
        </li>

        {/* 6. 시공현장 (신규 시공 프로젝트 등록 메뉴) */}
        <li className={`sidebar-item ${pathname === '/projects' ? 'active' : ''}`}>
          <Link href="/projects">
            <span style={{ fontSize: '1.2rem' }}>🏗️</span>
            <span>시공현장</span>
          </Link>
        </li>

        {/* 7. 회의/컨설팅 */}
        <li className={`sidebar-item ${pathname === '/meeting' ? 'active' : ''}`}>
          <Link href="/meeting">
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <span>회의/컨설팅</span>
          </Link>
        </li>

        {/* 8. 자재&장비관리 */}
        <li className={`sidebar-item ${pathname === '/inventory' ? 'active' : ''}`}>
          <Link href="/inventory">
            <span style={{ fontSize: '1.2rem' }}>📦</span>
            <span>자재&장비관리</span>
          </Link>
        </li>

        {/* 9. 문서관리 */}
        <li className={`sidebar-item ${pathname === '/documents' ? 'active' : ''}`}>
          <Link href="/documents">
            <span style={{ fontSize: '1.2rem' }}>📁</span>
            <span>문서관리</span>
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
            
            <button
              onClick={() => {
                logout();
                alert('로그아웃 되었습니다.');
                router.push('/login');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              🔓 로그아웃
            </button>
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
