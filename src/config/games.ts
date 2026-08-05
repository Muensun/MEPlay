import { en } from '../i18n/en';

// Registry of games shown on the home page. The shell reads this — nothing
// about a game is hardcoded in components. Per-game max scores from the
// upcoming spreadsheet get added here.
//
// meword's per-question time limit comes from each word's own curated
// star rating (see src/games/meword/questions.js + wordbank.json), not a
// flat seconds-per-question value — questionsPerRound and
// maxScorePerQuestion still apply round-wide.
export const games = [
  {
    id: 'meword',
    title: 'MEทำนายคำ', // stays Thai — brand name, do not translate
    description: en.games.meword.description,
    logo: '/games/meword.png',
    path: '/game/meword',
    maxScorePerQuestion: 100,
    questionsPerRound: 10,
    available: true,
  },
];
