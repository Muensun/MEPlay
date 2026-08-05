// Single source of truth for every user-facing string in the app.
// Components must import from here rather than hardcoding text in JSX,
// so a Thai locale (or any other) can be added later without touching
// component code — just add a matching th.ts with the same shape.
//
// Exception: the first game's title stays in Thai as a brand name.
// It lives in src/config/games.ts, not here.

export const en = {
  common: {
    appName: 'MEPlay',
    loading: 'Loading…',
    cancel: 'Cancel',
    retry: 'Try again',
    genericError: 'Something went wrong. Please try again.',
  },

  splash: {
    credit: 'Created by',
  },

  header: {
    homeLink: 'Home',
    leaderboardLink: 'Leaderboard',
    scoreUnit: 'ME',
    signInCta: 'Sign in / Log in',
    signOutMenuItem: 'Sign out',
    timeDepletedLabel: 'Out of time',
    nextRefillPrefix: 'Next +1:00 in',
  },

  signOutSheet: {
    title: 'Sign out of MEPlay?',
    confirm: 'Sign out',
    cancel: 'Cancel',
  },

  auth: {
    signInTab: 'Sign in',
    loginTab: 'Login',
    signInHeading: 'Create your account',
    loginHeading: 'Welcome back',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Pick a username',
    chooseAvatarLabel: 'Choose an avatar',
    createAccountCta: 'Create account',
    loginCta: 'Log in',
    creatingAccount: 'Creating account…',
    loggingIn: 'Logging in…',
    noAccountsYet: 'No accounts on this device yet.',
    createInsteadCta: 'Create a new account',
    existingAccountsHeading: 'Your accounts on this device',
    switchToLogin: 'Already have an account? Log in',
    switchToSignIn: "Don't have an account? Sign in",
    errors: {
      usernameRequired: 'Enter a username to continue.',
      usernameTaken: 'That username is already taken.',
      avatarRequired: 'Pick an avatar to continue.',
      accountNotFound: "We couldn't find that account on this device.",
    },
  },

  home: {
    heroWordmarkAlt: 'MEPlay',
    heroCtaSignedOut: 'Create an account to start playing',
    gamesHeading: 'Games',
    playCta: 'Play',
    signInToPlayCta: 'Sign in to play',
    comingSoon: 'Coming soon',
    moreGamesComingSoon: 'New games coming soon',
  },

  leaderboard: {
    title: 'Leaderboard',
    subtitle: 'Top players on this device (local demo — not yet synced globally)',
    empty: 'No players yet. Create an account and start playing to get on the board!',
    rankHeader: 'Rank',
    playerHeader: 'Player',
    scoreHeader: 'ME',
  },

  games: {
    meword: {
      description: 'Guess the word before the timer runs out',
      backToHome: '← Back to home',
      difficultyLabel: 'Difficulty',
      difficulty: {
        easy: 'Easy',
        normal: 'Normal',
        hard: 'Hard',
      },
      startCta: 'Start round',
      lowBalanceTitle: 'Not enough time',
      lowBalanceMessage:
        'You need at least 1 minute of play time to start a round. Come back after your next refill.',
      questionOfTotal: (i: number, total: number) => `Question ${i} of ${total}`,
      answerPlaceholder: 'Type your answer',
      submitCta: 'Submit',
      correctFeedback: 'Correct!',
      wrongFeedback: (answer: string) => `Not quite — it was "${answer}"`,
      timeUpFeedback: (answer: string) => `Time's up — it was "${answer}"`,
      roundSummaryTitle: 'Round complete',
      roundOutOfTimeTitle: 'Out of time',
      roundOutOfTimeMessage: 'Your round ended early, but the score you earned is saved.',
      roundSummaryScore: (score: number) => `You earned ${score} ME`,
      roundSummaryCorrect: (correct: number, total: number) => `${correct} / ${total} correct`,
      playAgainCta: 'Play again',
      backHomeCta: 'Back to home',
    },
  },
};
