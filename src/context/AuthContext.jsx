import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = 'meplay_users';
const SESSION_KEY = 'meplay_session';

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [username, setUsername] = useState(() => localStorage.getItem(SESSION_KEY));

  useEffect(() => saveUsers(users), [users]);

  useEffect(() => {
    if (username) localStorage.setItem(SESSION_KEY, username);
    else localStorage.removeItem(SESSION_KEY);
  }, [username]);

  const user = users.find((u) => u.username === username) ?? null;

  function register(newUsername, password, displayName) {
    const clean = newUsername.trim().toLowerCase();
    if (!clean || !password) return { ok: false, error: 'กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ' };
    if (users.some((u) => u.username === clean)) {
      return { ok: false, error: 'มีชื่อผู้ใช้นี้อยู่แล้ว' };
    }
    const newUser = {
      username: clean,
      password,
      displayName: displayName.trim() || clean,
      points: 0,
      createdAt: Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
    setUsername(clean);
    return { ok: true };
  }

  function login(loginUsername, password) {
    const clean = loginUsername.trim().toLowerCase();
    const found = users.find((u) => u.username === clean);
    if (!found || found.password !== password) {
      return { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    setUsername(clean);
    return { ok: true };
  }

  function logout() {
    setUsername(null);
  }

  function addPoints(amount) {
    if (!username) return;
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, points: u.points + amount } : u))
    );
  }

  const value = { user, users, register, login, logout, addPoints };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
