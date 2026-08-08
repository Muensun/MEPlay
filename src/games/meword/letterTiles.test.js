import { describe, expect, it } from 'vitest';
import { buildLetterTiles, isThaiCombiningMark } from './letterTiles';
import { fullSpellingChars, normalizeAnswer } from './normalize';
import { MEWORD_LETTER_DECOY_COUNT } from '../../config/games';

const DOTTED_CIRCLE = String.fromCodePoint(0x25cc);

function multiset(chars) {
  const m = new Map();
  for (const c of chars) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

describe('buildLetterTiles', () => {
  it('sizes the grid to the required letters plus exactly the decoy count', () => {
    const { requiredLength, tiles } = buildLetterTiles('Carnivore', 'en');
    expect(requiredLength).toBe(fullSpellingChars('Carnivore').length);
    expect(tiles).toHaveLength(requiredLength + MEWORD_LETTER_DECOY_COUNT);
  });

  it('includes every letter needed to spell the full answer, at least once each', () => {
    const answer = 'Carnivore';
    const { tiles } = buildLetterTiles(answer, 'en');
    const need = multiset(fullSpellingChars(answer));
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

  it('only draws Thai script decoys from the pool, but keeps tone marks the word actually needs', () => {
    // Codepoint escape ranges rather than literal glyphs — Thai combining
    // marks don't render legibly on their own in source (see normalize.js).
    const THAI_BLOCK = new RegExp('[\\u0E00-\\u0E7F]');
    const answer = 'ผู้ล่า'; // needs both mai tho (U+0E49) and mai ek (U+0E48)
    const { tiles, requiredLength } = buildLetterTiles(answer, 'th');
    for (const { char } of tiles) {
      expect(char).toMatch(THAI_BLOCK);
    }
    // total tiles = every required letter (tone marks included) + decoys
    expect(tiles).toHaveLength(requiredLength + MEWORD_LETTER_DECOY_COUNT);
  });

  it('keeps tone marks in the required letters, unlike normalizeAnswer', () => {
    // ผู้ล่า needs mai tho (U+0E49) and mai ek (U+0E48) to be spelled
    // correctly — normalizeAnswer strips both for lenient hash matching,
    // but the tile picker should still require (and offer) them.
    const answer = 'ผู้ล่า';
    const { requiredLength, tiles } = buildLetterTiles(answer, 'th');
    expect(requiredLength).toBe(fullSpellingChars(answer).length);
    expect(requiredLength).toBeGreaterThan(normalizeAnswer(answer).length);

    const need = multiset(fullSpellingChars(answer));
    const have = multiset(tiles.map((t) => t.char));
    for (const [char, count] of need) {
      expect(have.get(char) ?? 0).toBeGreaterThanOrEqual(count);
    }
    expect(have.get('้') ?? 0).toBeGreaterThanOrEqual(1); // mai tho
    expect(have.get('่') ?? 0).toBeGreaterThanOrEqual(1); // mai ek
  });

  it('always adds exactly MEWORD_LETTER_DECOY_COUNT decoys, however long the word', () => {
    const short = buildLetterTiles('cat', 'en');
    const long = buildLetterTiles('mycorrhiza', 'en');
    expect(short.tiles.length - short.requiredLength).toBe(MEWORD_LETTER_DECOY_COUNT);
    expect(long.tiles.length - long.requiredLength).toBe(MEWORD_LETTER_DECOY_COUNT);
  });

  it('assigns each tile a unique id', () => {
    const { tiles } = buildLetterTiles('mycorrhiza', 'en');
    const ids = new Set(tiles.map((t) => t.id));
    expect(ids.size).toBe(tiles.length);
  });

  it('drops whitespace from multi-word answers, same as normalizeAnswer', () => {
    const { requiredLength } = buildLetterTiles('Wind Turbine', 'en');
    expect(requiredLength).toBe(fullSpellingChars('Wind Turbine').length);
    expect(fullSpellingChars('Wind Turbine').join('')).not.toMatch(/\s/);
  });

  it('prefixes a dotted circle onto combining vowel signs so a lone tile is legible', () => {
    // ผู้ล่า needs ู (sara u, U+0E39) — a combining mark that stacks below
    // the preceding consonant and renders as a floating mark with nothing
    // to attach to when it's alone on its own tile button.
    const { tiles } = buildLetterTiles('ผู้ล่า', 'th');
    const saraU = tiles.find((t) => t.char === 'ู');
    expect(saraU.displayChar).toBe(DOTTED_CIRCLE + 'ู');
  });

  it('prefixes a dotted circle onto tone marks too', () => {
    const { tiles } = buildLetterTiles('ผู้ล่า', 'th');
    const maiTho = tiles.find((t) => t.char === '้');
    expect(maiTho.displayChar).toBe(DOTTED_CIRCLE + '้');
  });

  it('leaves displayChar untouched for non-combining characters', () => {
    const { tiles } = buildLetterTiles('cat', 'en');
    for (const tile of tiles) {
      expect(tile.displayChar).toBe(tile.char);
    }
  });

  it('identifies the above/below Thai vowel signs and tone marks as combining marks', () => {
    // mai han-akat (above), sara i/ii/ue/uee (above), sara u/uu (below),
    // and the four tone marks (all above)
    for (const code of [0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e48, 0x0e49, 0x0e4a, 0x0e4b]) {
      expect(isThaiCombiningMark(String.fromCodePoint(code))).toBe(true);
    }
  });

  it('does not treat same-line vowels or consonants as combining marks', () => {
    // สระอา (า) and สระอำ (ำ) sit on the baseline, not stacked, and render
    // fine on their own — only the above/below signs need the dotted circle.
    for (const code of [0x0e01, 0x0e30, 0x0e32, 0x0e33, 0x0e40]) {
      expect(isThaiCombiningMark(String.fromCodePoint(code))).toBe(false);
    }
  });
});
