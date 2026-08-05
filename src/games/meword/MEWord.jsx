import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { games } from '../../config/games';
import { en } from '../../i18n/en';
import { formatMMSS } from '../../lib/time';
import { createInitialRoundState, roundReducer } from './roundEngine';
import { pickRoundQuestions } from './questions';

const config = games.find((g) => g.id === 'meword');
const MIN_BALANCE_TO_START = 60;
const FEEDBACK_PAUSE_MS = 1400;
const t = en.games.meword;

export default function MEWord() {
  const { stats, spendTime, addScore } = useAuth();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('normal');
  const [phase, setPhase] = useState('setup'); // 'setup' | 'playing'
  const [state, dispatch] = useReducer(roundReducer, null);
  const [answer, setAnswer] = useState('');
  const questionStartRef = useRef(performance.now());
  const scoreCommittedRef = useRef(false);

  const balanceSec = stats?.timeSec ?? 0;
  const canStart = balanceSec >= MIN_BALANCE_TO_START;

  // Tick once per second while a round is active or showing feedback:
  // advances the per-question clock and spends real seconds from the
  // shared balance, so the header's live countdown and this round never
  // disagree.
  useEffect(() => {
    if (phase !== 'playing' || !state) return undefined;
    if (state.status !== 'active' && state.status !== 'feedback') return undefined;
    const id = setInterval(() => {
      dispatch({ type: 'TICK' });
      spendTime(1);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state?.status]);

  // Hold on the feedback message just long enough to read it, then move on.
  useEffect(() => {
    if (phase !== 'playing' || state?.status !== 'feedback') return undefined;
    const id = setTimeout(() => dispatch({ type: 'ADVANCE' }), FEEDBACK_PAUSE_MS);
    return () => clearTimeout(id);
  }, [phase, state?.status]);

  // Reset the ms-precision question timer whenever a new question starts.
  useEffect(() => {
    if (phase === 'playing' && state?.status === 'active') {
      questionStartRef.current = performance.now();
      setAnswer('');
    }
  }, [phase, state?.index, state?.status]);

  // Commit the round's score to the account exactly once, when it ends.
  useEffect(() => {
    if (!state) return;
    if ((state.status === 'finished' || state.status === 'outOfTime') && !scoreCommittedRef.current) {
      scoreCommittedRef.current = true;
      addScore(state.scoreTotal);
    }
  }, [state?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  function startRound() {
    const limitSec = config.difficulties[difficulty];
    const roundState = createInitialRoundState({
      questions: pickRoundQuestions(config.questionsPerRound),
      limitSec,
      balanceSec,
    });
    scoreCommittedRef.current = false;
    dispatch({ type: 'RESET', state: roundState });
    setPhase('playing');
  }

  function playAgain() {
    setPhase('setup');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!state || state.status !== 'active' || !answer.trim()) return;
    const elapsedMs = performance.now() - questionStartRef.current;
    dispatch({ type: 'SUBMIT', value: answer, elapsedMs });
  }

  if (phase === 'setup') {
    return (
      <div className="page">
        <button className="btn-ghost" onClick={() => navigate('/')} type="button">
          {t.backToHome}
        </button>
        <h1>{config.title}</h1>
        <p className="muted">{t.description}</p>

        {!canStart ? (
          <div className="result-banner lose">
            <p>
              <strong>{t.lowBalanceTitle}</strong>
            </p>
            <p>{t.lowBalanceMessage}</p>
          </div>
        ) : (
          <>
            <div className="difficulty-picker">
              <p className="avatar-picker-label">{t.difficultyLabel}</p>
              <div className="difficulty-options">
                {Object.keys(config.difficulties).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={difficulty === key ? 'active' : ''}
                    onClick={() => setDifficulty(key)}
                  >
                    {t.difficulty[key]}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary btn-lg" onClick={startRound} type="button">
              {t.startCta}
            </button>
          </>
        )}
      </div>
    );
  }

  if (!state) return null;

  if (state.status === 'finished' || state.status === 'outOfTime') {
    return (
      <div className="page">
        <div className="result-banner win">
          <p>
            <strong>{state.status === 'outOfTime' ? t.roundOutOfTimeTitle : t.roundSummaryTitle}</strong>
          </p>
          {state.status === 'outOfTime' && <p>{t.roundOutOfTimeMessage}</p>}
          <p>{t.roundSummaryScore(state.scoreTotal)}</p>
          <p>{t.roundSummaryCorrect(state.correctCount, state.answeredCount)}</p>
          <div className="sheet-actions" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={playAgain} type="button">
              {t.playAgainCta}
            </button>
            <button className="btn-ghost" onClick={() => navigate('/')} type="button">
              {t.backHomeCta}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = state.questions[state.index];
  const showingFeedback = state.status === 'feedback';
  const feedbackText = showingFeedback
    ? state.lastResult.timedOut
      ? t.timeUpFeedback(state.lastResult.answer)
      : state.lastResult.correct
        ? t.correctFeedback
        : t.wrongFeedback(state.lastResult.answer)
    : null;

  return (
    <div className="page">
      <div className="meword-hud">
        <span>{t.questionOfTotal(state.index + 1, state.questions.length)}</span>
        <span className="time-pill">{formatMMSS(state.limitSec - state.questionElapsedSec)}</span>
      </div>

      <div className="meword-images">
        {question.images.map((img, i) => (
          <span key={i} className="meword-image">
            {img}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="guess-form">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t.answerPlaceholder}
          disabled={showingFeedback}
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={showingFeedback}>
          {t.submitCta}
        </button>
      </form>

      {feedbackText && (
        <p className={state.lastResult.correct ? 'muted correct-text' : 'muted error-text'}>
          {feedbackText}
        </p>
      )}
    </div>
  );
}
