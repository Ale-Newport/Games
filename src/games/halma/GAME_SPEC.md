# #065 Halma — Game Specification

## Ruleset (`halma-16x16-two-player`)

- A 16 × 16 board; two players with **19 pieces** each in opposite corner camps (the cells with
  x + y ≤ 5 from the corner, minus the two ends of the last diagonal). Orange (seat 0) starts in
  the bottom-right corner, Teal in the top-left; rounds alternate who opens.
- A move is either a **step** to an adjacent empty square in any of the eight directions, or a
  **chain of jumps**: each jump goes over one adjacent piece of either color to the empty square
  straight beyond it; the chain may turn and stop anywhere. Nothing is captured.
- A piece that has reached the opponent's camp may move within it but never leave it.
- **Win**: every square of the opponent's camp is occupied and at least one by your pieces (so a
  player cannot block their own camp by never leaving it).
- A player with no legal move loses (not seen in play). After **600 plies** the player whose pieces
  have less distance left to cover wins (equal is a draw).

## Modes and difficulty

vs Computer (Orange or Teal), Two Players, Watch AI. Generic alpha-beta with a transposition table
and gain-first move ordering. Evaluation: the opponent's total distance to go minus your own, with
the piece furthest behind counted 1.5 times more (no stragglers), squashed with tanh. Distance to
the far corner is x + y plus a small pull toward the diagonal, so the camp itself is the unique
closest arrangement.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 2 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, seed 9): Easy vs Random 6–0, Medium vs Easy 6–0 (6 games each), Hard
vs Medium 4–0 (4 games, ~90 s each). Every game ended by filling the camp (Medium vs Easy in ~190
plies on average, Hard vs Medium ~177).

## States and actions

Shared engine `src/games/shared/jump-race/engine.ts`: `JumpRaceState` = `board` (256 cells, row by
row from the top-left; 0 empty, 1 Orange, 2 Teal), `toMove`, `first`, `history`, `result`
{winner, reason `camp` | `stuck` | `limit`}; validated by replay from `first`. Actions: `"from-to"`
cell indices (the path of a jump chain does not matter).

## Achievements

| id                         | Condition                                              |
| -------------------------- | ------------------------------------------------------ |
| `first-win`                | Win against the computer.                              |
| `beat-medium`, `beat-hard` | Beat each level.                                       |
| `sprint`                   | Win against the computer in 160 plies or fewer (both). |
| `hot-seat`                 | Finish a two-player game.                              |

## Controls

Tap one of your pieces (movable ones are ringed), then a marked square — green marks, or yellow
inside your goal camp. Keyboard: arrows move the cursor, Enter picks / moves, Esc cancels;
`U`/`H`/`R`/`N`. The board turns so your camp is at the bottom; the status line counts the pieces
that have arrived on each side.

## Graphics and audio

A cream checkerboard with the two camps tinted in their owners' colors, glossy marbles, the last
move's jump path drawn as a dashed line and the hint as a blue arrow line. A soft step tone and a
rising double hop for jumps.

## Save format and AI interface

Shared match envelope (schema 1). Env `halma` v`1.0.0`; codec: from·256 + to (`actionSpaceSize`
65 536); tensor `[2, 256]` (the observer's pieces, then the opponent's). Agents `random`, `easy`,
`medium`, `hard`.

## Testing criteria

Shared jump-race tests (camp shapes, the star's 121 holes and points, the camp as the unique
closest arrangement, steps and jump chains over either color with the recovered path, pieces locked
in the far camp, the anti-blocking win, replay validation with the opener, the move limit, codec and
evaluation symmetry). Module: Easy beats Random (seeded), alternating opener, save round trip and
tamper rejection, contract suite, UI (pick and move), e2e desktop + mobile.
