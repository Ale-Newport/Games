# #026 Go 13×13 — Game Specification

## Ruleset (`tromp-taylor-13x13-komi7.5`)

Go on a 13×13 board with Tromp–Taylor style rules:

- **Black** (seat 0) moves first, **White** (seat 1) second; a move places a stone on an empty
  intersection or passes.
- A chain of stones with no liberties is captured. A move that would leave its own chain without
  liberties is illegal (**no suicide**) unless it captures first.
- **Positional superko**: a move may not recreate any earlier board position (this covers the
  basic ko).
- The game ends after **two consecutive passes** (or 507 plies). Score = **area**: stones on
  the board plus empty regions that touch only that color; White adds **komi 7.5** (no ties). Every
  stone left on the board counts as alive — dead stones must be captured before passing.
- Optional clocks, resignation and agreed draws (two players) from the shared shell.

Not implemented (documented): Japanese territory scoring and the dead-stone agreement phase; handicap stones.

## States and actions

Shared engine `src/games/shared/go/engine.ts`: `GoState` = `board` (0/1/2), `toMove`, `history`
(points, −1 = pass), `captures`, `hashes` (every board for superko), `passes`, `result` (with the
area score), validated by replay. Actions: point index `row·13 + col` or −1 (pass).

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. `GoMctsAgent`: Monte Carlo tree search (UCT
with RAVE/AMAF) over fast playouts on a mutable board (no filling of own eyes, captures of groups
left in atari, area scoring with komi); after the opponent passes it passes when already ahead.

| Level  | Search                         |
| ------ | ------------------------------ |
| Easy   | 300 playouts, 20% random moves |
| Medium | 1 500 playouts                 |
| Hard   | 1.5 s per move                 |
| Expert | 2.5 s per move                 |

Measured (seeded, colors alternated, `go-match` bench): Easy vs Random 2–0 (+46 points on average),
Medium vs Easy 2–0 (+23.5), Hard vs Medium 2–0 (+63), Expert vs Hard 2–0 (+32); about 4 000
playouts per second on 13×13 in Node. (Two games per pairing: 13×13 games are long.)

## Achievements

| id                                        | Condition                                            |
| ----------------------------------------- | ---------------------------------------------------- |
| `first-win`                               | Win against the computer.                            |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                     |
| `big-capture`                             | Capture 10 or more stones in a game vs the computer. |
| `by-ten`                                  | Beat the computer by 10 points or more.              |
| `hot-seat`                                | Finish a two-player game.                            |

## Controls

Tap an intersection to place (touch: tap twice to confirm); **Pass** below the board. Keyboard:
arrows move the cursor, Enter places; `U` undo, `H` hint (Medium), `R` restart, `N` next round.

## Graphics and audio

Shared `GoBoard`: wooden board with grid, star points and coordinates (A–N without I), shaded stones,
last-move ring, hint ring, counted territory squares after the game. Status line with captures
and komi. Stone, capture and pass sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `go-13x13` v`1.0.0`; `actionSpaceSize` 170 (points + pass at
index 169); tensor `[3, 13, 13]` (own, opponent, empty); outcome `scores` = area counts. Agents
`random`, `easy`, `medium`, `hard`, `expert`.

## Testing criteria

Shared engine: captures and capture counts, suicide vs capturing move, superko forbids retaking a ko
until the board changes, area scoring with neutral points, two-pass ending, random games end and
validate. Module: action space and pass, empty-board result (komi), Easy beats Random (seeded), save
round trip and tamper rejection, contract suite; e2e desktop + mobile.
