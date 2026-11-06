# #052 Clobber — Game Specification

## Ruleset (`clobber-6x6`)

- A 6×6 board starts **completely filled** with stones in a checkerboard: **White** (seat 0) on
  the squares of a6's color, **Black** (seat 1) on the others. The first player alternates.
- A move takes one of your stones onto an **orthogonally adjacent enemy stone**, which is removed;
  the moving stone takes its cell and its old cell becomes empty. Stones never move onto empty
  cells.
- The player who cannot move **loses**. There are no draws.

## States and actions

`ClobberState`: `board` (0/1/2), `first`, `toMove`, `history`, `result`, validated by replay.
Actions: `14-15` (from-to).

## Modes and difficulty

vs Computer, Two Players, Watch AI. The bench showed why plain heuristics fail here: every touching
White–Black pair gives one move to _each_ side, so mobility is always equal, and alpha-beta on an
"active stones" evaluation only beat Random 14–6 at depth 4, while the generic MCTS agent with 100
simulations already won 18–2.

| Level  | Search                                                               |
| ------ | -------------------------------------------------------------------- |
| Easy   | MCTS with 60 simulations; random move 20% of the time                |
| Medium | MCTS with 600 simulations                                            |
| Hard   | MCTS for about 1.5 s; exact alpha-beta once 10 or fewer moves remain |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 9–1, Medium vs Easy 9–1,
Hard vs Medium 10–0.

## Achievements

| id                         | Condition                        |
| -------------------------- | -------------------------------- |
| `first-win`                | Win against the computer.        |
| `beat-medium`, `beat-hard` | Beat each level.                 |
| `quick-clobber`            | Win in 14 moves or fewer in all. |
| `hot-seat`                 | Finish a two-player game.        |

## Controls

Tap one of your stones (only stones with a capture respond), then an enemy stone marked with a red
ring. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

A green checkered board with shaded white and black stones, the selected stone and the last move
outlined, capture targets ringed in red, a stone counter. Clobber sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `clobber` v`1.0.0`; codec: from·4 + direction (up, down,
left, right; `actionSpaceSize` 144); tensor `[2, 6, 6]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Checkerboard start (60 moves each), clobbering moves only, no-move loss, replay validation, codec,
strength ordering (seeded), save round trip and tamper rejection, contract suite, UI (targets,
capture, counter), e2e desktop + mobile.
