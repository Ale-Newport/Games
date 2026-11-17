# #209 Country Shape

The daily "name the country from its outline" game made popular by the viral geography guessers
(generic name; original look, real public-domain shapes). Built on the shared world module.

| File                               | Role                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `engine.ts`                        | Pure rules: targets, guesses, clues, bonus rounds, share  |
| `ai.ts`, `ai-adapter.ts`           | Triangulating agent; `GameEnvironment`                    |
| `CountryShapeGame.tsx` + CSS       | Menu, silhouette, suggestions, clue rows, bonus questions |
| `../shared/world/Silhouette.tsx`   | Outline drawn with an azimuthal projection centred on it  |
| `../shared/world/CountryInput.tsx` | Country box with keyboard-friendly suggestions            |
| `../shared/world/geo-facts.ts`     | Precomputed centroids and border distances (generated)    |

## Specification

### Ruleset (`country-shape-6`)

- Targets: countries of 1,000 km² or more (183); any of the 199 shapes can be guessed.
- Six guesses. A miss shows the great-circle distance between the centroids of the two countries'
  largest landmasses, a compass arrow (eight directions) towards the target, and proximity =
  ⌊(1 − distance / 20,000 km) × 100⌋ %.
- After the round (won or lost): the capital (four options) and the flag (four flags); decoys are
  drawn from the target's eight nearest countries.
- Share line: guesses used, best proximity, one row per guess of five proximity squares plus the
  arrow, and a star per bonus answer.

### Modes and saves

Today's shape (one a day, numbered from 1 January 2026), practice shapes (`?deal=N`), Watch the
AI; km or miles. `saveSlot` schema 1: `{ state, miles, daily: { gameNo: guesses (0 = missed) } }`.

### AI interface

Config `{ target? }`; actions `g:<ISO2>`; reward (7 − guesses) / 6 for a solve. Agents: random, and
the triangulator — it keeps only targets consistent with every distance and arrow shown (reading
only the clues, not the shape) and guesses the candidate that best splits the rest. It solves at
least 36 of 40 seeded games in tests.

### Tests

`tests/game.test.ts` (clues, win/loss, bonus, share line, targets, triangulator),
`tests/contract.test.ts`, `tests/ui.test.tsx`, `tests/e2e/games/country-shape.spec.ts`; shared
geography tests in `../shared/world/tests/`.
