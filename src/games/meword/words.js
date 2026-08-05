import wordbank from './wordbank.json';

// build-words.mjs already filtered to status === "ready" and replaced
// plaintext accept[] with answerHashes — this is exactly what ships to
// the client, nothing further to strip here.
export const WORDS = wordbank.words;
