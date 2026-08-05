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
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    chooseAvatarLabel: 'Choose an avatar',
    createAccountCta: 'Create account',
    loginCta: 'Log in',
    creatingAccount: 'Creating account…',
    loggingIn: 'Logging in…',
    switchToLogin: 'Already have an account? Log in',
    switchToSignIn: "Don't have an account? Sign in",
    errors: {
      usernameRequired: 'Enter a username to continue.',
      usernameTaken: 'That username is already taken.',
      avatarRequired: 'Pick an avatar to continue.',
      passwordTooWeak: 'Password must be at least 6 characters.',
      accountNotFound: 'Incorrect username or password.',
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
  },

  games: {
    meword: {
      description: 'Guess the word before the timer runs out',
      backToHome: '← Back to home',
      backToWordsCta: 'Back to words',
      solvedSummary: (solved: number, total: number) => `${solved} / ${total} solved`,
      practiceLabel: 'Practice · no points',
      startCta: 'Start',
      lowBalanceTitle: 'Not enough time',
      lowBalanceMessage: 'You need at least 30 seconds of play time to start a word.',
      nextRefillPrefix: 'Next +1:00 in',
      answerPlaceholder: 'Type your answer',
      submitCta: 'Submit',
      correctFeedback: 'Correct!',
      correctArithmetic: (base: number, multiplier: number, total: number) =>
        `${base} × ${multiplier} = ${total}`,
      timeUpPopupTitle: 'Time up!!',
      practiceResultTitle: 'Practice round',
    },
  },
};
