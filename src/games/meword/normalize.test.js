import { describe, expect, it } from 'vitest';
import { fullSpellingChars, normalizeAnswer } from './normalize';

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

describe('fullSpellingChars', () => {
  it('keeps Thai tone marks, unlike normalizeAnswer', () => {
    const chars = fullSpellingChars('ล่า');
    expect(chars).toContain('่');
    expect(chars.join('')).not.toBe(normalizeAnswer('ล่า'));
  });

  it('still drops whitespace and lowercases, same as normalizeAnswer', () => {
    expect(fullSpellingChars('  Wind Turbine ').join('')).toBe('windturbine');
  });

  it('a guess assembled from fullSpellingChars still normalizes to match a tone-free hash target', () => {
    // The tile picker requires tone marks (fullSpellingChars), but
    // verification hashes normalizeAnswer(guess) — so a guess built from
    // the full spelling must still normalize down to the same string a
    // tone-mark-free guess would.
    const withTones = fullSpellingChars('ล่า').join('');
    expect(normalizeAnswer(withTones)).toBe(normalizeAnswer('ลา'));
  });
});
