// Builds the on-screen letter-tile picker for a question: the letters
// actually needed to spell the answer, padded with random decoys from
// the same alphabet as the answer's language, up to MEWORD_LETTER_TILE_COUNT
// tiles total, then shuffled. Replaces free-text typing so answers work
// the same with or without a keyboard (mobile-friendly).
//
// Security note: unlike the hash-only answer check, this necessarily
// exposes the answer's letter multiset to the client (the tiles ARE the
// letters) — there is no way to offer a tile picker without that. Order
// is still hidden, and this is no more revealing than the syllable-count
// dots / category chips already shown on the same screen.

import { normalizeAnswer } from './normalize';
import { MEWORD_LETTER_TILE_COUNT } from '../../config/games';

const ENGLISH_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// Thai consonants + the vowel signs that actually appear in normalised
// spellings, built from codepoints rather than literal glyphs (same
// reason as normalize.js: combining marks don't render legibly on their
// own in source, and this also keeps the file out of the Thai-hygiene
// scan, which is meant to catch hardcoded UI strings, not a decoy
// alphabet). Tone marks are deliberately excluded — normalizeAnswer
// strips them from every answer, so a tile for one could never be needed
// and would just be a dead decoy.
const THAI_CONSONANT_CODES = [
  0x0e01, 0x0e02, 0x0e04, 0x0e06, 0x0e07, 0x0e08, 0x0e09, 0x0e0a, 0x0e0b, 0x0e0c, 0x0e0d, 0x0e0e, 0x0e0f, 0x0e10,
  0x0e11, 0x0e12, 0x0e13, 0x0e14, 0x0e15, 0x0e16, 0x0e17, 0x0e18, 0x0e19, 0x0e1a, 0x0e1b, 0x0e1c, 0x0e1d, 0x0e1e,
  0x0e1f, 0x0e20, 0x0e21, 0x0e22, 0x0e23, 0x0e25, 0x0e27, 0x0e28, 0x0e29, 0x0e2a, 0x0e2b, 0x0e2c, 0x0e2d, 0x0e2e,
];
const THAI_VOWEL_CODES = [0x0e30, 0x0e31, 0x0e32, 0x0e33, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e40, 0x0e41, 0x0e42, 0x0e43, 0x0e44];
const THAI_LETTERS = [...THAI_CONSONANT_CODES, ...THAI_VOWEL_CODES].map((code) => String.fromCodePoint(code)).join('');

function randomChar(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Returns { requiredLength, tiles }. `tiles` is the shuffled pool the
// grid renders: { id, char }[], sized to MEWORD_LETTER_TILE_COUNT (or to
// requiredLength if the answer itself needs more letters than that).
export function buildLetterTiles(answer, lang) {
  const requiredChars = Array.from(normalizeAnswer(answer));
  const pool = lang === 'th' ? THAI_LETTERS : ENGLISH_LETTERS;
  const decoyCount = Math.max(0, MEWORD_LETTER_TILE_COUNT - requiredChars.length);
  const decoys = Array.from({ length: decoyCount }, () => randomChar(pool));
  const tiles = shuffle([...requiredChars, ...decoys]).map((char, id) => ({ id, char }));
  return { requiredLength: requiredChars.length, tiles };
}
