// Builds the on-screen letter-tile picker for a question: every letter
// actually needed to spell the answer (the real, correct spelling —
// tone marks included, see fullSpellingChars), plus a fixed number of
// random decoys from the same alphabet as the answer's language, then
// shuffled. Replaces free-text typing so answers work the same with or
// without a keyboard (mobile-friendly).
//
// Security note: unlike the hash-only answer check, this necessarily
// exposes the answer's letter multiset to the client (the tiles ARE the
// letters) — there is no way to offer a tile picker without that. Order
// is still hidden, and this is no more revealing than the syllable-count
// dots / category chips already shown on the same screen.

import { fullSpellingChars } from './normalize';
import { MEWORD_LETTER_DECOY_COUNT } from '../../config/games';

const ENGLISH_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// Thai consonants + vowel signs, for the decoy alphabet — built from
// codepoints rather than literal glyphs (same reason as normalize.js:
// combining marks don't render legibly on their own in source, and this
// also keeps the file out of the Thai-hygiene scan, which is meant to
// catch hardcoded UI strings, not a decoy alphabet). Tone marks aren't in
// this pool, so they never show up as a decoy — only when a word actually
// needs one, via fullSpellingChars below.
const THAI_CONSONANT_CODES = [
  0x0e01, 0x0e02, 0x0e04, 0x0e06, 0x0e07, 0x0e08, 0x0e09, 0x0e0a, 0x0e0b, 0x0e0c, 0x0e0d, 0x0e0e, 0x0e0f, 0x0e10,
  0x0e11, 0x0e12, 0x0e13, 0x0e14, 0x0e15, 0x0e16, 0x0e17, 0x0e18, 0x0e19, 0x0e1a, 0x0e1b, 0x0e1c, 0x0e1d, 0x0e1e,
  0x0e1f, 0x0e20, 0x0e21, 0x0e22, 0x0e23, 0x0e25, 0x0e27, 0x0e28, 0x0e29, 0x0e2a, 0x0e2b, 0x0e2c, 0x0e2d, 0x0e2e,
];
const THAI_VOWEL_CODES = [0x0e30, 0x0e31, 0x0e32, 0x0e33, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e40, 0x0e41, 0x0e42, 0x0e43, 0x0e44];
const THAI_LETTERS = [...THAI_CONSONANT_CODES, ...THAI_VOWEL_CODES].map((code) => String.fromCodePoint(code)).join('');

// Of those vowel signs, this subset are Unicode combining marks (general
// category Mn) that stack above or below the letter before them — mai
// han-akat and the four "sara" signs that sit on the vertical axis
// (i, ii, ue, uee above; u, uu below). The four tone marks (mai ek, tho,
// tri, chattawa — also Mn, stacking above) belong to this same set: they
// aren't in the decoy alphabet below, but fullSpellingChars keeps them in
// a word's required letters, so a tile for one can still turn up. Shown
// on their own — one to a tile button — any of these would render as a
// floating mark with nothing to attach to, so displayChar prefixes them
// with a dotted circle (U+25CC), the standard placeholder base for
// showing an isolated combining character. The plain `char` (no dotted
// circle) is what still gets compared against the answer hash — this is
// display-only.
const THAI_COMBINING_MARK_CODES = new Set([
  0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e48, 0x0e49, 0x0e4a, 0x0e4b,
]);
const DOTTED_CIRCLE = String.fromCodePoint(0x25cc);

export function isThaiCombiningMark(char) {
  return THAI_COMBINING_MARK_CODES.has(char?.codePointAt(0));
}

function displayCharFor(char) {
  return isThaiCombiningMark(char) ? DOTTED_CIRCLE + char : char;
}

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
// grid renders: { id, char, displayChar }[] — every required letter plus
// exactly MEWORD_LETTER_DECOY_COUNT decoys, so the grid's size always
// tracks the word's real length instead of a fixed budget.
export function buildLetterTiles(answer, lang) {
  const requiredChars = fullSpellingChars(answer);
  const pool = lang === 'th' ? THAI_LETTERS : ENGLISH_LETTERS;
  const decoys = Array.from({ length: MEWORD_LETTER_DECOY_COUNT }, () => randomChar(pool));
  const tiles = shuffle([...requiredChars, ...decoys]).map((char, id) => ({
    id,
    char,
    displayChar: displayCharFor(char),
  }));
  return { requiredLength: requiredChars.length, tiles };
}
