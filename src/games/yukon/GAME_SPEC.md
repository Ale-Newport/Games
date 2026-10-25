# #080 Yukon — Game Specification

## Ruleset (`yukon-classic`)

- One deck shuffled from a deal number (`?deal=N`), all dealt: seven columns, the first with one
  face-up card, the others with 1–6 face-down cards under 5 face-up cards. No stock.
- Build down in **alternating colors**. **Any face-up card moves together with every card on top
  of it**, whether or not those cards are in sequence. An empty column takes only a king (with its
  cards); moving a whole column into an empty one is not offered.
- Four foundations built up by suit from the ace (an ace may start any empty one); foundation cards
  stay home. A face-down card left on top turns up by itself.
- **Won** with all 52 cards home; **lost** when no move is left, or after 1000 moves. The score
  shown is the cards home.

## Modes

Play (undo, hints, automatic finish once every card is face up) and Watch AI. Statistics key
`yukon` (wins, losses, best time, streaks).

## Computer players

The agents never peek at face-down cards (masked view).

| Agent     | Play                                                                                                                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                                                                                                                      |
| `greedy`  | Fixed priorities (cards home, moves that turn a card up, others), avoiding positions already seen.                                                                                                                                                                                                   |
| `planner` | Breadth-first search (6000 positions) for the **shortest** line to real progress — cards home, cards turned up (weighted most), empty columns — taking the best line at that depth; recent positions are off limits so it cannot loop; otherwise the greedy priorities. Used for hints and Watch AI. |

Measured on deals 1–30: the planner solved **9** (average share home 0.42), the greedy player 7
(0.31); on deals 1–10 the random player solved 3. An earlier best-first planner that chased long,
"tidier" lines did worse than the greedy player (it buried needed cards), hence the shortest-line
rule.

## States and actions

Shared `ColumnsState` = `seed`, `stock`, `waste`, `columns`, `down`, `foundations`, `runs`,
`redeals`, `history`, `result`; validated by replaying the history from the deal. Moves:
`c3:5>c7` (column 3 from its card 5), `c3>f2`.

## Achievements

| id          | Condition                           |
| ----------- | ----------------------------------- |
| `first-win` | Solve a deal.                       |
| `quick`     | Solve a deal in under 5 minutes.    |
| `clean`     | Solve a deal without undo or hints. |

## Controls

Tap a card (it and everything on it), then the column to put it on, or tap it twice / double-click
to send it to its best spot. Cards can be dragged. Keyboard: ←/→ pile, ↑/↓ card, Enter pick /
drop, A auto-move, U undo, H hint, F finish, N new deal.

## Graphics and audio

The shared card art on felt: four foundations with "A" slots, seven fanned columns (empty ones
marked "K") that compress to fit; cards slide into place. Card sounds and a fanfare on solving.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `yukon` v`1.0.0`: one seat, hidden information
(observation masks face-down cards), move strings, return 1 when solved or the share home.

## Testing criteria

Shared column tests: the three deals, group moves out of sequence and the king-only empty column,
suit building with run removal and reserve deals (Scorpion), one-card moves and a single stock
pass (Forty Thieves), the direct legality check matching the move list over random games for every
variant, replay validation, the win, the masked view and a planned reveal, the contract suite.
Module: layout, group moves (deal 1), the planner beating the greedy player, contract; UI (a group
move turning a card up, undo); e2e desktop + mobile.
