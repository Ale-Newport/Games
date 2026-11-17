# #215 Code Words

The team word-association party game (generic name; original word list drawn from this project's
own noun lists; original look), played with bots that understand meaning through word vectors.

| File                      | Role                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `engine.ts`               | Pure rules: board, key, clues and their validity, guesses, turns, win |
| `bots.ts`                 | Vector spymaster (safe-margin clue search) and vector operative       |
| `ai-adapter.ts`           | Red-operative environment; agents                                     |
| `CodeWordsGame.tsx` + CSS | Menu (role, rival skill), board, key, clue form, log, result          |

## Specification

### Ruleset (`code-words-5x5`)

- 25 words from a pool of 340+ (the project's concrete nouns and drawable subjects). The starting
  team (random) has 9 agents, the other 8; 7 bystanders and 1 assassin.
- A turn: the spymaster gives one word (letters only, a known English word, not a board word nor
  part of one, nor containing one) and a number 1–9. Operatives touch up to number + 1 words:
  their own agent continues the turn, a bystander or rival agent ends it, the assassin loses the
  game. After one right touch they may end the turn. All agents found: that team wins.

### Bots

- **Spymaster:** scans the most frequent words of the 30,000-word vocabulary (3,000 / 8,000 /
  15,000 by skill) and, for each candidate, counts how many of its team's words are closer to it
  than every word to avoid (the assassin weighted heavier) by a margin (0.10 / 0.06 / 0.04), up to
  2 / 3 / 4 words. It gives the candidate that links the most words most safely.
- **Operative:** touches the unrevealed word most similar to the clue; after the first touch it
  continues only while similarity stays above its caution, taking the +1 bonus only when sure.
- In tests, bot teams finish every game with more than 55% of touches on their own agents.

### Modes and saves

You are red: operative (bot spymaster) or spymaster (bot operative) against a bot blue team of
three skills, or watch two bot teams. Save `{ role, skill, state }` (schema 1) resumes a game.
**Simplification:** words and clues are English for everyone, since the bots' meaning model is
English-only; there is no human-vs-human pass-and-play (the spymaster's key must stay secret).

### AI interface

The agent is the red operative (config `{ skill? }` for blue): actions `g:<index>` and `pass`;
reward 1 for a red win. Agents: random and the vector operative, which wins more games than random
in tests.

### Tests

`tests/game.test.ts` (deal, clue validity, guess limits, turn ends, assassin, bot games),
`tests/contract.test.ts` (vector vs random, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/code-words.spec.ts`.
