import wordbank from './wordbank.json';

// Real content from the design team (mewordlist/meword.words.json at the
// repo root is the drop-in source; this is the copy the app ships).
// Each word carries its own difficulty (`stars`, 1-5) baked in by
// curation — TIME_BY_STARS below is the same mapping the data file
// ships (wordbank.timeByStars), used to give each question its own
// per-question time limit instead of one flat limit for the whole round.
export const TIME_BY_STARS = wordbank.timeByStars;

const READY_WORDS = wordbank.words.filter((w) => w.status === 'ready');

function limitSecForStars(stars) {
  return TIME_BY_STARS[String(stars)] ?? TIME_BY_STARS['3'] ?? 45;
}

function toQuestion(word) {
  return {
    id: word.id,
    answer: word.vocab,
    accept: word.accept?.length ? word.accept : [word.vocab],
    image: `/games/meword/${word.image}`,
    stars: word.stars,
    limitSec: limitSecForStars(word.stars),
  };
}

// Difficulty tiers group words by their curated star rating rather than
// assigning an arbitrary flat timer — Easy skews toward the easier
// (lower-star) words, Hard toward the harder ones. A word's own
// timeByStars limit still applies per-question either way.
export const DIFFICULTY_STAR_RANGES = {
  easy: [1, 2],
  normal: [3],
  hard: [4, 5],
};

export function wordsForDifficulty(difficulty) {
  const [min, max] = (() => {
    const range = DIFFICULTY_STAR_RANGES[difficulty] ?? DIFFICULTY_STAR_RANGES.normal;
    return [range[0], range[range.length - 1]];
  })();
  const matching = READY_WORDS.filter((w) => w.stars >= min && w.stars <= max);
  return (matching.length > 0 ? matching : READY_WORDS).map(toQuestion);
}

export function pickRoundQuestions(count, difficulty) {
  const pool = wordsForDifficulty(difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Cycle through if a round needs more questions than the bank has for
  // this difficulty tier — the content set is still small.
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(shuffled[i % shuffled.length]);
  }
  return picked;
}
