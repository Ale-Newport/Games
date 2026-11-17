# #211 Flag Reveal

The daily "flag behind tiles" guessing game in the style of the viral flag guessers (generic name;
own look; flags from the MIT-licensed flag-icons set, flags themselves being public symbols).

| File                       | Role                                                  |
| -------------------------- | ----------------------------------------------------- |
| `engine.ts`                | Pure rules: targets, tiles, guesses, share line       |
| `ai-adapter.ts`            | `GameEnvironment`, triangulator agent                 |
| `FlagRevealGame.tsx` + CSS | Flag with tiles, suggestions, clue rows, end screen   |
| `../shared/world/clues.ts` | Distance/arrow/proximity clues and consistent targets |

## Specification

### Ruleset (`flag-reveal-6`)

- The answer is one of 196 sovereign states; any of the 199 countries can be guessed.
- The flag sits behind six tiles (three columns, two rows). Each wrong guess lifts one tile, in a
  seeded order; the whole flag shows when the round ends.
- Each miss shows the centroid distance, a compass arrow and proximity (as #209).
- Six guesses. Share line: guesses, the six tiles (🟥 lifted before the solve, 🟦 still covered)
  and each guess's arrow and proximity.

### Modes, saves, AI

Today's flag (one a day from 1 January 2026), practice flags (`?deal=N`), Watch the AI; km or
miles. Save `{ state, miles, daily }` (schema 1). Environment config `{ target? }`, actions
`g:<ISO2>`, reward (7 − guesses)/6. Agents: random, triangulator (uses only the distance clues,
never the flag image); it solves at least 26 of 30 seeded games in tests.

### Tests

`tests/game.test.ts` (tiles, win/loss, share, targets, triangulator, adapter contract),
`tests/ui.test.tsx`, `tests/e2e/games/flag-reveal.spec.ts`.
