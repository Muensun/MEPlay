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

function makeQuestions(n, limitSec = 45) {
  return Array.from({ length: n }, (_, i) => ({
    answer: `word${i}`,
    accept: [`word${i}`],
    image: '/games/meword/x.png',
    limitSec,
  }));
}

describe('roundReducer', () => {
  it('commits the score earned so far when balance hits zero mid-question', () => {
    let state = createInitialRoundState({ questions: makeQuestions(3), balanceSec: 2 });

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
    let state = createInitialRoundState({ questions: makeQuestions(2), balanceSec: 600 });
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

  it('accepts any answer in the accept[] list, case-insensitively', () => {
    const questions = [{ answer: 'Wind Turbine', accept: ['Wind Turbine'], limitSec: 45 }];
    let state = createInitialRoundState({ questions, balanceSec: 600 });
    state = roundReducer(state, { type: 'SUBMIT', value: 'wind turbine', elapsedMs: 1000 });
    expect(state.correctCount).toBe(1);
    expect(state.scoreTotal).toBe(100);
  });

  it('times out a question at its own per-question limit, holds for feedback, then advances', () => {
    let state = createInitialRoundState({ questions: makeQuestions(2, 3), balanceSec: 600 });
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

  it('gives each question its own time limit', () => {
    const questions = [
      { answer: 'a', accept: ['a'], limitSec: 2 },
      { answer: 'b', accept: ['b'], limitSec: 5 },
    ];
    let state = createInitialRoundState({ questions, balanceSec: 600 });
    state = roundReducer(state, { type: 'TICK' }); // 1s of Q1 (limit 2)
    state = roundReducer(state, { type: 'TICK' }); // 2s -> Q1 times out
    expect(state.status).toBe('feedback');
    state = roundReducer(state, { type: 'ADVANCE' });
    expect(state.index).toBe(1);

    // Q2 has a 5s limit — 2 ticks should not time it out.
    state = roundReducer(state, { type: 'TICK' });
    state = roundReducer(state, { type: 'TICK' });
    expect(state.status).toBe('active');
  });

  it('finishes the round after feedback on the last question advances', () => {
    let state = createInitialRoundState({ questions: makeQuestions(1), balanceSec: 600 });
    state = roundReducer(state, { type: 'SUBMIT', value: 'word0', elapsedMs: 1000 });
    expect(state.status).toBe('feedback');
    state = roundReducer(state, { type: 'ADVANCE' });
    expect(state.status).toBe('finished');
  });

  it('ignores SUBMIT/ADVANCE once the round is no longer active', () => {
    let state = createInitialRoundState({ questions: makeQuestions(1), balanceSec: 600 });
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
