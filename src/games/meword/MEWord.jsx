import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { en } from '../../i18n/en';
import { WORDS } from './words';
import { progressForUser } from './progress';
import WordGrid from './WordGrid';
import Question from './Question';
import PillButton from '../../components/PillButton';

const t = en.games.meword;

export default function MEWord() {
  const { user, sessions } = useAuth();
  const [view, setView] = useState({ screen: 'grid' }); // 'grid' | 'confirmPractice' | 'question'

  const { byWord } = progressForUser(sessions, user.id, 'meword');

  function handleSelectWord(wordId) {
    const alreadySolved = Boolean(byWord[wordId]?.solved);
    if (alreadySolved) {
      setView({ screen: 'confirmPractice', wordId });
    } else {
      setView({ screen: 'question', wordId, alreadySolved: false });
    }
  }

  function backToGrid() {
    setView({ screen: 'grid' });
  }

  if (view.screen === 'question') {
    const word = WORDS.find((w) => w.id === view.wordId);
    return <Question word={word} alreadySolved={view.alreadySolved} onBack={backToGrid} />;
  }

  return (
    <>
      <WordGrid onSelectWord={handleSelectWord} />
      {view.screen === 'confirmPractice' && (
        <div className="sheet-backdrop" onClick={backToGrid}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className="sheet-title">{t.practiceLabel}</p>
            <div className="sheet-actions">
              <PillButton
                variant="signin"
                onClick={() => setView({ screen: 'question', wordId: view.wordId, alreadySolved: true })}
              >
                {t.startCta}
              </PillButton>
              <button className="btn-ghost" onClick={backToGrid} type="button">
                {en.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
