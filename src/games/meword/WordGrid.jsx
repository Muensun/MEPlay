import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { en } from '../../i18n/en';
import { MAX_TIME_SEC, formatMMSS, secToNextRefill } from '../../lib/time';
import { MEWORD_MIN_BALANCE_SEC, games } from '../../config/games';
import { WORDS } from './words';
import { seededShuffle } from './gridOrder';
import { progressForUser } from './progress';
import WordCard from './WordCard';

const t = en.games.meword;
const config = games.find((g) => g.id === 'meword');

// Order options for the grid. 'default' is the seeded shuffle (stable
// per player, see gridOrder.js); the rest re-sort that same list rather
// than re-shuffling, so ties keep the shuffled relative order instead of
// e.g. always grouping same-difficulty words alphabetically by id.
const SORT_KEYS = ['default', 'difficulty', 'done', 'syllable'];

function sortEntries(entries, sortBy, byWord) {
  if (sortBy === 'default') return entries;
  const copy = [...entries];
  if (sortBy === 'difficulty') copy.sort((a, b) => a.word.stars - b.word.stars);
  else if (sortBy === 'syllable') copy.sort((a, b) => a.word.syllables - b.word.syllables);
  else if (sortBy === 'done') {
    copy.sort((a, b) => Number(Boolean(byWord[a.word.id]?.solved)) - Number(Boolean(byWord[b.word.id]?.solved)));
  }
  return copy;
}

export default function WordGrid({ onSelectWord }) {
  const { user, stats, sessions } = useAuth();
  const navigate = useNavigate();
  const [, forceTick] = useState(0);
  const [sortBy, setSortBy] = useState('default');

  const balanceSec = stats?.timeSec ?? 0;
  const canStart = balanceSec >= MEWORD_MIN_BALANCE_SEC;

  // Re-render once a second so the refill countdown reads live while gated.
  useEffect(() => {
    if (canStart || !stats || stats.timeSec >= MAX_TIME_SEC) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [canStart, stats]);

  const { byWord, totalEarned } = progressForUser(sessions, user.id, 'meword');
  const solvedCount = Object.values(byWord).filter((w) => w.solved).length;

  // Each card's number badge stays tied to the player's shuffled order
  // regardless of the active sort, so it's a stable reference ("word #5")
  // rather than renumbering every time the sort changes.
  const shuffled = seededShuffle(WORDS, user.id).map((word, i) => ({ word, cardNumber: i + 1 }));
  const ordered = sortEntries(shuffled, sortBy, byWord);

  return (
    <div className="page meword-grid-page">
      <button className="btn-ghost" onClick={() => navigate('/')} type="button">
        {t.backToHome}
      </button>

      <div className="meword-grid-header">
        <h1>{config.title}</h1>
        <div className="meword-grid-summary">
          <span>{t.solvedSummary(solvedCount, WORDS.length)}</span>
          <span className="meword-total-earned">
            <img src="/point.png" alt="" className="score-pill-icon" />
            {totalEarned.toLocaleString()}
          </span>
        </div>
      </div>

      {!canStart && (
        <div className="result-banner lose">
          <p>
            <strong>{t.lowBalanceTitle}</strong>
          </p>
          <p>
            {t.lowBalanceMessage} {t.nextRefillPrefix} {formatMMSS(secToNextRefill(stats, Date.now()))}
          </p>
        </div>
      )}

      <div className="meword-sort-row" role="group" aria-label={t.sortLabel}>
        {SORT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`meword-sort-chip ${sortBy === key ? 'active' : ''}`}
            onClick={() => setSortBy(key)}
          >
            {t.sortOptions[key]}
          </button>
        ))}
      </div>

      <div className="word-grid">
        {ordered.map(({ word, cardNumber }) => {
          const progress = byWord[word.id];
          return (
            <WordCard
              key={word.id}
              index={cardNumber}
              stars={word.stars}
              lang={word.lang}
              syllables={word.syllables}
              solved={Boolean(progress?.solved)}
              bestScore={progress?.bestScore ?? 0}
              disabled={!canStart}
              onClick={() => onSelectWord(word.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
