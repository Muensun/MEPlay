import { en } from '../i18n/en';

// Registry of games shown on the home page. The shell reads this — nothing
// about a game is hardcoded in components.
export const games = [
  {
    id: 'meword',
    title: 'MEคำให้ทาย', // stays Thai — brand name, do not translate
    description: en.games.meword.description,
    logo: '/games/meword.png',
    background: '/games/BG_MW.png',
    path: '/game/meword',
    available: true,
  },
  // Placeholder cards only — fill out the 3x3 home grid until more games
  // ship. No logo/background asset yet, so Home renders a generic icon
  // in place of a logo for any entry missing one. Remove each entry as
  // its real game replaces it.
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `coming-soon-${i + 1}`,
    title: en.home.comingSoon,
    available: false,
  })),
];

// meword v2: word-grid flow (see meplay-prompt-meword-v2.md), no rounds.
// Every word gets the same 30s clock regardless of star rating; the star
// multiplier is what makes a 5★ worth chasing over a 1★. Tunable after
// the first playtest — that's why these live here, not inline in the
// scoring function.
export const MEWORD_LIMIT_SEC = 30;
export const MEWORD_MIN_BALANCE_SEC = 30;
export const MEWORD_STAR_MULTIPLIER = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.6, 5: 2.0 };

// Answers are typed by tapping letter tiles rather than a keyboard: the
// tile grid always shows every letter actually needed to spell the
// answer, plus this many random decoys from the same alphabet — so a
// longer word gets a bigger (but proportionally no harder) grid rather
// than being crammed into a fixed-size one.
export const MEWORD_LETTER_DECOY_COUNT = 8;
