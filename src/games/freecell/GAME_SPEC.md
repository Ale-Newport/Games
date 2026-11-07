# #073 FreeCell — Game Specification

## Ruleset (`freecell-4-cells`)

- One 52-card deck shuffled from a deal number (our own seeded shuffle; `?deal=N` replays a deal),
  dealt face up into eight columns of 7, 7, 7, 7, 6, 6, 6, 6. Four free cells, four foundations
  built up by suit from the ace (an ace may start any empty foundation).
- Columns build down in alternating colors; an empty column takes any card. The top card of a
  column or a free cell may go to a foundation, onto a column, or (from a column) to an empty cell.
- A sequence may move as a unit if it could be moved card by card: at most
  (free cells + 1) · 2^(empty columns) cards, not counting the target if it is an empty column.
  Moving a whole column into an empty one (which changes nothing) is not offered.
- Foundation cards stay home. Cards no column can still need — aces, twos, and cards whose
  opposite-color cards one rank lower are both home — go home automatically after each move.
- Won when all 52 cards are home; lost when no move is left, or after 1000 moves.

## Modes

Play (undo, hints, automatic finish once every column runs downward) and Watch AI (the solver
plays deal after deal). Statistics key `freecell` (wins, losses, best time, streaks); the status
line counts the cards home.

## Computer players

Everything is face up, so the planner is a real solver.

| Agent    | Play                                                                                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `random` | Any legal move.                                                                                                                                                                                                                                                                                                                      |
| `greedy` | Fixed priorities (safe cards home, cards home, cell → column, runs onto columns, cells last), never returning to a position already seen.                                                                                                                                                                                            |
| `solver` | Best-first search (60 000 positions) over canonical positions — columns and cells in any order count as one — with safe plays made automatically; it scores cards home, cards buried above the next card each suit needs, out-of-sequence cards and free space, and replays the full solution it finds. Used for hints and Watch AI. |

Measured on deals 1–50: the solver solved **50 of 50** (at most ~0.13 s per decision); the greedy
player 2 of 50 (average share home 0.14) and the random player 2 of 50 (0.10).

## States and actions

`FreeCellState` = `seed`, `columns[8]`, `cells[4]` (−1 empty), `foundations[4]`, `history`,
`result`; validated by replaying the history from the deal (linear time). Moves: `c3>f0`, `c3>r1`,
`r1>c4`, `r1>f2`, `c3:5>c6` (column 3 from its card 5).

## Achievements

| id          | Condition                                                  |
| ----------- | ---------------------------------------------------------- |
| `first-win` | Solve a deal.                                              |
| `quick`     | Solve a deal in under 5 minutes.                           |
| `clean`     | Solve a deal without undo or hints.                        |
| `two-cells` | Solve a deal never using more than two free cells at once. |

## Controls

Tap a card (and any run on it), then its destination — a column, a free cell or a foundation — or
tap it again / double-click to send it to its best spot (home, then a column, then a cell). Cards
can be dragged. Keyboard: ←/→ pile, ↑/↓ card, Enter pick / drop, A auto-move, U undo, H hint,
F finish, N new deal.

## Graphics and audio

The shared card art and felt table (see #071): free cells as dashed slots on the left, foundations
with "A" on the right, eight fanned columns that compress to fit; cards slide into place. Card
sounds and a fanfare on solving.

## Save format and AI interface

Save slot schema 1: `{ state, elapsedMs, undos, hints, recorded }`, validated by replay. Env
`freecell` v`1.0.0`: one seat, full information, move strings, return 1 for a solved deal or the
share of cards home; `stateKey` is the canonical position.

## Testing criteria

Engine: the deal, run limits with cells and empty columns, runs refused without room, cells in and
out, safe automatic plays and the win, a dead position with no moves, the direct legality check
matching the move list, the move cap ending random play, replay validation. Solver: canonical
positions, complete solutions of seeded deals, beating the greedy player. Definition: taps and
drops to moves, finishing a sorted deal. Contract suite (short playouts). UI: the automatic ace,
tap-tap to a column, undo, parking a card in a chosen cell. e2e desktop + mobile.
