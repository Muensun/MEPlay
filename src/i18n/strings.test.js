import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Enforces the build spec's language rule: every user-facing string in the
// app is English by default, defined in src/i18n/en.ts, except the first
// game's title which stays Thai as a brand name (src/config/games.ts).
// Thai script (U+0E00-U+0E7F) anywhere outside that one exempted file
// means a string was hardcoded instead of routed through i18n.

const THAI_RANGE = /[฀-๿]/;
const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXEMPT = [path.join(SRC_DIR, 'config', 'games.ts')];
const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function collectFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return collectFiles(full);
    if (!SCAN_EXTENSIONS.has(path.extname(name))) return [];
    return [full];
  });
}

describe('i18n hygiene', () => {
  it('has no Thai text outside the exempted game-title config', () => {
    const offenders = collectFiles(SRC_DIR)
      .filter((f) => !f.endsWith('.test.js') && !f.endsWith('.test.ts'))
      .filter((f) => !EXEMPT.includes(f))
      .filter((f) => THAI_RANGE.test(readFileSync(f, 'utf8')));

    expect(offenders.map((f) => path.relative(SRC_DIR, f))).toEqual([]);
  });

  it('keeps the one exempted Thai game title in src/config/games.ts', () => {
    const content = readFileSync(EXEMPT[0], 'utf8');
    expect(THAI_RANGE.test(content)).toBe(true);
  });
});
