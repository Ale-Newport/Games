# #202 Crowd Answer Climb

The mirror of #201 Rare Answer Dive, in the style of the viral "say what the crowd says" climbing
games (generic name; original prompts, answer sheets, art and sound): the most popular answers lift
your balloon highest. Built on the shared survey module (`../shared/survey/`); see the #201 README
for the files, matching rules and how the answer sheets were banded.

| File                                    | Role                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| `Game.tsx`, `rules.ts`, `rules-meta.ts` | Climb polarity and achievements                               |
| `ai-adapter.ts`                         | `AiBundle` (`crowd-answer-climb`, ruleset `crowd-climb-7x25`) |
| `HowToPlay.tsx`, `manifest.ts`          | Rules dialog, metadata                                        |

## Specification

### Ruleset (`crowd-climb-7x25`)

- Seven open prompts; 3-second preview and **25 seconds** each.
- **Three tries** per prompt: an off-sheet answer uses a try; the third miss or a timeout scores 0.
- Bands score the reverse of the dive: Crowd Favourite 100 · Second Nature 85 · Popular Pick 60 ·
  Niche 30 · Rare Air 15 · Lone Star 10. Maximum 700 points; each point is **1 km** of altitude.
- Matching is identical to #201 (case, accents, articles, plurals and small typos forgiven).

### Modes

Today's climb (same prompts for everyone on a date, separate from the dive's daily set; one try a
day, daily streak), Unlimited (`?deal=N`), Party (2–6 players, hidden hand-overs) and Watch the AI.

### Presentation

Sky gauge on a square-root altitude scale (mountains, stars, rising balloon) with real landmarks:
Everest 8.8 km, airliner cruise 11 km, stratosphere 12 km, ozone layer 25 km, highest skydive 39 km,
mesosphere 50 km, thermosphere 85 km, Kármán line 100 km, space-station orbit about 400 km,
space-telescope orbit about 540 km, low Earth orbit 700 km. Whoosh on an answer, buzz on a miss,
countdown ticks, end fanfare, spoiler-free share line and the full answer sheets.

### Save format, AI interface and tests

As #201 (schema 1, `{ run, names, daily, lastDaily }`). Agents: random, first thought (scores best
here), casual and trivia buff. Tests: `tests/game.test.ts` (achievements, first-thought average
above 550 points, adapter contract), `tests/ui.test.tsx` (three tries, daily climb recorded,
menu shows today's score), `tests/e2e/games/crowd-answer-climb.spec.ts`.
