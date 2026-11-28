# #238 Clue Ladder

A push-your-luck estimation game (generic name; original design inspired by the brief's
“Tenfold” entry — a number guessed through progressively more helpful clues, each one costing
points). It reuses the real question bank of #233 Order of Magnitude and #234 Rough Guess, and is
distinct from them: #233 scores a single power of ten, #234 a range, #235 a contest; here the
player trades points for information, rung by rung.

| File             | Role                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| `engine.ts`      | Pure rules: clues, feedback bands, accuracy, rungs, sessions, validation |
| `LadderGame.tsx` | Menu, record, play (ladder, guess box, keep/climb), reveal, results      |
| `ai-adapter.ts`  | `GameEnvironment` and agents (random, always climb, clue reasoner)       |
| `i18n.ts`        | Strings (questions and units shared with Rough Guess)                    |

## Specification

### Questions

The merged #233 + #234 bank (keys `p:` commodity prices, `d:` city distances, `e:` element
properties, `m:` world facts) with the same difficulty pools, topics, log scales and sources (World
Bank Pink Sheet CC BY 4.0, Wikidata CC0). Nothing new is downloaded.

### Ruleset (`clue-ladder-5`)

Each question is a ladder of five rungs; rung r's clue is shown once the player climbs to it:

| Rung | Clue                                                                                    | Value |
| ---- | --------------------------------------------------------------------------------------- | ----- |
| 1    | The question (subject, quantity, unit, year)                                            | ×1    |
| 2    | Two facts of the same family: one 2–8× smaller, one 2–8× larger (1.3–30× if none)       | ×0.75 |
| 3    | Number of digits of the integer part (or “less than 1”)                                 | ×0.55 |
| 4    | First significant digit                                                                 | ×0.40 |
| 5    | A window [lo, 1.3·lo] holding the answer at a seeded point 15–85 % along it (log scale) | ×0.25 |

Families: the same commodity in other years, distances from the first city to other big cities,
the same property of other elements, the same #233 kind. Clue choices come from the round's
`clueSeed`, so they are reproducible and survive a reload.

- On every rung the player makes one guess on the question's scale and gets feedback: direction
  (higher / lower) and band by ratio — exact ≤ 1.02, hot ≤ 1.1, warm ≤ 1.25, near ≤ 1.5, far ≤ 3,
  way off beyond.
- Then **keep** (score it) or **climb** (next rung, guess again). An exact guess, or any guess on
  rung 5, is kept at once.
- Accuracy = 100 within 2 %, else round(100 · e^(−1.5·|ln(guess/answer)|)); points =
  round(accuracy × rung value / 100), so at most 100 per question.

### Modes, interface, controls

Daily (five Normal questions seeded by date, 500 max, share line with a coloured square and the
kept rung per question) and Endless (difficulty × topic, the last 2,500 questions avoided, End
run at any time). The ladder lists all five rungs: open ones show their clue and the feedback
chip of the guess made there, locked ones a padlock. Guess with the slider, − / + (×1.5) or a
typed number (`1.2e6`, locale separators; off-scale values are rejected with a message).
Keyboard: ← → ×1.05 (Shift ×1.5), Enter guesses; then K keeps and C climbs (focus moves to the
Keep button after a guess and back to the guess box after a climb).

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-ladder), daily totals, seen questions, difficulty,
topic and the record (questions, average, kept on rung 1, daily streak). Achievements: First
Step, No Clues Needed (≥ 85 kept on rung 1), All the Way Up (≥ 25 on rung 5), Confident (20
rung-1 keeps), Daily Climber (7-day streak).

### AI interface

When a guess is due, action k guesses 10^(scale start + 0.02·k); after a guess the legal actions
are KEEP (100000) and CLIMB (100001). The observation holds the question (key, kind, subject,
scale), the rung, the clues revealed so far and earlier guesses with their feedback — never the
answer. Agents: Random; Always climb (guesses the middle of the feasible range, climbs to rung 5);
Clue reasoner (intersects every clue and feedback band into a feasible range, opens at the
family's typical value, keeps when the band's expected accuracy × the rung's value beats the
measured accuracy of the next rung × its value). `npm run evaluate -- clue-ladder <a> <a> 200 7`,
mean total out of 500: Random 60.9, Always climb 218.2, **Clue reasoner 263.7**.

### Tests

`tests/engine.test.ts`: every clue true of its answer over 1,500 random questions (bracket sides,
digit count, leading digit, window ×1.3 with the answer 15–85 % along), deterministic seeded
clues, same-family facts, feedback bands, accuracy and kept points, keep / climb / auto-keep on
rung 5 and on exact guesses, off-scale guesses, the daily (deterministic, five distinct questions,
share line), validation and finishing, the feasible range always holds the answer, agent
ordering, adapter contract. `tests/ui.test.tsx`: the daily played with climbs and keeps;
typed and rejected guesses, resume mid-ladder after a reload, End run.
`tests/e2e/games/clue-ladder.spec.ts`: a full daily with slider guesses, climbs and keeps
(desktop + mobile), and keyboard play with resume.

### Simplifications

None known. The bracket clue may show a single fact when the answer is the largest or smallest of
its family (e.g. the tallest building), or “no related fact” when the family is too small.
