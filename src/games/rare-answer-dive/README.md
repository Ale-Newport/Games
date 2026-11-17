# #201 Rare Answer Dive

A daily trivia dive in the style of the viral rare-answer games (generic name; original prompts,
answer sheets, art and sound): name the answer nobody else would and sink toward the trench floor.
Built on the shared survey module (`../shared/survey/`), which it shares with #202 Crowd Answer
Climb.

| File                                    | Role                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `../shared/survey/sheets.ts`            | 40 bilingual answer sheets in six popularity bands, with prize facts    |
| `../shared/survey/engine.ts`            | Pure rules: matching, scoring, daily/unlimited/party runs, validation   |
| `../shared/survey/environment.ts`       | `GameEnvironment` factory and knowledge-based agents                    |
| `../shared/survey/SurveyGame.tsx`       | Menu, clock, answer box, reveal, party hand-overs, end screen and share |
| `../shared/survey/Scene.tsx`            | The ocean gauge with real depth landmarks                               |
| `Game.tsx`, `rules.ts`, `rules-meta.ts` | Dive polarity and achievements                                          |
| `ai-adapter.ts`                         | `AiBundle` (`rare-answer-dive`, ruleset `rare-dive-7x25`)               |
| `HowToPlay.tsx`, `manifest.ts`          | Rules dialog, metadata                                                  |

## Specification

### Ruleset (`rare-dive-7x25`)

- A run is **seven open prompts** ("Name a bird"). Each is shown for a **3-second preview**, then
  the player has **25 seconds** to type one answer.
- The **first accepted answer** locks the prompt. An answer that is not on the prompt's answer
  sheet is rejected ("no echo") and the player may try again while time remains. A timeout scores 0.
- Each accepted answer scores by its **band**: Bait Ball 10 · Decoy 15 · Shoal 30 · Reef Find 60 ·
  Deep Find 85 · Abyssal Pearl 100. Maximum 700 points; each point is **10 m** of depth (7,000 m).
- **Matching** (`normalize`, `matchAnswer`): case, accents, leading articles (en/es), plurals,
  punctuation and spacing are ignored. Exact aliases in the run's language, then exact names in the
  other language, then a unique closest name within a typo tolerance (1 edit from 5 letters, 2 from
  9; adjacent swaps count as one edit). Ambiguous typos are rejected.

### Answer sheets — how popularity was set

The original games rank answers by what their players type. This project is a static site with no
server, so no crowd data exists. Each of the 40 sheets lists 40–90 accepted answers placed by hand
into six bands by general familiarity: `a` the first answers most people give, `b` the answers
that feel original but are common second choices, `c` solid popular answers, `d` uncommon, `e` very
rare, `f` one to three hand-picked prize answers with a fact. **Simplification (documented):** off-
sheet answers cannot be judged by a referee, so they are rejected rather than awarded a rare band,
and the end screen shows bands, not live percentages of players.

### Modes

- **Today's dive**: the same seven prompts for everyone on a date (per answer language). The bank is
  shuffled once per cycle and each day takes the next seven, so prompts never repeat within a cycle.
  One attempt per day; finishing builds a daily streak.
- **Unlimited**: seven random prompts (`?deal=N` fixes them, so friends can share a set).
- **Party**: 2–6 players on one device take turns on each prompt, behind a hand-over screen that
  hides the previous answer; ranking at the end.
- **Watch the AI**: the trivia-buff agent plays a run.

### Presentation

Ocean gauge on a square-root depth scale (surface boat, sinking diver with bubbles and lamp,
trench walls) with real landmarks: recreational limit 40 m, twilight zone 200 m, deepest scuba dive
332 m, midnight zone 1,000 m, sperm-whale hunting depth 2,250 m, Titanic wreck 3,800 m, abyssal
zone 4,000 m, hadal zone 6,000 m. Timer bar that turns red in the last five seconds with ticks;
shake and buzz on a miss; sonar ping on an answer and a chime for prize answers. End screen: depth,
spoiler-free share line (one colored square per prompt, ⬛ for a timeout), every prompt with the
player's answer and the full answer sheet by band. Reduced motion stops the animations.

### Save format

`saveSlot` schema 1: `{ run, names, daily: { "YYYYMMDD:lang": score }, lastDaily }`, validated by
`isValidSurveyState`. An unfinished run resumes from the menu.

### AI interface

Single-player environment; config `{ lang?, day? }`. Actions `e:<index>` (an answer on the current
sheet) or `timeout`. Reward: score / 700 at the end. Agents: random, first thought (the most
familiar answer it knows), casual and trivia buff (each "knows" an answer with a probability that
falls with rarity, then plays the best-scoring known answer).

### Tests

`../shared/survey/tests/engine.test.ts` (sheet integrity: both languages, all bands, no key
claimed by two answers, every name matches itself; normalization; typos; daily cycles; scoring;
misses; party; validation), `tests/game.test.ts` (achievements, agent ordering, adapter contract),
`tests/ui.test.tsx` (full dive with a miss, a typo, a timeout and review; two-player party; watch
mode), `tests/e2e/games/rare-answer-dive.spec.ts`.
