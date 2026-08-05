# MEPlay — MEทำนายคำ, revised game flow

**This supersedes section 6 of the original build prompt.** The round-based
loop (`questionsPerRound`) is removed entirely — replace it, do not layer on
top of it. Sections 1–5 and 7 of the original still stand.

All UI strings stay English. The game title stays Thai: `MEทำนายคำ`.

---

## 1. Structure

Two screens, ping-ponging:

```
Word grid  ──pick a word──▶  Question  ──answered / timed out──▶  Word grid
```

There is no round, no streak, no "next question" chaining. Every question is
a self-contained attempt the player opts into.

---

## 2. Word grid

A responsive grid of cards, one per word in `data/meword.words.json` where
`status === "ready"`.

**A card shows the star rating and nothing else.** No word, no category, no
image, no thumbnail, no first letter. Anything else on the card leaks the
answer and kills the question before it starts.

```
┌──────────┐
│  ★★★★★   │   ← unsolved
│    #7    │
└──────────┘

┌──────────┐
│  ✓ ✓✓✓✓  │   ← solved: check + best score
│  │ 140   │
└──────────┘
```

- Card order is shuffled with a seed derived from `userId`, so the layout is
  stable for one player but different between players.
- Solved cards stay playable, visually distinct, and are **worth 0 ME** — a
  practice mode. Show `Practice · no points` on the confirm step so nobody
  burns time expecting a payout.
- Show a header summary: `12 / 48 solved` and total ME earned in this game.
- If the time balance is under 30 seconds, cards are not startable. Show the
  refill countdown with a reason, not a dead disabled state.

---

## 3. Question screen

Every word gets **30 seconds, regardless of star rating.** The `timeByStars`
map in the word bank is now unused — delete it rather than leaving it to rot.

On screen:

- The image, as the dominant element
- A category chip (`Environment`, `Social`, …) — capitalise from the slug
- The syllable count, drawn as `syllables` empty slots, e.g. `• • • •`
- A 30-second countdown, visible as both a ring and digits
- A text input with submit

**Answering is unlimited until correct or time out.** No attempt cap, no
penalty for a wrong guess — the only cost is the clock running. On a wrong
answer: shake the input, keep what they typed selected so they can edit
rather than retype, and log the attempt to the session record.

Auto-focus the input on mount, keep the keyboard up between attempts, and
submit on Enter. On mobile, the image must stay visible with the keyboard
open — this is the single easiest way to ruin this screen.

**Answer matching** uses the normaliser already in `build-words.mjs`: NFC
normalise, strip Thai tone marks, strip all whitespace, lowercase. Compare
against every entry in `accept`.

---

## 4. Scoring

Base score decays linearly from full marks in the first 5 seconds to zero at
the limit, then a star multiplier is applied:

```ts
const STAR_MULTIPLIER = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.6, 5: 2.0 };
const LIMIT_SEC = 30;

function scoreFor(elapsedSec, stars, alreadySolved) {
  if (alreadySolved) return 0;                       // practice mode
  const base =
    elapsedSec <= 5 ? 100 :
    elapsedSec >= LIMIT_SEC ? 0 :
    Math.round(100 * (LIMIT_SEC - elapsedSec) / (LIMIT_SEC - 5));
  return Math.round(base * STAR_MULTIPLIER[stars]);
}
```

Wrong-at-timeout scores 0. Put `STAR_MULTIPLIER` and `LIMIT_SEC` in
`src/config/games.ts`, not inline — these are the two numbers that will be
tuned after the first playtest.

The multiplier is what stops the grid from collapsing into "only ever play
1★". Keep the spread; a 5★ solved instantly must beat a 1★ solved instantly
by a wide enough margin to be worth the risk.

**Result card** on both outcomes:

- Correct — the earned score, animated, with the arithmetic shown
  (`92 × 1.6 = 147 ME`). Players need to see why speed paid.
- Timed out — reveal the word, then the `meaning` from the word bank.
  Keep it visually a reward reveal, not a lesson panel — no "Did you know",
  no tips, no encouragement copy.

Both end with a single primary action: `Back to words`.

**Time cost:** deduct the real seconds spent on the question, ticked once per
second, including practice replays. A question abandoned mid-way still costs
the seconds burned. If the balance hits zero, end the question immediately and
commit whatever was earned.

---

## 5. Session record

Per attempt, append to `GameSession`:

```ts
{ wordId, startedAt, elapsedMs, attempts: string[], solved: bool,
  meEarned: int, practiced: bool }
```

`attempts` is the useful one — the wrong guesses tell you which images are
misread, which is what you need to fix the word bank later.

---

## 6. Screenshot protection — what is actually possible

Be direct with the user about this, because most of it is not achievable.

| Platform | Blocking screenshots | Blocking screen recording |
|---|---|---|
| Web (PWA, browser) | **Impossible.** No browser API exists. | Impossible. |
| Android native | Yes — `FLAG_SECURE` on the window | Yes, same flag |
| iOS native | **No.** Can only detect *after* the fact via `userDidTakeScreenshotNotification` | Partly — `UIScreen.isCaptured` lets you blank the view while recording |

So: if MEPlay ships as a web app, screenshots cannot be prevented at all. Any
library claiming otherwise blocks a keyboard shortcut and nothing else — the
OS screenshot path never reaches your code, and a second phone pointed at the
screen defeats every one of them regardless.

**Do these instead, they are cheap and they work:**

1. **Ship hashed answers, not plaintext.** Right now `accept` ships in the
   bundle — anyone can open devtools and read every answer without taking a
   single screenshot. That is the bigger leak. Store
   `answerHashes: sha256(normalize(x))` in the client bundle and compare
   hashes at submit time. Keep the plaintext in the source CSV only. Add this
   step to `build-words.mjs`.
2. **Seeded per-user grid order** (already specced above) — a shared
   screenshot of "card #7" means nothing to another player.
3. **Watermark the question image at runtime** with the player's username at
   low opacity. It does not stop a screenshot; it makes sharing one
   attributable, which is what actually changes behaviour.
4. Accept that a determined player can leak answers, and make it not matter —
   the score is time-based, so a leaked answer list saves seconds, not the
   game.

---

## 7. Acceptance checks

- `scoreFor(5, 5, false)` → 200 · `scoreFor(30, 5, false)` → 0 ·
  `scoreFor(17.5, 1, false)` → 50 · `scoreFor(1, 5, true)` → 0
- A wrong answer neither ends the question nor changes the score curve
- A solved word remains startable and awards 0 while still charging time
- Grid order is stable across reloads for the same user, different across users
- No card in the grid renders the word, image, category, or syllable count
- Thai answer matching accepts input with differing whitespace and tone marks
