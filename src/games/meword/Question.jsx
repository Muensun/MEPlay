import { useEffect, useReducer, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { en } from '../../i18n/en';
import { MEWORD_LIMIT_SEC, MEWORD_STAR_MULTIPLIER } from '../../config/games';
import { createInitialQuestionState, questionReducer } from './questionEngine';
import { normalizeAnswer } from './normalize';
import { sha256Hex } from './hash';
import { buildLetterTiles } from './letterTiles';

const t = en.games.meword;
const BG_COUNT = 4; // bg1.png .. bg4.png

function capitalize(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function CountdownRing({ remainingSec, limitSec }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, remainingSec / limitSec);
  return (
    <div className="meword-timer">
      <svg viewBox="0 0 60 60" width="60" height="60">
        <circle cx="30" cy="30" r={radius} className="meword-timer-track" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="meword-timer-progress"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <span className="meword-timer-digits">{Math.max(0, remainingSec)}</span>
    </div>
  );
}

export default function Question({ word, alreadySolved, onBack }) {
  const { stats, spendTime, addScore, recordSession } = useAuth();
  const [state, dispatch] = useReducer(questionReducer, null);
  // Picked once per question attempt — Question remounts fresh every time
  // a card is selected, so both naturally re-randomise per question.
  const [bgImage] = useState(() => `/games/meword/bg${1 + Math.floor(Math.random() * BG_COUNT)}.png`);
  const [tileData] = useState(() => buildLetterTiles(word.answer, word.lang));
  const [selected, setSelected] = useState([]); // ordered tile picks: { id, char }[]
  const [shaking, setShaking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const questionStartRef = useRef(performance.now());
  const settledRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    dispatch({
      type: 'RESET',
      state: createInitialQuestionState({
        wordId: word.id,
        stars: word.stars,
        alreadySolved,
        balanceSec: stats?.timeSec ?? 0,
      }),
    });
    questionStartRef.current = performance.now();
    startedAtRef.current = Date.now();
    settledRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  // Re-triggerable shake: clear the class shortly after so the next
  // wrong answer restarts the animation instead of no-op'ing on an
  // already-applied class.
  useEffect(() => {
    if (!shaking) return undefined;
    const id = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(id);
  }, [shaking]);

  // One tick per second while guessing: advances the 30s question clock
  // and spends real seconds from the shared balance.
  useEffect(() => {
    if (!state || state.status !== 'active') return undefined;
    const id = setInterval(() => {
      dispatch({ type: 'TICK' });
      spendTime(1);
    }, 1000);
    return () => clearInterval(id);
    // Deliberately keyed on status only — including `state` would tear
    // down and restart the interval every tick instead of once per phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status, spendTime]);

  // Commit the session record exactly once, when the question resolves.
  useEffect(() => {
    if (!state || settledRef.current) return;
    if (state.status !== 'correct' && state.status !== 'timedOut') return;
    settledRef.current = true;
    addScore(state.score);
    recordSession('meword', {
      wordId: word.id,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      elapsedMs: performance.now() - questionStartRef.current,
      attempts: state.attempts,
      solved: state.status === 'correct',
      meEarned: state.score,
      practiced: alreadySolved,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status]);

  // Auto-verifies once the player has filled every slot — there's no
  // separate submit step with tiles. Reruns on selection changes only,
  // gated so a resolved question (correct/timedOut arriving mid-check)
  // doesn't apply a stale result.
  useEffect(() => {
    if (!state || state.status !== 'active') return undefined;
    if (selected.length !== tileData.requiredLength) return undefined;
    let cancelled = false;

    (async () => {
      setVerifying(true);
      const normalized = normalizeAnswer(selected.map((tile) => tile.char).join(''));
      const hash = await sha256Hex(normalized);
      if (cancelled) return;
      setVerifying(false);
      if (!state || state.status !== 'active') return; // resolved while hashing (e.g. timeout)

      if (word.answerHashes.includes(hash)) {
        const elapsedSec = (performance.now() - questionStartRef.current) / 1000;
        dispatch({ type: 'CORRECT', elapsedSec });
      } else {
        dispatch({ type: 'WRONG', value: normalized });
        setShaking(true);
        setSelected([]);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, state?.status]);

  const usedTileIds = new Set(selected.map((tile) => tile.id));

  function pickTile(tile) {
    if (!state || state.status !== 'active' || verifying) return;
    if (usedTileIds.has(tile.id) || selected.length >= tileData.requiredLength) return;
    setSelected((prev) => [...prev, tile]);
  }

  function backspace() {
    if (verifying) return;
    setSelected((prev) => prev.slice(0, -1));
  }

  if (!state) return null;

  if (state.status === 'correct') {
    const base = !alreadySolved ? state.score / (MEWORD_STAR_MULTIPLIER[word.stars] ?? 1) : 0;
    return (
      <div className="page">
        <div className="result-banner win">
          <p>
            <strong>{alreadySolved ? t.practiceResultTitle : t.correctFeedback}</strong>
          </p>
          {!alreadySolved && (
            <p>{t.correctArithmetic(Math.round(base), MEWORD_STAR_MULTIPLIER[word.stars] ?? 1, state.score)}</p>
          )}
          <button className="btn-primary" onClick={onBack} type="button">
            {t.backToWordsCta}
          </button>
        </div>
      </div>
    );
  }

  const timedOut = state.status === 'timedOut';
  const remainingSec = MEWORD_LIMIT_SEC - state.elapsedSec;

  return (
    <div className="page meword-question-page" style={{ '--meword-bg': `url(${bgImage})` }}>
      <button className="btn-ghost" onClick={onBack} type="button">
        {t.backToWordsCta}
      </button>

      <div className="meword-question-hud">
        <div className="meword-chips">
          {word.category.map((c) => (
            <span key={c} className="meword-chip">
              {capitalize(c)}
            </span>
          ))}
        </div>
        <CountdownRing remainingSec={remainingSec} limitSec={MEWORD_LIMIT_SEC} />
      </div>

      <div className="meword-images">
        <img src={word.image} alt="" className="meword-image-photo" />
      </div>

      <div className="meword-syllables" aria-label={`${word.syllables} syllables`}>
        {Array.from({ length: word.syllables }, (_, i) => (
          <span key={i} className="meword-syllable-dot">
            •
          </span>
        ))}
      </div>

      <div className="meword-answer-lang">
        <img src={`/games/meword/${word.lang === 'th' ? 'th' : 'eng'}.png`} alt="" />
        <span>
          {t.answerInLabel} {t.answerLanguage[word.lang === 'th' ? 'th' : 'en']}
        </span>
      </div>

      <div className={`meword-tiles-wrap ${shaking ? 'shake' : ''}`}>
        <div className="meword-slots" aria-label={t.tilesInstructionLabel}>
          {Array.from({ length: tileData.requiredLength }, (_, i) => (
            <span key={i} className={`meword-slot ${selected[i] ? 'filled' : ''}`}>
              {selected[i]?.char ?? ''}
            </span>
          ))}
        </div>

        <div className="meword-tile-grid">
          {tileData.tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className="meword-tile"
              disabled={usedTileIds.has(tile.id) || timedOut || verifying}
              onClick={() => pickTile(tile)}
            >
              {tile.char}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-ghost meword-backspace"
          onClick={backspace}
          disabled={selected.length === 0 || timedOut || verifying}
        >
          {t.backspaceLabel}
        </button>
      </div>

      {timedOut && (
        <div className="sheet-backdrop" onClick={onBack}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className="sheet-title meword-timeup-title">{t.timeUpPopupTitle}</p>
            <div className="sheet-actions">
              <button className="btn-primary" onClick={onBack} type="button">
                {t.backToWordsCta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
