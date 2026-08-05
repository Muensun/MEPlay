# MEPlay — Build Prompt

Paste into Claude Code from the project root.

---

## Context

MEPlay is a casual mobile-first game app. Multiple mini-games live in one shell. This task adds the account header, the time-point economy, a modern auth flow, and the first game.

**Language rule: every user-facing string in the app is English by default.** The only exception is the first game's title, which stays in Thai as a brand name (see below). Put all strings in a single `src/i18n/en.ts` so a Thai locale can be added later without touching components. Do not hardcode strings in JSX.

---

## 1. Assets

These files exist in the repo — inspect each one before using it, and place it according to what it actually is (icon vs. full mockup).

| File | Use |
|---|---|
| `point.png` | ME score icon, shown next to the score number |
| `signin.png` | Sign-in screen reference |
| `login.png` | Login screen reference |
| `logout.png` | Logout / sign-out reference |
| `meword.png` | Logo for game 1, shown on the game card |

If `signin.png` / `login.png` / `logout.png` turn out to be design mockups rather than icons, treat them as the visual target and rebuild them as components — do not embed the raster image as the UI.

---

## 2. Data model

```ts
User        { id, username, avatarId, createdAt }
UserStats   { userId, meScore: int, timeSec: int, lastAccrualAt: number }  // epoch ms
GameSession { id, userId, gameId, startedAt, endedAt,
              meEarned: int, secondsSpent: int, answered: int, correct: int }
```

`meScore` is cumulative and never decreases. `timeSec` is the spendable balance, stored in **seconds** as an integer — never as a formatted string.

---

## 3. Time-point economy

The single currency required to play any game.

```ts
const MAX_TIME_SEC       = 600;            // 10 minutes, hard ceiling
const REGEN_AMOUNT_SEC   = 60;             // +1 minute
const REGEN_INTERVAL_MS  = 15 * 60 * 1000; // per 15 real minutes
```

Rules:

- New accounts start at `MAX_TIME_SEC`.
- Balance regenerates whether or not the app is open — so it must be **derived from timestamps, never from a running interval timer.**
- Balance is capped at `MAX_TIME_SEC`. Time does not accrue while the balance is full.
- Playing spends time equal to **real seconds elapsed during play**, ticked down once per second while a round is active.

Accrual function — call on app load, on window focus, every 30s while idle, and after every round:

```ts
function accrue(stats, now) {
  if (stats.timeSec >= MAX_TIME_SEC) {
    return { ...stats, lastAccrualAt: now };   // full: reset the clock, bank nothing
  }
  const intervals = Math.floor((now - stats.lastAccrualAt) / REGEN_INTERVAL_MS);
  if (intervals <= 0) return stats;

  const timeSec = Math.min(MAX_TIME_SEC, stats.timeSec + intervals * REGEN_AMOUNT_SEC);
  const lastAccrualAt = timeSec >= MAX_TIME_SEC
    ? now
    : stats.lastAccrualAt + intervals * REGEN_INTERVAL_MS;  // keep the remainder

  return { ...stats, timeSec, lastAccrualAt };
}
```

Two details that are easy to get wrong and must be implemented as written:

1. When not capping out, advance `lastAccrualAt` by whole intervals only. Resetting it to `now` silently throws away partial progress and players will notice the drift.
2. While the balance is full, `lastAccrualAt` tracks `now`, so a player who returns after two days does not receive a flood of banked time.

Show a live countdown to the next `+1:00` in the header when the balance is below max.

---

## 4. Header (visible on every screen once logged in)

Left to right: avatar, username, ME score, time balance.

- ME score: `point.png` icon + number + unit label `ME` → e.g. `1,240 ME`
- Time balance: clock icon + `mm:ss`, counting down live during a round
- When time reaches `0:00`, style the time chip as depleted and show the countdown to the next refill

The header must reflect score changes immediately at the end of a round — animate the count up rather than snapping.

---

## 5. Auth flow

Rebuild sign-in / login / logout to a modern standard, using the reference images as the visual target.

- Logout must not be a bare link. Use an avatar menu in the header → confirmation sheet → return to the signed-out state.
- Confirmation copy: `Sign out of MEPlay?` / `Sign out` / `Cancel`.
- On sign-out, clear session state but preserve local `meScore` and `timeSec` for the account.
- Include loading and error states on every auth action. No dead buttons.
- Avatar selection happens at account creation, from `public/avatars/a01.svg … aNN.svg` — enumerate the directory rather than hardcoding a list.

---

## 6. Game 1 — MEคำให้ทาย

Register it in `src/config/games.ts`:

```ts
{
  id: "meword",
  title: "MEคำให้ทาย",        // stays Thai — brand name, do not translate
  description: "Guess the word before the timer runs out",
  logo: "/games/meword.png",
  maxScorePerQuestion: 100,
  questionsPerRound: 10,
  difficulties: { easy: 60, normal: 45, hard: 30 }  // seconds per question
}
```

This config file is the place where per-game max scores from the upcoming spreadsheet will be added. Keep it declarative — the game shell reads it, nothing is hardcoded in components.

**Loop:** each question shows 2–5 images. The player types the answer before the per-question timer expires. A round is `questionsPerRound` questions long.

**Scoring** — full marks inside the first 5 seconds, then linear decay to zero at the time limit:

```ts
function scoreFor(elapsedSec, limitSec) {
  if (elapsedSec <= 5) return 100;
  if (elapsedSec >= limitSec) return 0;
  return Math.round(100 * (limitSec - elapsedSec) / (limitSec - 5));
}
```

Wrong answer or timeout scores 0. Measure elapsed time in milliseconds and convert only at scoring, so the on-screen number does not jitter.

**Cost:** deduct real seconds spent, ticked once per second. A player who answers in 4 seconds pays 4 seconds.

**Running out mid-round:** the round ends immediately at `0:00`. Score earned so far is kept and committed. Show a summary with what was earned, then the countdown to the next refill. Do not silently discard the round.

**Entry guard:** block starting a round below 60 seconds of balance, with an explanatory message rather than a disabled button with no reason given.

---

## 7. Acceptance checks

Write tests for these before considering the task done:

- `accrue` with a full balance and a 3-day gap → balance stays 600, no banked overflow
- `accrue` at 120s with a 47-minute gap → 300s, and `lastAccrualAt` advanced by exactly 45 minutes
- `scoreFor(5, 45)` → 100 · `scoreFor(45, 45)` → 0 · `scoreFor(25, 45)` → 50
- A round that hits zero time mid-question commits the score earned so far
- No user-facing string appears outside `src/i18n/en.ts` (except the Thai game title)

---

## 8. Assumptions — flag if wrong

- A round is 10 questions; configurable per game
- Time is charged per real second of play, not per question started
- Balances persist locally for now; server-side validation comes later
