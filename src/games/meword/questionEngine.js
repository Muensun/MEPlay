// Pure single-question state machine for the MEword game v2 — no round, no
// streak, no chaining. A question is a self-contained attempt: pick a
// word from the grid, answer or time out, go back to the grid. No React,
// no timers, so the scoring/timeout edge cases are unit-testable in
// isolation. Question.jsx drives this with useReducer plus a 1s interval.

import { MEWORD_LIMIT_SEC, MEWORD_STAR_MULTIPLIER } from '../../config/games';

export function scoreFor(elapsedSec, stars, alreadySolved) {
  if (alreadySolved) return 0; // practice mode never pays out
  const base =
    elapsedSec <= 5 ? 100 : elapsedSec >= MEWORD_LIMIT_SEC ? 0 : Math.round((100 * (MEWORD_LIMIT_SEC - elapsedSec)) / (MEWORD_LIMIT_SEC - 5));
  const multiplier = MEWORD_STAR_MULTIPLIER[stars] ?? 1;
  return Math.round(base * multiplier);
}

export function createInitialQuestionState({ wordId, stars, alreadySolved, balanceSec }) {
  return {
    status: 'active', // 'active' | 'correct' | 'timedOut'
    wordId,
    stars,
    alreadySolved,
    elapsedSec: 0,
    balanceSec,
    attempts: [], // wrong guesses this visit, for the session record
    score: null,
    timedOutReason: null, // 'limit' | 'balance'
  };
}

export function questionReducer(state, action) {
  if (action.type === 'RESET') return action.state;
  if (!state || state.status !== 'active') return state;

  switch (action.type) {
    case 'TICK': {
      // Balance running out ends the question immediately, even
      // mid-guess — whatever was earned (nothing, since scoring only
      // happens on a correct submit) is committed, not a bonus discarded.
      const balanceSec = Math.max(0, state.balanceSec - 1);
      if (balanceSec <= 0) {
        return { ...state, balanceSec: 0, status: 'timedOut', score: 0, timedOutReason: 'balance' };
      }

      const elapsedSec = state.elapsedSec + 1;
      if (elapsedSec >= MEWORD_LIMIT_SEC) {
        return { ...state, balanceSec, elapsedSec, status: 'timedOut', score: 0, timedOutReason: 'limit' };
      }
      return { ...state, balanceSec, elapsedSec };
    }

    case 'WRONG': {
      // No attempt cap, no penalty beyond the clock still running —
      // stays 'active', just logs the guess for the session record.
      return { ...state, attempts: [...state.attempts, action.value] };
    }

    case 'CORRECT': {
      const score = scoreFor(action.elapsedSec, state.stars, state.alreadySolved);
      return { ...state, status: 'correct', score };
    }

    default:
      return state;
  }
}
