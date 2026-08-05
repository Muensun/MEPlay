// Time-point economy: the single currency required to play any game.
// Pure functions only — no React, no localStorage — so they're trivial
// to unit test and reused by both the header display and the game shell.

export const MAX_TIME_SEC = 600; // 10 minutes, hard ceiling
export const REGEN_AMOUNT_SEC = 60; // +1 minute
export const REGEN_INTERVAL_MS = 15 * 60 * 1000; // per 15 real minutes

/**
 * @param {{ timeSec: number, lastAccrualAt: number }} stats
 * @param {number} now epoch ms
 */
export function accrue(stats, now) {
  if (stats.timeSec >= MAX_TIME_SEC) {
    return { ...stats, lastAccrualAt: now }; // full: reset the clock, bank nothing
  }
  const intervals = Math.floor((now - stats.lastAccrualAt) / REGEN_INTERVAL_MS);
  if (intervals <= 0) return stats;

  const timeSec = Math.min(MAX_TIME_SEC, stats.timeSec + intervals * REGEN_AMOUNT_SEC);
  const lastAccrualAt =
    timeSec >= MAX_TIME_SEC
      ? now
      : stats.lastAccrualAt + intervals * REGEN_INTERVAL_MS; // keep the remainder

  return { ...stats, timeSec, lastAccrualAt };
}

/** Seconds remaining until the next +1:00 tick, given the current (already-accrued) stats. */
export function secToNextRefill(stats, now) {
  if (stats.timeSec >= MAX_TIME_SEC) return 0;
  const elapsed = now - stats.lastAccrualAt;
  const remainder = REGEN_INTERVAL_MS - (elapsed % REGEN_INTERVAL_MS);
  return Math.ceil(remainder / 1000);
}

export function formatMMSS(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
