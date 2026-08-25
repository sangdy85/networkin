'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { currentUser, users, createAccount, changeUserRole, deleteUser, updateAccountInfo, setShowLoginModal } = useAuth();
  
  // Account Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '일반',
    department: '네트워크사업부',
    rank: '과장',
    duty: '사원',
    hireDate: '',
    task: '',
    phoneArea: '02',
    phoneMid: '6207',
    phoneEnd: '8000',
    mobile: '010-1234-5678',
    faxArea: '02',
    faxMid: '',
    faxEnd: '',
    addressZip: '',
    address: ''
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editingUserModal, setEditingUserModal] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isMaster = currentUser?.id === 'netadmin' || currentUser?.role === '마스터 관리자';

  const handleOpenEditUser = (user) => {
    setEditingUserModal(user);
    setEditFormData({
      name: user.name || '',
      role: user.role || '일반',
      password: user.password || '1234',
      department: user.department || '',
      rank: user.rank || '',
      duty: user.duty || '',
      hireDate: user.hireDate || '',
      task: user.task || '',
      phone: user.phone || '',
      mobile: user.mobile || '',
      fax: user.fax || '',
      address: user.address || ''
    });
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUserModal) return;

    const res = await updateAccountInfo(editingUserModal.id, editFormData);
    if (res.success) {
      alert(`[${editingUserModal.id}] 계정 정보가 성공적으로 수정되었습니다!`);
      setEditingUserModal(null);
    } else {
      alert(`수정 실패: ${res.message || '수정 실패'}`);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.id.trim()) {
      setErrorMsg('생성할 계정의 아이디를 입력해 주세요.');
      return;
    }

    const fullPhone = formData.phoneMid ? `${formData.phoneArea}-${formData.phoneMid}-${formData.phoneEnd}` : '';
    const fullFax = formData.faxMid ? `${formData.faxArea}-${formData.faxMid}-${formData.faxEnd}` : '';

    const res = await createAccount({
      ...formData,
      id: formData.id.trim(),
      name: formData.name.trim() || formData.id.trim(),
      phone: fullPhone,
      fax: fullFax,
    });

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(`계정 [${formData.id.trim()}] 및 주 부서/연락처 정보가 성공적으로 등록되었습니다! (초기비밀번호: 1234)`);
      setFormData({
        id: '',
        name: '',
        role: '일반',
        department: '네트워크사업부',
        rank: '과장',
        duty: '사원',
        hireDate: '',
        task: '',
        phoneArea: '02',
        phoneMid: '',
        phoneEnd: '',
        mobile: '',
        faxArea: '02',
        faxMid: '',
        faxEnd: '',
        addressZip: '',
        address: ''
      });
    }
  };

  if (!isMaster) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#E63946' }}>접근 권한 제한</h2>
        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
          계정 생성 및 주 부서/연락처 관리는 마스터 계정(<strong>netadmin</strong>) 권한만 이용할 수 있습니다.
        </p>
        <button onClick={() => setShowLoginModal(true)} className="btn btn-accent">
          🔑 netadmin 마스터 계정으로 전환하기
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="portal-header">
        <div>
          <h1 className="portal-title">🔐 마스터 계정 전용 - 계정 생성 및 주 부서/연락처 관리</h1>
          <p className="portal-subtitle">신규 임직원 계정 생성, 조직 정보(부서/직급/직책) 및 회사/모바일 연락처 관리 센터</p>
        </div>
        <span className="badge badge-active" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          👑 접속 계정: {currentUser.id} ({currentUser.role})
        </span>
      </header>

      {/* Form: Account Creation with Department & Contact Table Form */}
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <div className="panel-header">
          <h2 className="panel-title">📝 신규 계정 생성 및 주 부서 / 연락처 등록</h2>
        </div>

        <form onSubmit={handleCreateSubmit}>
          {/* Account Basic Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginBottom: '0.3rem' }}>
                계정 아이디 (ID) <span style={{ color: '#E63946' }}>*필수</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="예: netadmin, user2026"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>성명</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="예: 홍길동 과장"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>초기 권한</label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#1C2541', border: '1px solid var(--border-color)', color: 'white' }}
              >
                <option value="일반">일반 사원</option>
                <option value="관리자">관리자</option>
              </select>
            </div>
          </div>

          {/* Department & Contact Table Form (Exact Form from Image) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-accent)' }}>
              ■ 주 부서 정보 및 연락처 양식
            </h3>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '120px', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>부서</th>
                    <td style={{ padding: '0.5rem 0.75rem', width: '38%' }}>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="부서명을 입력해 주세요"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                    <th style={{ width: '120px', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>직급</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="text"
                        value={formData.rank}
                        onChange={(e) => handleInputChange('rank', e.target.value)}
                        placeholder="예: 과장, 대리, 팀장"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>직책</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="text"
                        value={formData.duty}
                        onChange={(e) => handleInputChange('duty', e.target.value)}
                        placeholder="예: 사원, 팀원"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>입사일</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => handleInputChange('hireDate', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>담당업무</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="text"
                        value={formData.task}
                        onChange={(e) => handleInputChange('task', e.target.value)}
                        placeholder="예: 통신배선 시공 및 광케이블 유지보수"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>핸드폰 번호</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        placeholder="010-0000-0000"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>회사전화</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <select
                          value={formData.phoneArea}
                          onChange={(e) => handleInputChange('phoneArea', e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '4px', background: '#1C2541', border: '1px solid var(--border-color)', color: 'white' }}
                        >
                          <option value="02">02</option>
                          <option value="031">031</option>
                          <option value="041">041</option>
                          <option value="042">042</option>
                        </select>
                        <span>-</span>
                        <input
                          type="text"
                          value={formData.phoneMid}
                          onChange={(e) => handleInputChange('phoneMid', e.target.value)}
                          placeholder="6207"
                          style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', textAlign: 'center' }}
                        />
                        <span>-</span>
                        <input
                          type="text"
                          value={formData.phoneEnd}
                          onChange={(e) => handleInputChange('phoneEnd', e.target.value)}
                          placeholder="8000"
                          style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', textAlign: 'center' }}
                        />
                      </div>
                    </td>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>회사주소</th>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <input
                          type="text"
                          value={formData.addressZip}
                          onChange={(e) => handleInputChange('addressZip', e.target.value)}
                          placeholder="우편번호"
                          style={{ width: '90px', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                        />
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                          ▶ 주소검색
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="상세 회사 주소를 입력하세요"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                      />
                    </td>
                  </tr>

                  <tr>
                    <th style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', color: '#ccc', textAlign: 'left' }}>회사팩스</th>
                    <td colSpan={3} style={{ padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <select
                          value={formData.faxArea}
                          onChange={(e) => handleInputChange('faxArea', e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '4px', background: '#1C2541', border: '1px solid var(--border-color)', color: 'white' }}
                        >
                          <option value="02">02</option>
                          <option value="031">031</option>
                          <option value="041">041</option>
                        </select>
                        <span>-</span>
                        <input
                          type="text"
                          value={formData.faxMid}
                          onChange={(e) => handleInputChange('faxMid', e.target.value)}
                          placeholder="팩스번호"
                          style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', textAlign: 'center' }}
                        />
                        <span>-</span>
                        <input
                          type="text"
                          value={formData.faxEnd}
                          onChange={(e) => handleInputChange('faxEnd', e.target.value)}
                          placeholder="팩스번호"
                          style={{ width: '70px', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', textAlign: 'center' }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#E63946', fontSize: '0.85rem', background: 'rgba(230,57,70,0.1)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: '#38B000', fontSize: '0.85rem', background: 'rgba(56,176,0,0.1)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem' }}>
              ✅ {successMsg}
            </div>
          )}

          <button type="submit" className="btn btn-accent" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            ⚡ 계정 및 부서/연락처 등록 완료
          </button>
        </form>
      </div>

      {/* Table: Account, Department & Contact Management List */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">👥 등록된 사내 임직원 부서 및 연락처 관리 ({users.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>성명</th>
                <th>부서</th>
                <th>직급/직책</th>
                <th>담당업무</th>
                <th>회사전화 / 핸드폰</th>
                <th>권한</th>
                <th>비밀번호 상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: u.id === 'netadmin' ? 'var(--color-accent)' : '#fff' }}>
                    {u.id === 'netadmin' && '👑 '}
                    {u.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td><span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{u.department || '-'}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{u.rank} ({u.duty})</td>
                  <td style={{ fontSize: '0.82rem', color: '#ccc' }}>{u.task || '-'}</td>
                  <td style={{ fontSize: '0.82rem', color: '#aaa' }}>
                    <div>☎️ {u.phone || '미등록'}</div>
                    {u.mobile && <div style={{ color: 'var(--color-accent)' }}>📱 {u.mobile}</div>}
                  </td>
                  <td>
                    {u.id !== 'netadmin' ? (
                      <select
                        value={u.role}
                        onChange={(e) => changeUserRole(u.id, e.target.value)}
                        style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.78rem' }}
                      >
                        <option value="일반">일반</option>
                        <option value="관리자">관리자</option>
                      </select>
                    ) : (
                      <span className="badge badge-urgent">마스터</span>
                    )}
                  </td>
                  <td>
                    {u.isFirstLogin ? (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,183,3,0.2)', color: '#FFB703', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        🔑 최초대기
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(56,176,0,0.2)', color: '#38B000', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        ✅ 정상
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                      >
                        ✏️ 수정
                      </button>
                      {u.id !== 'netadmin' && (
                        <button
                          onClick={() => {
                            if (confirm(`계정 [${u.id}]를 삭제하시겠습니까?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#E63946', borderColor: '#E63946' }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ Edit User Profile Modal */}
      {editingUserModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '640px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="panel-header">
              <h2 className="panel-title">✏️ 사원 회원정보 수정 [{editingUserModal.id}]</h2>
              <button onClick={() => setEditingUserModal(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>아이디 (수정불가)</label>
                  <input type="text" value={editingUserModal.id} disabled style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#aaa' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>성명 *</label>
                  <input type="text" value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>비밀번호</label>
                  <input type="password" value={editFormData.password || ''} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} placeholder="변경할 비밀번호" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>권한</label>
                  <select value={editFormData.role || '일반'} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}>
                    <option value="일반">일반</option>
                    <option value="관리자">관리자</option>
                    <option value="마스터 관리자">마스터 관리자</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>부서</label>
                  <input type="text" value={editFormData.department || ''} onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>직급</label>
                  <input type="text" value={editFormData.rank || ''} onChange={(e) => setEditFormData({ ...editFormData, rank: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>직책</label>
                  <input type="text" value={editFormData.duty || ''} onChange={(e) => setEditFormData({ ...editFormData, duty: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>휴대전화</label>
                  <input type="text" value={editFormData.mobile || ''} onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })} placeholder="010-0000-0000" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>회사전화</label>
                  <input type="text" value={editFormData.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>담당업무</label>
                  <input type="text" value={editFormData.task || ''} onChange={(e) => setEditFormData({ ...editFormData, task: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>주소</label>
                <input type="text" value={editFormData.address || ''} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingUserModal(null)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">💾 정보 수정 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
