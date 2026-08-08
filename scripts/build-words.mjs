#!/usr/bin/env node
// Builds src/games/meword/wordbank.json (shipped in the client bundle)
// from mewordlist/meword.words.json (the source drop from the design
// team). The only transform that matters for security: `accept` (plain
// text answers) never reaches the client — only `answerHashes`
// (sha256 of the normalised answer) does. Keep the plaintext in the
// source JSON/CSV only; re-run this after every content update.
//
//   node scripts/build-words.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAnswer } from '../src/games/meword/normalize.js';
import { sha256Hex } from '../src/games/meword/hash.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'mewordlist', 'meword.words.json');
const OUT = path.join(ROOT, 'src', 'games', 'meword', 'wordbank.json');

const raw = JSON.parse(await readFile(SOURCE, 'utf8'));
const readyRows = raw.words.filter((w) => w.status === 'ready');

// This file gets regenerated from scratch on every run — old words don't
// need special handling, they just need to still be in the source with
// the SAME id they always had (that id is what ties a word to a
// player's saved progress/session history in Firestore). The one thing
// that actually breaks silently is a duplicate or missing id — easy to
// introduce by copy-pasting a row in the sheet — so fail loudly instead
// of shipping a wordbank where two words share progress or a grid card
// has no key.
const seenIds = new Map(); // id -> vocab, just to make the error message useful
for (const w of readyRows) {
  if (!w.id) {
    throw new Error(`A "ready" row is missing an id (vocab: "${w.vocab ?? '(no vocab either)'}"). Every word needs a unique id.`);
  }
  if (seenIds.has(w.id)) {
    throw new Error(
      `Duplicate id "${w.id}" used by both "${seenIds.get(w.id)}" and "${w.vocab}". Give the new word its own id — ` +
        `reusing one would merge their player progress and confuse the grid.`
    );
  }
  seenIds.set(w.id, w.vocab);
}

const words = await Promise.all(
  readyRows.map(async (w) => {
      const accept = w.accept?.length ? w.accept : [w.vocab];
      const answerHashes = await Promise.all(accept.map((a) => sha256Hex(normalizeAnswer(a))));
      return {
        id: w.id,
        answer: w.vocab, // plaintext kept only for the post-timeout reveal card
        lang: w.lang, // 'en' | 'th' — tells the player which language to type in
        category: w.category ?? [],
        syllables: w.syllables,
        stars: w.stars,
        meaning: w.meaning,
        image: `/games/meword/${w.image}`,
        answerHashes,
      };
    })
);

const out = { gameId: raw.gameId, version: raw.version, words };
await writeFile(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${words.length} words to ${path.relative(ROOT, OUT)}`);
