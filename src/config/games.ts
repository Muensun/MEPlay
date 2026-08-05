import { en } from '../i18n/en';

// Registry of games shown on the home page. The shell reads this — nothing
// about a game is hardcoded in components. Per-game max scores from the
// upcoming spreadsheet get added here.
export const games = [
  {
    id: 'meword',
    title: 'MEทำนายคำ', // stays Thai — brand name, do not translate
    description: en.games.meword.description,
    logo: '/games/meword.png',
    path: '/game/meword',
    maxScorePerQuestion: 100,
    questionsPerRound: 10,
    difficulties: { easy: 60, normal: 45, hard: 30 }, // seconds per question
    available: true,
  },
];
