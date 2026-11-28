# #246 Equation Guess

An arithmetic deduction puzzle (generic name; original design and presentation; the brief's
“Nerdle” entry asks for a guess-the-equation game with positional feedback). The answer is a true
equation such as `82−57=25`; every guess must itself be a true equation, and each symbol comes back
green (right place), yellow (in the equation elsewhere) or grey (not there, or not that many
times). The catalog's other daily deduction game, Word Guess (#120), guesses words; this one
guesses arithmetic, so the constraint that every guess is true is what makes it a puzzle.

| File                          | Role                                                             |
| ----------------------------- | ---------------------------------------------------------------- |
| `engine.ts`                   | Pure rules: validity, marks, keypad states, sessions, share text |
| `equations.json`              | The answer pools (generated, see below)                          |
| `EquationGame.tsx`            | Menu, record, board, keypad, reveal, results                     |
| `ai-adapter.ts`               | `GameEnvironment` and agents (random, consistent, solver)        |
| `tools/generate-equations.ts` | Enumerates every valid equation and filters the trivial ones     |

## Specification

### Equations

Symbols `0–9 + − × ÷ =` (stored as `* /` internally). An equation is valid when it has exactly one
`=`; the left side is numbers joined by operators (no leading zeros, no unary signs, no two
operators in a row, at least one operator); the right side is one non-negative whole number without
leading zeros; × and ÷ bind tighter than + and −, left to right, evaluated in exact fractions (so
`7÷2×4=14` is true and `7÷2=3` is false); division by zero is invalid. Guesses are checked by the
engine; a refused guess names the reason (length, symbols, “=”, form, division by zero, not true,
already tried).

**Answer pools** (`npx tsx tools/generate-equations.ts`): every valid equation of 6 and of 8
characters, enumerated exhaustively with exact BigInt fractions, minus trivial ones — no number 0
on the left, no ×1, 1× or ÷1, and a result above zero. That leaves 206 six-character and 16,239
eight-character answers. Any valid equation is accepted as a guess, not only pool entries.

### Ruleset (`equation-guess-6-8`)

- Sizes: **Mini** (6 characters, 6 tries), **Classic** (8 characters, 6 tries), **Hard**
  (8 characters, 5 tries).
- Marks follow the standard two-pass rule: greens first, then yellows while unmatched copies of the
  symbol remain, so repeated symbols are never over-counted. The keypad shows each symbol's best
  mark so far.
- A puzzle solved on try 1…6 scores 100, 85, 70, 55, 40, 25; unsolved scores 0.

### Modes, interface, controls

Daily (Mini, Classic and Hard in turn; 300 max; the same for every player whatever their history;
share grid of coloured squares without the answers) and Endless (one size; answers seen in the last
500 puzzles avoided while fresh ones remain; End run). On-screen keypad, or the keyboard: digits,
`+ - =`, `x` or `*` for ×, `/` or `:` for ÷, Enter to try, Backspace to delete. The reveal shows the
points and the answer; results list each equation, size, tries and points.

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-puzzle with its guesses), daily totals, seen answers,
the chosen size and the record (played, solved, average tries, daily streak). Achievements:
Balanced (first solve), Lightning Calculator (≤ 2 tries), Under Pressure (a Hard solve),
Mathematician (25 solves), Daily Sums (7-day streak).

### AI interface

Config `{ size, puzzles }` (default three Classic). Action i guesses equation i of the size's answer
pool (all true equations); a guess already tried is illegal. Observation: puzzle index, total, size,
tries left and every guess with its marks — never the answer. The environment seed is mixed before
it picks answers, so an agent's own random stream started from the same number cannot mirror it.
Agents: Random (any untried equation); Consistent (a random equation that fits every mark so far —
the answer always does, a test checks it); Solver (among a sample of up to 150 consistent equations,
the one whose marks split a sample of up to 300 candidates into the most patterns).
`npm run evaluate -- equation-guess <a> <a> 100 7`, mean total out of 300 (three Classic puzzles):
Random 0, Consistent 195.5, **Solver 208.4**.

### Tests

`tests/engine.test.ts`: valid equations with precedence and fractions; every refusal reason; every
pool answer valid and non-trivial; marks with repeated symbols; keypad states; the daily (sizes,
determinism, history-independence, share text); scoring by tries, losing, endless avoidance,
finishing; invalid submissions and save validation; observations hide the answer; the answer stays
consistent; agent ordering; one try per equation; adapter contract. `tests/ui.test.tsx`: the daily
with keypad and keyboard, refused guesses, tile marks equal to the engine's, results and
achievements; resume of an endless Mini puzzle, a repeated guess refused, losing, End run.
`tests/e2e/games/equation-guess.spec.ts`: the daily solved by reading the tile colours back from
the board (keypad for Mini, keyboard for the rest; desktop + mobile), and an endless Hard puzzle
resumed after a reload.

### Simplifications

None known. Only non-negative whole results are used (no negative right sides), as stated above.
