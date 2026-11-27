# #235 Closest Call

A closest-to-the-value estimation contest (generic name; original design — no public rules for
an estimation game called “Bullseye” could be found, so the game follows the brief: get as close
as possible, with round progression, difficulty, scoring and feedback). It is the head-to-head
member of the estimation family: 2–4 contestants answer in turn, see the answers already given,
and score on a target.

| File                  | Role                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| `engine.ts`           | Pure rules: line-up, rounds, turn order, rings, bonus, settlement, bots      |
| `beliefs.ts`          | What computer contestants believe (family / expert priors, never the answer) |
| `ClosestCallGame.tsx` | Lobby, scoreboard, question, answer box, paced computer turns, reveal, final |
| `Target.tsx`          | The ring target with each contestant's arrow                                 |
| `ai-adapter.ts`       | Multi-player `GameEnvironment` (2–4 seats) and agents                        |

Questions come from the Rough Guess bank (`../rough-guess/engine.ts`: World Bank Pink Sheet
prices, city-pair distances, element properties) and the Order of Magnitude bank (world facts);
see those READMEs for sources and validation.

## Specification

### Ruleset (`closest-call-8`)

- 2–4 contestants (people sharing the device and/or computer players), eight rounds.
- Round difficulty: rounds 1–2 Easy questions, 3–5 Normal, 6–8 Hard; round 8 counts double.
  Kinds rotate; no question repeats in a game.
- Order: contestant `round mod n` answers first, then the others in seat order; every contestant
  sees the answers already given.
- Answers must be positive and on the question's scale.
- Points by the ratio between answer and truth: ≤ ×1.02 → 10, ≤ ×1.05 → 8, ≤ ×1.1 → 6, ≤ ×1.25 →
  4, ≤ ×1.5 → 3, ≤ ×2 → 2, ≤ ×10 → 1, else 0. The closest answer (smallest ratio) earns +3; tied
  closest answers all earn it. Everything × 2 in round 8.
- The highest total wins; equal top totals tie.

### Computer contestants

They never see the answer (`beliefs.ts`):

- **Easy** — draws its answer from a wide normal belief around the family's typical value
  (mean log10 of the same kind of fact, the question's own value excluded; spread × 1.6).
- **Normal** — same family belief; then evaluates candidate answers (a grid over ±3 sd plus a
  step of 0.004 orders either side of every rival answer) by expected points — ring points plus
  the +3 bonus when strictly closest — integrated over its belief, against the answers already
  given; each candidate is scored as it will actually be answered (4 significant figures), so a
  later contestant flanks an earlier answer rather than tying it.
- **Hard** — an expert belief from related facts: the same commodity's price in the
  neighbouring years (y ± 1…3, never y), the neighbouring elements (Z ± 1, ± 2) for element
  properties, otherwise the family; then the Normal strategy.

Measured (`npm run evaluate -- closest-call <a> <b> 60 7`, two contestants): Hard beat Normal
48–6 (6 ties), Normal beat Easy 48–9 (3), Easy beat Random 42–17 (1). Three-way games (40, seeded):
mean points Hard 41.6, Normal 29.1, Easy 16.7.

### Modes and interface

Daily (you against Ada, Bruno and Chiara, all Normal; the same eight questions for everyone) and
custom line-ups (2–4 rows: Person/Computer, name, level). Scoreboard with seat colours (the
platform's player tokens, colorblind-safe), the question card, the answers given in turn order,
the answer box (value with units at 4 significant figures, ÷/×1.5 buttons, log slider, type-in
field with validation), a “thinking…” pause for computer turns (0.9 s, 0.25 s with reduced
motion), then the answer, the target with arrows (right half = overshoot, left = undershoot,
distance = ring) and the points; the final standings. Keys: ← → ×1.05 (Shift ×1.5), Enter.

### Saves, statistics, achievements

One slot with the game in progress (resumable mid-round), the last line-up, daily scores and a
record (games, wins, bullseyes, average points). Results: `win`/`loss`/`draw` with one person
(mode `daily` or `vs:<levels>`), `complete` for local games. Achievements: Bullseye (≤ ×1.02),
Champion, Expert Slayer (beat a Hard contestant), Full House (outright win against three
computers), Sharpshooter (60 points), Regular Contestant (7-day streak).

### AI interface

Seats 2–4 (`{ players }`, default 2). Action k answers 10^(scale start + 0.02 k). Observation per
seat: the question (key, kind, subject, year, scale), the answers given this round, the scores,
the seat — never the truth. Returns +1 / 0 / −1 (sole winner / shared top / other), points in
`scores`. Agents: Random, Easy, Normal, Hard contestants.

### Tests

`tests/engine.test.ts` (rings, bonus and ties, double round, turn rotation, full games and
standings, illegal answers, daily line-up, beliefs from related facts only, flanking instead of
tying, level ordering in duels, multi-player adapter contract); `tests/ui.test.tsx` (full daily
against three computers with fake timers; two people taking turns, invalid input, resume);
`tests/e2e/games/closest-call.spec.ts` (desktop + Pixel 7).
