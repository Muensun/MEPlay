// localStorage-backed data layer. Local-only for now — server-side
// validation comes later (see prompt assumptions). Kept framework-free
// so it's easy to test and easy to swap for a real backend.
//
// User        { id, username, avatarId, createdAt }
// UserStats   { userId, meScore, timeSec, lastAccrualAt }
// GameSession { id, userId, gameId, startedAt, endedAt, meEarned, secondsSpent, answered, correct }

import { MAX_TIME_SEC } from './time';

const USERS_KEY = 'meplay_users_v2';
const STATS_KEY = 'meplay_stats_v2';
const SESSIONS_KEY = 'meplay_sessions_v2';
const CURRENT_USER_KEY = 'meplay_current_user_v2';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadUsers() {
  return read(USERS_KEY, []);
}

export function saveUsers(users) {
  write(USERS_KEY, users);
}

export function loadAllStats() {
  return read(STATS_KEY, {}); // userId -> UserStats
}

export function saveAllStats(stats) {
  write(STATS_KEY, stats);
}

export function loadSessions() {
  return read(SESSIONS_KEY, []);
}

export function saveSessions(sessions) {
  write(SESSIONS_KEY, sessions);
}

export function loadCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function saveCurrentUserId(userId) {
  if (userId) localStorage.setItem(CURRENT_USER_KEY, userId);
  else localStorage.removeItem(CURRENT_USER_KEY);
}

export function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newUserStats(userId, now = Date.now()) {
  return { userId, meScore: 0, timeSec: MAX_TIME_SEC, lastAccrualAt: now };
}
