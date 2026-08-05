import { describe, expect, it } from 'vitest';
import { createInitialRoundState, roundReducer, scoreFor } from './roundEngine';

describe('scoreFor', () => {
  it('is full marks inside the first 5 seconds', () => {
    expect(scoreFor(5, 45)).toBe(100);
  });

  it('is zero at or past the time limit', () => {
    expect(scoreFor(45, 45)).toBe(0);
  });

  it('decays linearly between 5s and the limit', () => {
    expect(scoreFor(25, 45)).toBe(50);
  });
});

function makeQuestions(n) {
  return Array.from({ length: n }, (_, i) => ({ answer: `word${i}`, images: ['🌍'] }));
}

describe('roundReducer', () => {
  it('commits the score earned so far when balance hits zero mid-question', () => {
    let state = createInitialRoundState({
      questions: makeQuestions(3),
      limitSec: 45,
      balanceSec: 2,
    });

    state = roundReducer(state, { type: 'SUBMIT', value: 'word0', elapsedMs: 1000 });
    expect(state.scoreTotal).toBe(100);
    expect(state.status).toBe('feedback');

    // One TICK left before the balance runs out (balance still drains
    // during the feedback pause too).
    state = roundReducer(state, { type: 'TICK' });
    expect(state.status).toBe('feedback');
    expect(state.balanceSec).toBe(1);

    state = roundReducer(state, { type: 'TICK' });
    expect(state.status).toBe('outOfTime');
    expect(state.balanceSec).toBe(0);
    // Score earned before the round ended is preserved, not discarded.
    expect(state.scoreTotal).toBe(100);
    expect(state.answeredCount).toBe(1);
  });

  it('scores a wrong answer as zero, holds for feedback, then advances', () => {
    let state = createInitialRoundState({
      questions: makeQuestions(2),
      limitSec: 45,
      balanceSec: 600,
    });
    state = roundReducer(state, { type: 'SUBMIT', value: 'nope', elapsedMs: 1000 });
    expect(state.scoreTotal).toBe(0);
    expect(state.correctCount).toBe(0);
    expect(state.status).toBe('feedback');
    expect(state.lastResult).toEqual({
      correct: false,
      answer: 'word0',
      scoreEarned: 0,
      timedOut: false,
    });
    expect(state.index).toBe(0); // doesn't move until ADVANCE

    state = roundReducer(state, { type: 'ADVANCE' });
    expect(state.status).toBe('active');
    expect(state.index).toBe(1);
  });

  it('times out a question at the per-question limit, holds for feedback, then advances', () => {
    let state = createInitialRoundState({
      questions: makeQuestions(2),
      limitSec: 3,
      balanceSec: 600,
    });
    state = roundReducer(state, { type: 'TICK' }); // 1s
    state = roundReducer(state, { type: 'TICK' }); // 2s
    expect(state.status).toBe('active');
    state = roundReducer(state, { type: 'TICK' }); // 3s -> timeout
    expect(state.status).toBe('feedback');
    expect(state.lastResult.timedOut).toBe(true);
    expect(state.scoreTotal).toBe(0);
    expect(state.answeredCount).toBe(1);

    state = roundReducer(state, { type: 'ADVANCE' });
    expect(state.status).toBe('active');
    expect(state.index).toBe(1);
  });

  it('finishes the round after feedback on the last question advances', () => {
    let state = createInitialRoundState({
      questions: makeQuestions(1),
      limitSec: 45,
      balanceSec: 600,
    });
    state = roundReducer(state, { type: 'SUBMIT', value: 'word0', elapsedMs: 1000 });
    expect(state.status).toBe('feedback');
    state = roundReducer(state, { type: 'ADVANCE' });
    expect(state.status).toBe('finished');
  });

  it('ignores SUBMIT/ADVANCE once the round is no longer active', () => {
    let state = createInitialRoundState({
      questions: makeQuestions(1),
      limitSec: 45,
      balanceSec: 600,
    });
    state = roundReducer(state, { type: 'SUBMIT', value: 'word0', elapsedMs: 1000 });
    state = roundReducer(state, { type: 'ADVANCE' });
    expect(state.status).toBe('finished');

    const afterSubmit = roundReducer(state, { type: 'SUBMIT', value: 'word0', elapsedMs: 1000 });
    expect(afterSubmit).toBe(state);
    const afterAdvance = roundReducer(state, { type: 'ADVANCE' });
    expect(afterAdvance).toBe(state);
    const afterTick = roundReducer(state, { type: 'TICK' });
    expect(afterTick).toBe(state);
  });
});
