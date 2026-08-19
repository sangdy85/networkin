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

  // Hydration-safe initial loading
  useEffect(() => {
    const savedUsers = localStorage.getItem('einstec_users');
    const savedUser = localStorage.getItem('einstec_current_user');
    
    if (savedUsers) {
      try { setUsers(JSON.parse(savedUsers)); } catch (e) {}
    } else {
      localStorage.setItem('einstec_users', JSON.stringify(INITIAL_USERS));
    }

    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
    
    setIsInitialized(true);
  }, []);

  const saveUsersState = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem('einstec_users', JSON.stringify(newUsers));
  };

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

  // Admin Account Creation (With full Department & Contact Details)
  const createAccount = (accountData) => {
    const { id, name, role, department, rank, duty, hireDate, task, phone, mobile, fax, address } = accountData;

    if (users.some((u) => u.id.toLowerCase() === id.toLowerCase())) {
      return { success: false, message: '이미 존재하는 아이디입니다.' };
    }

    const newUser = {
      id: id.trim(),
      name: name.trim() || id.trim(),
      role: role || '일반',
      password: '1234', // Initial default password
      isFirstLogin: true,
      department: department || '네트워크사업부',
      rank: rank || '사원',
      duty: duty || '팀원',
      hireDate: hireDate || new Date().toISOString().split('T')[0],
      task: task || '인프라 관리',
      phone: phone || '',
      mobile: mobile || '',
      fax: fax || '',
      address: address || ''
    };

    const updated = [...users, newUser];
    saveUsersState(updated);
    return { success: true, user: newUser };
  };

  // Update Account Info
  const updateAccountInfo = (userId, updatedFields) => {
    const updatedUsers = users.map((u) => u.id === userId ? { ...u, ...updatedFields } : u);
    saveUsersState(updatedUsers);
    if (currentUser?.id === userId) {
      saveCurrentUserState({ ...currentUser, ...updatedFields });
    }
    return { success: true };
  };

  // Change User Role (관리자 / 일반)
  const changeUserRole = (userId, newRole) => {
    updateAccountInfo(userId, { role: newRole });
  };

  // Delete User Account
  const deleteUser = (userId) => {
    if (userId === 'netadmin') {
      return { success: false, message: '마스터 계정(netadmin)은 삭제할 수 없습니다.' };
    }
    const updated = users.filter((u) => u.id !== userId);
    saveUsersState(updated);
    return { success: true };
  };

  // Mandatory First-Time Password Change Handler
  const changePassword = (newPassword) => {
    if (!currentUser) return { success: false };
    return updateAccountInfo(currentUser.id, { password: newPassword, isFirstLogin: false });
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
