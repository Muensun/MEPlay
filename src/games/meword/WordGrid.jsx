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

export default function WordGrid({ onSelectWord }) {
  const { user, stats, sessions } = useAuth();
  const navigate = useNavigate();
  const [, forceTick] = useState(0);

  const balanceSec = stats?.timeSec ?? 0;
  const canStart = balanceSec >= MEWORD_MIN_BALANCE_SEC;

  // Re-render once a second so the refill countdown reads live while gated.
  useEffect(() => {
    if (canStart || !stats || stats.timeSec >= MAX_TIME_SEC) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [canStart, stats]);

  const ordered = seededShuffle(WORDS, user.id);
  const { byWord, totalEarned } = progressForUser(sessions, user.id, 'meword');
  const solvedCount = Object.values(byWord).filter((w) => w.solved).length;

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate('/')} type="button">
        {t.backToHome}
      </button>

      <div className="meword-grid-header">
        <h1>{config.title}</h1>
        <div className="meword-grid-summary">
          <span>{t.solvedSummary(solvedCount, WORDS.length)}</span>
          <span>{t.totalEarnedLabel(totalEarned)}</span>
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

      <div className="word-grid">
        {ordered.map((word) => {
          const progress = byWord[word.id];
          return (
            <WordCard
              key={word.id}
              stars={word.stars}
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
