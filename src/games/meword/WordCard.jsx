import { en } from '../../i18n/en';

const MAX_STARS = 5;

function Stars({ count }) {
  return (
    <span className="word-card-stars" aria-label={`${count} star difficulty`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span key={i} className={i < count ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

// Deliberately narrow props — a card must be structurally incapable of
// rendering the word, image, category, or syllable count, since any of
// those would leak the answer before the question even starts. Only the
// star rating (unsolved) or a checkmark + best score (solved) shows.
export default function WordCard({ stars, solved, bestScore, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`word-card ${solved ? 'solved' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {solved ? (
        <>
          <span className="word-card-check" aria-hidden="true">
            ✓
          </span>
          <span className="word-card-score">{bestScore.toLocaleString()}</span>
        </>
      ) : (
        <Stars count={stars} />
      )}
      {solved && <span className="word-card-practice">{en.games.meword.practiceLabel}</span>}
    </button>
  );
}
