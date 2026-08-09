import { en } from '../../i18n/en';

const MAX_STARS = 5;

function Stars({ count }) {
  return (
    <span className="word-card-stars" aria-label={`${count} star difficulty`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <img
          key={i}
          src="/games/meword/star.png"
          alt=""
          className={i < count ? 'star filled' : 'star'}
        />
      ))}
    </span>
  );
}

// Deliberately narrow props — a card must be structurally incapable of
// rendering the word, image, category, or meaning, since any of those
// would leak the answer before the question even starts. Star rating,
// language, and syllable count are metadata about the word rather than
// the word itself, so those are fine to show — they help a player pick
// which card to play next. Only the item number, star rating (unsolved)
// or a checkmark + best score (solved) shows beyond that.
export default function WordCard({ index, stars, lang, syllables, solved, bestScore, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`word-card ${solved ? 'solved' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="word-card-index">{index}</span>
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
      <span className="word-card-meta">
        <img
          src={`/games/meword/${lang === 'th' ? 'th' : 'eng'}.png`}
          alt=""
          className="word-card-lang"
        />
        <span className="word-card-syllables" aria-label={`${syllables} syllables`}>
          {Array.from({ length: syllables }, (_, i) => (
            <span key={i} className="word-card-syllable-dot" />
          ))}
        </span>
      </span>
      {solved && <span className="word-card-practice">{en.games.meword.practiceLabel}</span>}
    </button>
  );
}
