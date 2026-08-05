// Pure round-state machine for the MEword game — no React, no timers, so
// the tricky bits (mid-round timeout, score decay) are unit-testable in
// isolation. MEWord.jsx drives this with useReducer plus a 1s interval.
//
// A question goes active -> feedback -> (ADVANCE) -> active/finished. The
// pause in 'feedback' is what gives the player a moment to actually read
// "correct" / "it was X" before the next question replaces it on screen —
// without it, a synchronous advance-on-submit wipes the message the same
// render it appears in.
//
// Each question carries its own `limitSec` (derived from the word's
// curated star rating — see questions.js) rather than the round using one
// flat limit for every question.

export function scoreFor(elapsedSec, limitSec) {
  if (elapsedSec <= 5) return 100;
  if (elapsedSec >= limitSec) return 0;
  return Math.round((100 * (limitSec - elapsedSec)) / (limitSec - 5));
}

function normalize(str) {
  return String(str ?? '').trim().toLowerCase();
}

function isCorrectAnswer(value, question) {
  const accepted = question.accept?.length ? question.accept : [question.answer];
  const given = normalize(value);
  return accepted.some((a) => normalize(a) === given);
}

export function createInitialRoundState({ questions, balanceSec }) {
  return {
    status: 'active', // 'active' | 'feedback' | 'finished' | 'outOfTime'
    questions,
    index: 0,
    scoreTotal: 0,
    correctCount: 0,
    answeredCount: 0,
    balanceSec,
    questionElapsedSec: 0,
    lastResult: null, // set on SUBMIT/timeout, read by the UI during 'feedback'
  };
}

export function roundReducer(state, action) {
  if (action.type === 'RESET') return action.state;
  if (!state) return state;

  switch (action.type) {
    case 'TICK': {
      if (state.status !== 'active' && state.status !== 'feedback') return state;

      const balanceSec = Math.max(0, state.balanceSec - 1);
      if (balanceSec <= 0) {
        // Balance hit zero — round ends immediately, even mid-question or
        // mid-feedback. scoreTotal/correctCount/answeredCount are left
        // untouched: the score earned so far is committed, not discarded.
        return { ...state, balanceSec: 0, status: 'outOfTime' };
      }

      if (state.status === 'feedback') {
        return { ...state, balanceSec };
      }

      const question = state.questions[state.index];
      const questionElapsedSec = state.questionElapsedSec + 1;
      if (questionElapsedSec >= question.limitSec) {
        return {
          ...state,
          balanceSec,
          answeredCount: state.answeredCount + 1,
          status: 'feedback',
          lastResult: { correct: false, answer: question.answer, scoreEarned: 0, timedOut: true },
        };
      }
      return { ...state, balanceSec, questionElapsedSec };
    }

    case 'SUBMIT': {
      if (state.status !== 'active') return state;
      const question = state.questions[state.index];
      const correct = isCorrectAnswer(action.value, question);
      const elapsedSec = action.elapsedMs / 1000;
      const scoreEarned = correct ? scoreFor(elapsedSec, question.limitSec) : 0;
      return {
        ...state,
        scoreTotal: state.scoreTotal + scoreEarned,
        correctCount: state.correctCount + (correct ? 1 : 0),
        answeredCount: state.answeredCount + 1,
        status: 'feedback',
        lastResult: { correct, answer: question.answer, scoreEarned, timedOut: false },
      };
    }

    case 'ADVANCE': {
      if (state.status !== 'feedback') return state;
      const isLast = state.index + 1 >= state.questions.length;
      return {
        ...state,
        status: isLast ? 'finished' : 'active',
        index: isLast ? state.index : state.index + 1,
        questionElapsedSec: 0,
      };
    }

    default:
      return state;
  }
}
