import { describe, expect, it } from 'vitest';
import { buildLetterTiles } from './letterTiles';
import { normalizeAnswer } from './normalize';
import { MEWORD_LETTER_TILE_COUNT } from '../../config/games';

function multiset(chars) {
  const m = new Map();
  for (const c of chars) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

describe('buildLetterTiles', () => {
  it('pads an English answer up to the full tile count', () => {
    const { requiredLength, tiles } = buildLetterTiles('Carnivore', 'en');
    expect(requiredLength).toBe(normalizeAnswer('Carnivore').length);
    expect(tiles).toHaveLength(MEWORD_LETTER_TILE_COUNT);
  });

  it('includes every letter needed to spell the normalised answer, at least once each', () => {
    const answer = 'Carnivore';
    const { tiles } = buildLetterTiles(answer, 'en');
    const need = multiset(normalizeAnswer(answer));
    const have = multiset(tiles.map((t) => t.char));
    for (const [char, count] of need) {
      expect(have.get(char) ?? 0).toBeGreaterThanOrEqual(count);
    }
  });

  it('only uses lowercase a-z decoys for English answers', () => {
    const { tiles } = buildLetterTiles('cat', 'en');
    for (const { char } of tiles) {
      expect(char).toMatch(/^[a-z]$/);
    }
  });

  it('only uses Thai script decoys for Thai answers', () => {
    // Codepoint escape ranges rather than literal glyphs — Thai combining
    // marks don't render legibly on their own in source (see normalize.js).
    const THAI_BLOCK = new RegExp('[\\u0E00-\\u0E7F]');
    const THAI_TONE_MARKS = new RegExp('[\\u0E48-\\u0E4B]');
    const { tiles } = buildLetterTiles('ผู้ล่า', 'th');
    for (const { char } of tiles) {
      expect(char).toMatch(THAI_BLOCK);
      // never a tone mark — normalizeAnswer strips those, so one could
      // never be a required letter and would be a useless decoy
      expect(char).not.toMatch(THAI_TONE_MARKS);
    }
  });

  it('strips tone marks from the required letters, matching normalizeAnswer', () => {
    const { requiredLength, tiles } = buildLetterTiles('ผู้ล่า', 'th');
    expect(requiredLength).toBe(normalizeAnswer('ผู้ล่า').length);
    const need = multiset(normalizeAnswer('ผู้ล่า'));
    const have = multiset(tiles.map((t) => t.char));
    for (const [char, count] of need) {
      expect(have.get(char) ?? 0).toBeGreaterThanOrEqual(count);
    }
  });

  it('grows past the tile count for an answer longer than it, without dropping letters', () => {
    const longAnswer = 'a'.repeat(MEWORD_LETTER_TILE_COUNT + 5);
    const { requiredLength, tiles } = buildLetterTiles(longAnswer, 'en');
    expect(requiredLength).toBe(MEWORD_LETTER_TILE_COUNT + 5);
    expect(tiles.length).toBe(MEWORD_LETTER_TILE_COUNT + 5);
    expect(tiles.filter((t) => t.char === 'a').length).toBe(MEWORD_LETTER_TILE_COUNT + 5);
  });

  it('assigns each tile a unique id', () => {
    const { tiles } = buildLetterTiles('mycorrhiza', 'en');
    const ids = new Set(tiles.map((t) => t.id));
    expect(ids.size).toBe(tiles.length);
  });

  it('drops whitespace from multi-word answers, same as normalizeAnswer', () => {
    const { requiredLength } = buildLetterTiles('Wind Turbine', 'en');
    expect(requiredLength).toBe(normalizeAnswer('Wind Turbine').length);
    expect(normalizeAnswer('Wind Turbine')).not.toMatch(/\s/);
  });
});
