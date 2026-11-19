# #208 Word Groups

The daily sixteen-word grouping puzzle made famous by a newspaper's games section (generic name;
every puzzle is original to this project, in English and in Spanish).

| File                       | Role                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| `puzzles.ts`               | 16 English and 12 Spanish puzzles (four groups, levels 0–3)       |
| `engine.ts`                | Pure rules: select, submit, one away, mistakes, shuffle, share    |
| `ai.ts`, `ai-adapter.ts`   | Meaning clusterer (shared word vectors); `GameEnvironment`        |
| `WordGroupsGame.tsx` + CSS | Menu with every puzzle, grid, coloured bars, controls, end reveal |

## Specification

### Ruleset (`word-groups-4x4`)

- Sixteen words, four hidden groups of four. Select four (at most four selected) and submit.
- A correct group leaves the grid and appears as a bar in its colour — yellow (0), green (1),
  blue (2), purple (3) — with its name.
- A wrong submission costs one of **four mistakes**; "one away" when three of the four share a
  group. Re-submitting a set already tried is refused without penalty.
- Four groups found: won. Four mistakes: lost, and the remaining groups are revealed.
- Shuffle reorders the remaining tiles (seeded, stored in the state). Share grid: one row of
  coloured squares per submission, in submission order.

### Puzzles

Written for this project. Purple groups use wordplay (hidden words, "___ pie", "esconden un
número"…). Several words deliberately fit two groups; each puzzle was checked by hand to have
exactly one valid split, and the test suite checks the structure (four groups of four, sixteen
distinct words, labels).

### Modes

Today's puzzle per language (a fixed shuffled order, one per day from 1 January 2026), any puzzle
from the picker (solved ones green, missed ones red), Watch the AI. Unfinished puzzles resume.

### Save format

`saveSlot` schema 1: `{ state, results: { puzzleId: 'won' | 'lost' } }`.

### AI interface

Config `{ puzzle?, lang? }`; actions `g:A+B+C+D` (four remaining words, sorted, not tried
before). Reward 1 − 0.2 × mistakes on a solve, 0 on a loss. Agents: random and the meaning
clusterer, which submits the four words with the highest average pairwise vector similarity
(the puzzle's language: GloVe vectors for English, fastText vectors for Spanish). It finds about
one group per English puzzle (16 groups over the 16 English puzzles in tests) and about two per
Spanish puzzle (25 over 12; it found none when it read Spanish words with English vectors), and
rarely solves wordplay — a fair picture of plain semantic baselines.

### Tests

`tests/game.test.ts` (puzzle structure, one away, repeats, mistakes, win and loss, share grid,
shuffle, daily, clusterer), `tests/contract.test.ts`, `tests/ui.test.tsx`,
`tests/e2e/games/word-groups.spec.ts`.
