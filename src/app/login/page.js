'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, currentUser } = useAuth();
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('아이디를 입력해 주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    const res = login(userId.trim(), password);
    if (!res.success) {
      setError(res.message);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="panel" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-card)', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-accent)', fontWeight: 700 }}>🌐 Networkin</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>사내 업무 포털 로그인</h1>
          <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.4rem' }}>
            계정 아이디와 비밀번호를 입력하여 로그인하세요.
          </p>
        </div>

        {currentUser ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem', color: '#38B000', fontWeight: 600 }}>
              현재 [{currentUser.id}] ({currentUser.role}) 계정으로 로그인되어 있습니다.
            </p>
            <button onClick={() => router.push('/')} className="btn btn-accent" style={{ width: '100%' }}>
              📊 대시보드로 이동
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#ccc', marginBottom: '0.4rem', fontWeight: 600 }}>
                아이디 (ID)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="예: netadmin"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#ccc', marginBottom: '0.4rem', fontWeight: 600 }}>
                비밀번호 (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력 (초기비밀번호: 1234)"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.95rem' }}
              />
            </div>

            {error && (
              <div style={{ color: '#E63946', fontSize: '0.85rem', background: 'rgba(230,57,70,0.1)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn btn-accent" style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}>
              🔑 로그인
            </button>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#aaa', lineHeight: '1.6' }}>
              ℹ️ <strong>안내:</strong><br/>
              - 마스터 계정: <strong>netadmin</strong> (초기비번: 1234)<br/>
              - 계정 생성 후 최초 로그인 시 비밀번호 변경 화면이 자동으로 표시됩니다.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
