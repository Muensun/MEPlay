import { describe, expect, it } from 'vitest';
import { accrue, MAX_TIME_SEC } from './time';

describe('accrue', () => {
  it('keeps a full balance capped with no banked overflow after a 3-day gap', () => {
    const now = 1_000_000;
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const stats = { timeSec: MAX_TIME_SEC, lastAccrualAt: now - threeDaysMs };

    const result = accrue(stats, now);

    expect(result.timeSec).toBe(MAX_TIME_SEC);
    expect(result.lastAccrualAt).toBe(now);
  });

  it('accrues whole intervals and keeps the remainder after a 47-minute gap at 120s', () => {
    const fortySevenMinMs = 47 * 60 * 1000;
    const start = 0;
    const now = start + fortySevenMinMs;
    const stats = { timeSec: 120, lastAccrualAt: start };

    const result = accrue(stats, now);

    // floor(47/15) = 3 intervals -> +180s -> 300s
    expect(result.timeSec).toBe(300);
    // lastAccrualAt advances by exactly 3 * 15min = 45min, not reset to `now`
    expect(result.lastAccrualAt).toBe(start + 45 * 60 * 1000);
  });

  it('does not accrue before a full interval has passed', () => {
    const stats = { timeSec: 120, lastAccrualAt: 0 };
    const result = accrue(stats, 5 * 60 * 1000); // only 5 of 15 minutes

    expect(result).toBe(stats);
  });

  it('caps at MAX_TIME_SEC and resets lastAccrualAt to now when an interval pushes past the ceiling', () => {
    const stats = { timeSec: 570, lastAccrualAt: 0 }; // 30s short of full
    const now = 15 * 60 * 1000; // exactly one interval
    const result = accrue(stats, now);

    expect(result.timeSec).toBe(MAX_TIME_SEC);
    expect(result.lastAccrualAt).toBe(now);
  });
});
