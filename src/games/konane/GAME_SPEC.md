# #053 Konane — Game Specification

## Ruleset (`konane-6x6`)

- A 6×6 board starts full of stones in a checkerboard: **Black** (seat 0) on a6's color, **White**
  (seat 1) on the others. Black always moves first.
- Opening: Black removes one of its stones from the **middle** (c4 or d3) or a **corner** (a6 or
  f1); White then removes one of its stones **orthogonally next to the hole**.
- Then a move jumps one of your stones horizontally or vertically over an adjacent enemy stone into
  the empty cell just beyond, capturing it. The same stone may continue jumping **in the same
  direction**, one enemy stone at a time, stopping wherever the player chooses.
- The player who cannot move **loses**. There are no draws.

## States and actions

`KonaneState`: `board` (0/1/2), `toMove`, `history`, `result`, validated by replay. Actions:
`x14` (opening removal) or `12-14` (jump, landing two or four cells away).

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. Generic alpha-beta with a transposition table;
evaluation = own jumps − opponent's jumps (unlike Clobber, jump counts genuinely differ here).

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 3 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 8–2, Medium vs Easy 10–0,
Hard vs Medium 10–0.

## Achievements

| id                         | Condition                                   |
| -------------------------- | ------------------------------------------- |
| `first-win`                | Win against the computer.                   |
| `beat-medium`, `beat-hard` | Beat each level.                            |
| `double-jump`              | Win a game in which you made a double jump. |
| `hot-seat`                 | Finish a two-player game.                   |

## Controls

Opening: tap the stone to remove (outlined in orange). Then tap your stone and a landing cell
(green dot); farther landings are multiple jumps. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`.
The status line names the opening step.

## Graphics and audio

A wooden checkered board with basalt and coral-white stones, the last move outlined, landing dots,
a stone counter. Jump sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `konane` v`1.0.0`; codec: removal p → p; jump from f in
direction d with k hops → 36 + (f·4 + d)·2 + (k − 1) (`actionSpaceSize` 324); tensor `[2, 6, 6]`.
Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Opening removals, single and double jumps with captures, the stuck player loses, replay validation,
codec, strength ordering (seeded), save round trip and tamper rejection, contract suite, UI
(opening, landing marks, jump, counter), e2e desktop + mobile.
