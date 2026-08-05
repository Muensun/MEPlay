import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from './normalize';

describe('normalizeAnswer', () => {
  it('accepts input with differing whitespace', () => {
    expect(normalizeAnswer('ผู้ ล่า')).toBe(normalizeAnswer('ผู้ล่า'));
    expect(normalizeAnswer('  wind   turbine ')).toBe(normalizeAnswer('windturbine'));
  });

  it('accepts input with differing Thai tone marks', () => {
    expect(normalizeAnswer('ล่า')).toBe(normalizeAnswer('ลา'));
  });

  it('is case-insensitive for Latin script', () => {
    expect(normalizeAnswer('Wind Turbine')).toBe(normalizeAnswer('WIND TURBINE'));
  });
});
