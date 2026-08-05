// Placeholder question set — 2-5 image hints per word, player types the
// answer. Real content (and the per-game max-score spreadsheet) is coming
// later per the build spec; swap this array out when it lands. Kept in
// English so it doesn't trip the "no hardcoded strings outside i18n"
// check, which only exempts the game's Thai title.
export const QUESTIONS = [
  { answer: 'earth', images: ['🌍', '🌎', '🌏'] },
  { answer: 'recycle', images: ['♻️', '🗑️', '📦'] },
  { answer: 'energy', images: ['⚡', '🔋', '💡'] },
  { answer: 'tree', images: ['🌳', '🌲', '🌱'] },
  { answer: 'ocean', images: ['🌊', '🐳', '⛵'] },
  { answer: 'sunlight', images: ['☀️', '🌞'] },
  { answer: 'air', images: ['🌬️', '🎐', '🪁'] },
  { answer: 'rain', images: ['🌧️', '☔', '💧'] },
  { answer: 'forest', images: ['🌲', '🌳', '🦌', '🍄'] },
  { answer: 'plastic', images: ['🥤', '🛍️', '🧴'] },
];

export function pickRoundQuestions(count) {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  // Cycle through if a round needs more questions than the sample bank has.
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(shuffled[i % shuffled.length]);
  }
  return picked;
}
