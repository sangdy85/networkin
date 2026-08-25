'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModals() {
  const { currentUser, changePassword, showLoginModal, setShowLoginModal, login } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');

  // Handle Mandatory First-Login Password Change
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    changePassword(newPassword);
    alert('비밀번호 변경이 완료되었습니다! 이제 포털을 정상 이용하실 수 있습니다.');
  };

  // Handle Login Modal Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const res = await login(loginId, loginPw);
    if (!res.success) {
      setLoginError(res.message);
    } else {
      setLoginId('');
      setLoginPw('');
    }
  };

  return (
    <>
      {/* 🔒 Mandatory First Login Password Change Modal */}
      {currentUser && currentUser.isFirstLogin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '460px', background: 'var(--bg-card)', border: '2px solid var(--color-accent)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔑</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent)' }}>최초 로그인 비밀번호 변경</h2>
              <p style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '0.4rem', lineHeight: '1.5' }}>
                보안을 위해 생성된 계정(<strong>{currentUser.id}</strong>)의 최초 로그인 시 필수적으로 새 비밀번호를 설정해야 합니다.
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새로운 비밀번호 입력"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 한번 더 입력"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              {passwordError && (
                <div style={{ color: '#E63946', fontSize: '0.82rem', textAlign: 'center' }}>⚠️ {passwordError}</div>
              )}

              <button type="submit" className="btn btn-accent" style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                🔒 비밀번호 변경 완료하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔑 Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-card)' }}>
            <div className="panel-header">
              <h2 className="panel-title">👤 사내 계정 로그인</h2>
              <button onClick={() => setShowLoginModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>아이디 (ID)</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="예: netadmin"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>비밀번호 (Password)</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  placeholder="비밀번호 입력 (초기비밀번호: 1234)"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              {loginError && (
                <div style={{ color: '#E63946', fontSize: '0.82rem', textAlign: 'center' }}>⚠️ {loginError}</div>
              )}

              <button type="submit" className="btn btn-accent" style={{ padding: '0.8rem', fontSize: '0.95rem' }}>🔑 로그인</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
