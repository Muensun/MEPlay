import { createContext, useContext, useEffect, useState } from 'react';
import { en } from '../i18n/en';
import { accrue } from '../lib/time';
import {
  loadUsers,
  saveUsers,
  loadAllStats,
  saveAllStats,
  loadCurrentUserId,
  saveCurrentUserId,
  makeId,
  newUserStats,
} from '../lib/storage';

const AuthContext = createContext(null);
const ACCRUAL_POLL_MS = 30 * 1000;

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [allStats, setAllStats] = useState(loadAllStats);
  const [currentUserId, setCurrentUserId] = useState(loadCurrentUserId);

  useEffect(() => saveUsers(users), [users]);
  useEffect(() => saveAllStats(allStats), [allStats]);
  useEffect(() => saveCurrentUserId(currentUserId), [currentUserId]);

  // Accrue the active account's time balance on load, on focus, and every
  // 30s while idle — derived from timestamps, never a running countdown,
  // so it's correct even if the tab was closed for days.
  useEffect(() => {
    if (!currentUserId) return undefined;

    function tick() {
      setAllStats((prev) => {
        const current = prev[currentUserId];
        if (!current) return prev;
        const next = accrue(current, Date.now());
        if (next === current) return prev;
        return { ...prev, [currentUserId]: next };
      });
    }

    tick();
    const interval = setInterval(tick, ACCRUAL_POLL_MS);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', tick);
    };
  }, [currentUserId]);

  const user = users.find((u) => u.id === currentUserId) ?? null;
  const stats = currentUserId ? allStats[currentUserId] ?? null : null;

  function usernameTaken(clean) {
    return users.some((u) => u.username.toLowerCase() === clean);
  }

  function createAccount(username, avatarId) {
    const clean = username.trim();
    if (!clean) return { ok: false, error: en.auth.errors.usernameRequired };
    if (!avatarId) return { ok: false, error: en.auth.errors.avatarRequired };
    if (usernameTaken(clean.toLowerCase())) {
      return { ok: false, error: en.auth.errors.usernameTaken };
    }

    const id = makeId('user');
    const now = Date.now();
    const newUser = { id, username: clean, avatarId, createdAt: now };

    setUsers((prev) => [...prev, newUser]);
    setAllStats((prev) => ({ ...prev, [id]: newUserStats(id, now) }));
    setCurrentUserId(id);
    return { ok: true };
  }

  function loginAs(userId) {
    const found = users.find((u) => u.id === userId);
    if (!found) return { ok: false, error: en.auth.errors.accountNotFound };
    setCurrentUserId(userId);
    return { ok: true };
  }

  function logout() {
    // Clears session only — meScore/timeSec stay in allStats under the
    // account's id and are restored on next login.
    setCurrentUserId(null);
  }

  function addScore(amount) {
    if (!currentUserId || !amount) return;
    setAllStats((prev) => {
      const current = prev[currentUserId];
      if (!current) return prev;
      return { ...prev, [currentUserId]: { ...current, meScore: current.meScore + amount } };
    });
  }

  function spendTime(amountSec) {
    if (!currentUserId || !amountSec) return;
    setAllStats((prev) => {
      const current = prev[currentUserId];
      if (!current) return prev;
      const timeSec = Math.max(0, current.timeSec - amountSec);
      return { ...prev, [currentUserId]: { ...current, timeSec } };
    });
  }

  const value = {
    user,
    users,
    stats,
    allStats,
    createAccount,
    loginAs,
    logout,
    addScore,
    spendTime,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
