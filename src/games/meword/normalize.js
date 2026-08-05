// Shared answer normaliser — used both at build time (scripts/build-words.mjs,
// to hash accepted answers) and at runtime (to normalise what the player
// typed before hashing it for comparison). Must stay byte-identical between
// the two call sites or every hash comparison fails.
//
// Steps: NFC normalise, strip Thai tone marks, strip all whitespace, lowercase.

// mai ek, mai tho, mai tri, mai chattawa — written as a codepoint
// escape range rather than the literal combining marks, which don't
// render legibly on their own in source.
const THAI_TONE_MARKS = /[\u0E48-\u0E4B]/g;

export function normalizeAnswer(str) {
  return String(str ?? '')
    .normalize('NFC')
    .replace(THAI_TONE_MARKS, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}
