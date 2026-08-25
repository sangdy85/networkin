'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const INITIAL_USERS = [
  {
    id: 'netadmin',
    name: '마스터 관리자',
    role: '마스터 관리자',
    password: '1234',
    isFirstLogin: false,
    department: '네트워크사업부',
    rank: '총괄이사',
    duty: '마스터 총괄',
    hireDate: '2020-01-01',
    task: '시스템 총괄 및 인프라 보안',
    phone: '02-6207-8000',
    mobile: '010-1234-5678',
    fax: '02-6207-8001',
    address: '서울특별시 중구 남대문로 84'
  },
  {
    id: 'leekw',
    name: '이강욱 팀장',
    role: '관리자',
    password: '1234',
    isFirstLogin: false,
    department: '네트워크사업부',
    rank: '팀장',
    duty: '시공총괄',
    hireDate: '2022-03-15',
    task: '인프라 시공 및 프로젝트 관리',
    phone: '041-550-1000',
    mobile: '010-9876-5432',
    fax: '041-550-1001',
    address: '충청남도 천안시 서북구 벤처로 10'
  },
  {
    id: 'kimcs',
    name: '김철수 과장',
    role: '일반',
    password: '1234',
    isFirstLogin: true,
    department: 'SBI저축은행 파견팀',
    rank: '과장',
    duty: '사원',
    hireDate: '2024-05-10',
    task: '배선공사 현장엔지니어',
    phone: '02-6207-8000',
    mobile: '010-5555-7777',
    fax: '02-6207-8001',
    address: '서울특별시 강남구 테헤란로 123'
  },
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch users from server SQLite DB
  const fetchUsersFromAPI = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      }
    } catch (e) {
      console.error('Fetch users error', e);
    }
  };

  useEffect(() => {
    fetchUsersFromAPI();

    const savedUser = localStorage.getItem('einstec_current_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
    
    setIsInitialized(true);
  }, []);

  const saveCurrentUserState = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('einstec_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('einstec_current_user');
    }
  };

  // Explicit Login
  const login = (userId, password) => {
    const target = users.find((u) => u.id.toLowerCase() === userId.toLowerCase());
    if (!target) {
      return { success: false, message: '존재하지 않는 아이디입니다.' };
    }
    if (target.password !== password) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    saveCurrentUserState(target);
    setShowLoginModal(false);
    return { success: true, user: target };
  };

  // Explicit Logout
  const logout = () => {
    saveCurrentUserState(null);
  };

  // Admin Account Creation (Server DB Sync)
  const createAccount = async (accountData) => {
    const { id } = accountData;

    if (users.some((u) => u.id.toLowerCase() === id.toLowerCase())) {
      return { success: false, message: '이미 존재하는 아이디입니다.' };
    }

    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || '계정 생성 실패' };
      }

      await fetchUsersFromAPI();
      return { success: true, id };
    } catch (e) {
      return { success: false, message: `계정 생성 오류: ${e.message}` };
    }
  };

  // Update Account Info (Server DB Sync)
  const updateAccountInfo = async (userId, updatedFields) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...updatedFields })
      });

      if (res.ok) {
        await fetchUsersFromAPI();
        if (currentUser?.id.toLowerCase() === userId.toLowerCase()) {
          saveCurrentUserState({ ...currentUser, ...updatedFields });
        }
        return { success: true };
      }
      return { success: false, message: '계정 정보 수정 실패' };
    } catch (e) {
      return { success: false, message: `오류: ${e.message}` };
    }
  };

  // Change User Role (관리자 / 일반)
  const changeUserRole = async (userId, newRole) => {
    return await updateAccountInfo(userId, { role: newRole });
  };

  // Delete User Account (Server DB Sync)
  const deleteUser = async (userId) => {
    if (userId === 'netadmin') {
      return { success: false, message: '마스터 계정(netadmin)은 삭제할 수 없습니다.' };
    }
    try {
      const res = await fetch(`/api/auth/users?id=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchUsersFromAPI();
        return { success: true };
      }
      return { success: false, message: '계정 삭제 실패' };
    } catch (e) {
      return { success: false, message: `오류: ${e.message}` };
    }
  };

  // Mandatory First-Time Password Change Handler
  const changePassword = async (newPassword) => {
    if (!currentUser) return { success: false };
    return await updateAccountInfo(currentUser.id, { password: newPassword, isFirstLogin: false });
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        isInitialized,
        login,
        logout,
        createAccount,
        updateAccountInfo,
        changeUserRole,
        deleteUser,
        changePassword,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
