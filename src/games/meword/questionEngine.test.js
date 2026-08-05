import { describe, expect, it } from 'vitest';
import { createInitialQuestionState, questionReducer, scoreFor } from './questionEngine';

describe('scoreFor', () => {
  it('full marks in the first 5s times the 5★ multiplier', () => {
    expect(scoreFor(5, 5, false)).toBe(200);
  });

  it('is zero at the 30s limit regardless of star rating', () => {
    expect(scoreFor(30, 5, false)).toBe(0);
  });

  it('decays linearly then applies the 1★ multiplier', () => {
    expect(scoreFor(17.5, 1, false)).toBe(50);
  });

  it('always scores zero for an already-solved (practice) word', () => {
    expect(scoreFor(1, 5, true)).toBe(0);
  });
});

describe('questionReducer', () => {
  it('does not end the question or change the score curve on a wrong answer', () => {
    let state = createInitialQuestionState({
      wordId: 'MW0001',
      stars: 3,
      alreadySolved: false,
      balanceSec: 600,
    });

    state = questionReducer(state, { type: 'WRONG', value: 'nope' });
    expect(state.status).toBe('active');
    state = questionReducer(state, { type: 'TICK' }); // 1s elapsed
    state = questionReducer(state, { type: 'WRONG', value: 'still nope' });
    expect(state.status).toBe('active');
    expect(state.attempts).toEqual(['nope', 'still nope']);

    // Score only reflects total elapsed time at the moment of the correct
    // answer — the two wrong guesses cost nothing beyond the second that
    // had already ticked by.
    state = questionReducer(state, { type: 'CORRECT', elapsedSec: 1 });
    expect(state.status).toBe('correct');
    expect(state.score).toBe(140); // <=5s still full marks (100) * 1.4 for 3★
  });

  it('keeps a solved word startable, awards 0, and still charges time', () => {
    let state = createInitialQuestionState({
      wordId: 'MW0007',
      stars: 1,
      alreadySolved: true,
      balanceSec: 10,
    });
    state = questionReducer(state, { type: 'TICK' });
    expect(state.balanceSec).toBe(9); // still charged
    state = questionReducer(state, { type: 'CORRECT', elapsedSec: 1 });
    expect(state.score).toBe(0);
    expect(state.status).toBe('correct');
  });

  it('times out at the 30s per-question limit and reveals nothing extra', () => {
    let state = createInitialQuestionState({
      wordId: 'MW0001',
      stars: 2,
      alreadySolved: false,
      balanceSec: 600,
    });
    for (let i = 0; i < 30; i++) {
      state = questionReducer(state, { type: 'TICK' });
    }
    expect(state.status).toBe('timedOut');
    expect(state.timedOutReason).toBe('limit');
    expect(state.score).toBe(0);
  });

  it('ends the question immediately when the balance runs out mid-guess', () => {
    let state = createInitialQuestionState({
      wordId: 'MW0001',
      stars: 4,
      alreadySolved: false,
      balanceSec: 3,
    });
    state = questionReducer(state, { type: 'TICK' });
    state = questionReducer(state, { type: 'TICK' });
    expect(state.status).toBe('active');
    state = questionReducer(state, { type: 'TICK' });
    expect(state.status).toBe('timedOut');
    expect(state.timedOutReason).toBe('balance');
    expect(state.balanceSec).toBe(0);
  });

  it('ignores actions once the question is resolved', () => {
    let state = createInitialQuestionState({
      wordId: 'MW0001',
      stars: 1,
      alreadySolved: false,
      balanceSec: 600,
    });
    state = questionReducer(state, { type: 'CORRECT', elapsedSec: 1 });
    expect(state.status).toBe('correct');
    const after = questionReducer(state, { type: 'TICK' });
    expect(after).toBe(state);
  });
});
