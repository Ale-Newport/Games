# #002 Tic-Tac-Toe 4×4

Four in a row on a 4×4 board.

Built on the shared m,n,k family in `src/games/shared/mnk/` (also used by #001):

| Shared file                   | Role                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `engine.ts`                   | Pure rules (any m, n, k; misère flag)                                                           |
| `solver.ts`                   | Exact bitboard solver (symmetry TT, dead-position + forced-move pruning)                        |
| `agents.ts`                   | `MnkSolverAgent` (perfect, trap-setting tie-breaks), open-line heuristic, center-first ordering |
| `environment.ts`              | `GameEnvironment` factory for the adapters                                                      |
| `match.ts`                    | Match flow: modes, rounds, scores, undo, save validation                                        |
| `MnkGame.tsx`, `MnkBoard.tsx` | Full game UI and board                                                                          |
| `i18n.ts`, `sounds.ts`        | Shared strings and synthesized sounds                                                           |

Game-specific files: `rules.ts` (4×4 rules + achievement predicates), `ai.ts` (difficulty presets),
`ai-adapter.ts`, `match.ts` (config), `Game.tsx` (definition + achievements), `HowToPlay.tsx`,
`i18n.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.

## Performance notes

A plain memoized negamax needs 44M nodes / ~27 s to solve the empty 4×4 board. The shared solver
needs 3.4M nodes / ~0.65 s (desktop). Because every position with ≤ 3 marks is a proven draw, the
Perfect agent skips the search while ≤ 2 marks are down; from the 3-mark position onward a fresh
solve takes ≈ 20–70 ms on desktop and its table is reused for later moves.

## Specification

### Ruleset (`four-in-a-row-4x4`)

- Board: 4×4 grid, initially empty. Two players: **X** (seat 0) and **O** (seat 1). X moves first
  in the first round.
- Players alternate placing their mark in any empty cell; marks never move.
- The first player to complete **four in a row** — any of the 4 rows, 4 columns or the 2 long
  diagonals (10 lines) — wins immediately. Three in a row does not count.
- If all 16 cells fill with no line, the round is a draw.
- Match option _Alternate who starts each round_ (default on).

This is the m,n,k-game (4,4,4). It is a known draw with perfect play; our exact solver confirms
this and further proves that **every position with at most 3 marks is a draw** (all 240 two-mark
and 3,360 three-mark positions), so any first, second or third move is safe.

### States, actions, flow

Shared with #001 via `src/games/shared/mnk/` (engine, match flow, UI):

| State        | Description                                                         |
| ------------ | ------------------------------------------------------------------- |
| `menu`       | Mode setup and resume                                               |
| `playing`    | `board[16]` (0 empty, 1 X, 2 O), `toMove`, `history`, `firstPlayer` |
| `round-over` | Win (winner + 4-cell line) or draw; scores updated                  |

Action: `place(cell)`, `cell ∈ 0..15` row-major, legal iff empty and round not over. UI actions:
undo (vs computer removes the CPU reply too), hint, restart round, next round, menu.

### Modes and difficulty

vs Computer (play as X or O), Two Players (hot-seat, names), Watch AI (agent per mark, speed,
pause/step).

| Level   | Agent                                                                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Easy    | Alpha-beta 2 plies with the open-line heuristic; random move 45% of the time                                                                                                                                                                                                               |
| Medium  | Alpha-beta 4 plies with the open-line heuristic and center-first ordering; random move 8% of the time                                                                                                                                                                                      |
| Perfect | Exact bitboard solver (symmetry-reduced transposition table, dead-position and forced-move pruning). Plays only value-preserving moves; among them prefers positions the heuristic rates best, to set traps. Skips the search while ≤ 2 marks are on the board (proven safe). Never loses. |

Open-line heuristic: for every line not blocked by the opponent, add 3^(marks−1); subtract the same
for the opponent; squash with tanh.

### Scoring, statistics

Scoreboard X / O / draws. Profile stats per round: `vs-ai:<level>` win/loss/draw; `local`
complete/draw. Watch mode records nothing.

### Achievements

| id              | Condition                                                                |
| --------------- | ------------------------------------------------------------------------ |
| `first-win`     | Win a round against the computer.                                        |
| `beat-medium`   | Win against Medium.                                                      |
| `perfect-draw`  | Draw against Perfect.                                                    |
| `double-threat` | Win (not watch mode) after creating two different winning cells at once. |
| `diagonal-win`  | Win with a long diagonal.                                                |
| `hot-seat`      | Finish a two-player round.                                               |

### Controls

Click/tap a cell. Keyboard: arrows/WASD move the cursor, Enter/Space place, `U` undo, `H` hint,
`R` restart, `N` next round. (No digit shortcuts: 16 cells do not map to a keypad.)

### Graphics and audio

Shared animated SVG board (`MnkBoard`) at 4×4, stroke-drawn X/O, winning-line sweep, last-move and
hint markers, colorblind palette, reduced-motion support; shared synthesized sounds.

### Save format (`schema 1`)

Same envelope as #001 (`setup`, `round`, `roundNumber`, `scores`, `recorded`), validated by replaying
the move history on a 4×4 board. Watch mode is not saved.

### AI interface

Env id `tic-tac-toe-4x4`, version `1.0.0`, ruleset `four-in-a-row-4x4`; turn-based, 2 players,
deterministic, perfect information, zero-sum. Action = cell 0–15 (`actionSpaceSize` 16).
Observation tensor `[3, 4, 4]` (own marks, opponent marks, X-to-move plane). Config
`{ firstPlayer?: 0 | 1 }`. Agents: `random`, `easy`, `medium`, `perfect` (exact oracle).

### Testing criteria

- Rules: exactly 10 winning lines; wins on rows/columns/diagonals; 3-in-a-row is not a win; draw on
  a full board; illegal moves rejected.
- Solver: agrees with plain negamax on random late positions (shared tests); 4×4 is a draw; every
  ≤ 3-mark position is a draw (justifies the opening book).
- Perfect never loses: vs Random, Easy, Medium over seeded batches with both seats; Perfect vs
  Perfect always draws.
- Adapter contract suite, match flow, save validation, jsdom UI, Playwright desktop + mobile.
