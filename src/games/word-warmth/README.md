# #207 Word Warmth

A daily "hot or cold by meaning" word game in the style of the viral semantic-similarity games
(generic name; original word list, look and texts). Shares the vector model of #206 Word Rank
(`../shared/semantic/`).

| File                       | Role                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| `secrets.ts`               | 292 secret words (nouns, verbs, adjectives)                       |
| `engine.ts`                | Pure rules: similarity scores, nearest-1000 places, daily puzzles |
| `ai.ts`, `ai-adapter.ts`   | Hill-climbing agent; `GameEnvironment`                            |
| `WordWarmthGame.tsx` + CSS | Menu, header, guess table with closeness meter, end screen        |

## Specification

### Ruleset (`word-warmth-30k`)

- Guesses must be words of the 30,000-word vocabulary (plurals fold to singulars; unknown and
  repeated words do not count).
- Each guess shows its **similarity** = cosine of word vectors × 100 (two decimals). If it is
  among the secret's 1,000 nearest words it also shows its place, from 1/1000 (thousandth) to
  1000/1000 (nearest), with a meter; otherwise "(cold)", or "(tepid)" from similarity 20.
- The header gives the similarity of the nearest, tenth-nearest and thousandth-nearest words.
- Finding the word scores 100.00 and "FOUND!". Give up (or 500 guesses) reveals the word and its
  100 nearest words with their similarities.

### Modes

Today's puzzle (one per day, numbered from 1 January 2026, its own shuffle of the list), random
words (`?deal=N`), Watch the AI. Unfinished games resume.

### Simplifications

The original uses a word2vec model; this version uses the shared GloVe-derived vectors (English
only, see #206), so absolute similarity values differ from the original's while the play is the
same.

### Save format

`saveSlot` schema 1: `{ state, daily: { gameNo: guesses (negative if given up) } }`.

### AI interface

Config `{ secret?, limit? }`; actions `g:<word index>` and `give-up`; reward on finding the word
1 / (1 + log10(guesses)). Agents: random, hill climber (guesses the nearest unguessed neighbours of
its warmest guesses); the climber solves most words within 300 guesses in tests.

### Tests

`tests/game.test.ts` (secrets in vocabulary, header ordering, near places, win, daily, climber,
adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/word-warmth.spec.ts`.
