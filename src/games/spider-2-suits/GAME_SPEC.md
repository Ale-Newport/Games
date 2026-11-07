# #075 Spider — Two Suits — Game Specification

## Ruleset (`spider-2-suits`)

- 104 cards: two decks made of spades and hearts only (four runs of each), shuffled from a
  deal number (`?deal=N` replays a deal). Ten columns get 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 cards with
  only the top card face up; the other 50 form the stock (five deals of ten).
- Any card may go onto a card one rank higher; an empty column takes any card. Several cards move
  together only as a descending run of one suit. Moving a whole column into
  an empty one (which changes nothing) is not offered.
- Dealing puts one card face up on every column; not allowed while a column is empty.
- A complete king-to-ace run of one suit on top of a column leaves the table at once; a face-down card left on
  top turns up by itself.
- Won when all eight runs are removed. Lost when no move is left, or after 1500 moves.
- Score: 500 to start, −1 per move, +100 per run (never below 0).

## Modes

Play (undo, hints) and Watch AI (the planner plays deal after deal). Statistics key `suits-2`
(wins, losses, best score, best time, streaks). The stats row shows the deals left.

## Computer players

None of them peek: the planner works on a masked view where face-down cards and the stock are
unknown placeholders.

| Agent     | Play                                                                                                                                                                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                                                                                                                                                                     |
| `greedy`  | Fixed priorities (turn a card up, build on the same suit, any build, deal), never returning to a position already seen.                                                                                                                                                                                                                             |
| `planner` | Best-first search (4000 positions) over useful moves — ones that turn a card up, empty a column, or improve the build — scoring runs removed, cards turned up, empty columns and cards resting on their own suit; a line stops where an unknown card turns up. When nothing improves it fills empty columns and deals. Used for hints and Watch AI. |

Measured on deals 1–10 (300 ms per move cap): the planner solved **2 of 10** (average share of
runs 0.28); the greedy player 0 of 10 (0.09) and the random player 0 of 10 (0.00). Two suits are
much harder than one: runs of mixed suits can be built but not moved or removed.

## States and actions

`SpiderState` = `seed`, `suits`, `stock`, `columns[10]`, `down[10]`, `completed` (the king of each
run removed), `history`, `score`, `result`; validated by replaying the history from the deal
(linear time). Moves: `deal`, `c3:5>c7` (column 3 from its card 5 onto column 7).

## Achievements

| id           | Condition                              |
| ------------ | -------------------------------------- |
| `first-win`  | Solve a deal.                          |
| `quick`      | Solve a deal in under 15 minutes.      |
| `clean`      | Solve a deal without undo or hints.    |
| `high-score` | Solve a deal with 1000 points or more. |

## Controls

Tap a card (and the run on it), then the column to move to, or tap it twice / double-click to send
it to its best spot (on its own suit, then any card one higher, then an empty column). Cards can be
dragged. Tap the stock to deal. Keyboard: ←/→ column, ↑/↓ card, Enter pick / drop, D deal,
A auto-move, U undo, H hint, N new deal.

## Graphics and audio

The shared card art and felt table: eight dashed "K" slots that fill with the kings of completed
runs, the stock top right, ten fanned columns that compress to fit; cards slide into place. Card
sounds (a chime when a run completes) and a fanfare on solving.

## Save format and AI interface

Save slot schema 1 (`{ state, elapsedMs, undos, hints, recorded, … }`), validated by replay. Env
`spider-2-suits` v`1.0.0`: one seat, hidden information (observation = the masked view), move
strings, return 1 for a solved deal or the share of runs removed.

## Testing criteria

Shared Spider tests: the deal for one, two and four suits; building on any suit and moving only
one-suit runs; completing a run (score, card turned up); no deal with an empty column; the win and
a dead position; the direct legality check matching the move list; replay validation; the masked
view; the planner finding a completing move; the contract suite. Module (two suits): layout and deals left,
taps to moves, the planner beating the greedy player, the contract suite; UI (tap-tap, deal,
undo); e2e desktop + mobile.
