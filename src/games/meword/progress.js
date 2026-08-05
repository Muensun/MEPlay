// Derives per-word solved/best-score state — and the game's total ME —
// from this user's GameSession history, rather than storing it
// redundantly. A word is "solved" the moment any session for it has
// solved: true; its best score is the max meEarned across those.

export function progressForUser(sessions, userId, gameId) {
  const byWord = {};
  let totalEarned = 0;

  for (const s of sessions) {
    if (s.userId !== userId || s.gameId !== gameId) continue;
    totalEarned += s.meEarned;
    const entry = byWord[s.wordId] ?? { solved: false, bestScore: 0 };
    if (s.solved) {
      entry.solved = true;
      entry.bestScore = Math.max(entry.bestScore, s.meEarned);
    }
    byWord[s.wordId] = entry;
  }

  return { byWord, totalEarned };
}
