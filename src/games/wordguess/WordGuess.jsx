import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WORD_LIST } from './words';

const MAX_TRIES = 5;
const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });

function toGraphemes(word) {
  return Array.from(segmenter.segment(word), (s) => s.segment);
}

function pickWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

export default function WordGuess() {
  const { addPoints } = useAuth();
  const navigate = useNavigate();
  const [target, setTarget] = useState(pickWord);
  const [guess, setGuess] = useState('');
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [history, setHistory] = useState([]);

  const revealedHint = useMemo(() => {
    const lettersToShow = MAX_TRIES - triesLeft;
    return toGraphemes(target.word)
      .map((ch, i) => (i < lettersToShow ? ch : '_'))
      .join(' ');
  }, [target, triesLeft]);

  function handleGuess(e) {
    e.preventDefault();
    if (status !== 'playing' || !guess.trim()) return;

    const clean = guess.trim();
    if (clean === target.word) {
      const points = triesLeft * 10;
      addPoints(points);
      setStatus('won');
      setHistory((h) => [...h, { guess: clean, correct: true }]);
    } else {
      const nextTries = triesLeft - 1;
      setHistory((h) => [...h, { guess: clean, correct: false }]);
      setTriesLeft(nextTries);
      if (nextTries <= 0) setStatus('lost');
    }
    setGuess('');
  }

  function playAgain() {
    setTarget(pickWord());
    setGuess('');
    setTriesLeft(MAX_TRIES);
    setStatus('playing');
    setHistory([]);
  }

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate('/')}>
        ← กลับหน้าแรก
      </button>

      <h1>🔤 ทายคำ</h1>
      <p className="muted">คำใบ้: {target.hint}</p>

      <div className="word-display">{revealedHint}</div>
      <p className="muted">เหลือโอกาส {triesLeft} ครั้ง</p>

      {status === 'playing' && (
        <form onSubmit={handleGuess} className="guess-form">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="พิมพ์คำตอบ..."
            autoFocus
          />
          <button type="submit" className="btn-primary">
            ทาย
          </button>
        </form>
      )}

      {status === 'won' && (
        <div className="result-banner win">
          <p>🎉 ถูกต้อง! ได้รับ {triesLeft * 10} แต้ม</p>
          <button className="btn-primary" onClick={playAgain}>
            เล่นอีกครั้ง
          </button>
        </div>
      )}

      {status === 'lost' && (
        <div className="result-banner lose">
          <p>หมดโอกาสแล้ว คำตอบคือ "{target.word}"</p>
          <button className="btn-primary" onClick={playAgain}>
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {history.length > 0 && (
        <ul className="guess-history">
          {history.map((h, i) => (
            <li key={i} className={h.correct ? 'correct' : 'wrong'}>
              {h.guess}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
