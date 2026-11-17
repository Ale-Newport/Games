# #210 Theme Strands

The daily themed word search with a "spangram", in the style of the newspaper puzzle (generic
name; original themes, generated grids, own look).

| File                        | Role                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `tools/generate-strands.ts` | Offline grid generator (themes, word pools, path covering)          |
| `puzzles.ts`                | 12 English and 8 Spanish generated puzzles (generated file)         |
| `engine.ts`                 | Pure rules: traces, answers, hint words, hints, share line          |
| `dictionary.ts`             | Words that count toward hints (English and Spanish)                 |
| `ai.ts`, `ai-adapter.ts`    | Trie-guided path search; `GameEnvironment`; word-finder agent       |
| `StrandsGame.tsx` + CSS     | Theme card, SVG grid with strands, drag/tap/keyboard tracing, hints |

## Specification

### Ruleset (`strands-6x8`)

- A 6×8 grid. Answers are the theme words plus the spangram; together they cover every cell
  exactly once. The spangram touches two opposite sides (left–right or top–bottom).
- A trace joins adjacent free cells (eight directions, no cell twice). An answer counts only along
  its own cells; found answers stay drawn (blue, spangram yellow).
- Any other dictionary word of four or more letters adds one to the hint meter (once per word).
  Three earn a hint: it outlines the next unfound theme word; a second hint on the outlined word
  numbers its letters in order.
- Share line: 🔵 per theme word, 🟡 for the spangram, 💡 per hint, in the order found.

### Puzzles

Themes, clues and word pools are original. `tools/generate-strands.ts` picks words whose lengths
fill the 48 cells with the spangram, draws the spangram between opposite sides, then covers the
rest with the words as non-crossing paths (randomised depth-first search with a connectivity
check, seeded). Tests check full coverage, spelling, adjacency and the spangram's span.

### Dictionaries

English: the shared 30,000-word vocabulary and the 12,600 five-letter words of #120 (Webster's
Second, public domain). Spanish: the project's Spanish word data (five-letter words, survey and
category answers). **Simplification:** the Spanish list is smaller, so fewer Spanish non-theme
words count toward hints.

### Modes, saves, AI

Today's puzzle per language, the puzzle picker, Watch the AI. Save: `{ state, results }`
(schema 1). Environment config `{ puzzle?, lang? }`; actions `p:<cells>` (any path spelling a
dictionary word or an answer) and `hint`; reward 1 − 0.1 per hint. Agents: random and the word
finder (trie-guided search, longest words first, hints when ready), which completes all 20 puzzles
in tests.

### Tests

`tests/game.test.ts` (grid coverage and spans, answers, hint words, outline and spell hints,
share line, word finder on every puzzle, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/theme-strands.spec.ts`.
