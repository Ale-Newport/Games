# #083 Accordion — Game Specification

## Ruleset (`accordion-deal-as-you-go`)

- One deck shuffled from a deal number (`?deal=N`) forms the stock. Each deal puts the next card
  at the right end of a single row of piles.
- At any time a pile may move onto the pile **immediately to its left** or **three places to its
  left** when their top cards share a **suit or a rank**; the whole pile moves and the row closes
  up.
- **Won** when every card has been dealt and one pile remains; otherwise the deal ends when the
  stock is empty and no move is left.
- **Score**: piles left plus cards not dealt (lower is better). Winning is rare; short rows earn
  achievements.

## Modes

Play (undo, hints) and Watch AI. Statistics key `accordion` (wins, losses, best — lowest — score,
best time, streaks). The stats row shows the row length and the stock.

## Computer players

The stock order is hidden from them.

| Agent     | Play                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                                     |
| `greedy`  | Any move it can (three to the left first), otherwise deals.                                                                                                                                                         |
| `planner` | Best-first search (4000 positions) over the moves among the dealt cards for the fewest piles, keeping matches available; it plays only lines that shorten the row and otherwise deals. Used for hints and Watch AI. |

Measured on deals 1–200: the planner won **1** and left 4.4 piles on average (return 0.915); the
greedy player won 0 and left 10.7 (0.795); the random player about the same as greedy (0.792).

## States and actions

`AccordionState` = `seed`, `piles` (left to right, top card last), `stock`, `history`, `result`;
validated by replaying the history. Moves: `deal`, `p5-1`, `p5-3`.

## Achievements

| id          | Condition                                |
| ----------- | ---------------------------------------- |
| `five`      | Finish a deal with five piles or fewer.  |
| `three`     | Finish a deal with three piles or fewer. |
| `first-win` | Squeeze the whole deck into one pile.    |
| `clean`     | Win without undo or hints.               |

## Controls

Tap a pile, then the pile to put it on (one or three to the left), or tap it twice (three to the
left is tried first); piles can be dragged. Tap the stock to deal. Keyboard: ←/→ pile, Enter pick /
drop, D deal, A auto-move, U undo, H hint, N new deal.

## Graphics and audio

The shared card art on felt: the stock top left and the row of piles wrapping onto lines of eight
(merged piles leave no gap). Card sounds and a fanfare on a win.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `accordion` v`1.0.0`: one seat, hidden information
(the stock's order), move strings, return 1 for a win or 1 − score/52.

## Testing criteria

Engine: dealing, moves one and three to the left on rank and suit (deal 1), the win and the stuck
end, the direct legality check matching the move list over a random game, replay validation.
Agents: a planned line closing six piles into two, the planner beating the greedy player.
Definition: wrapping and tap mapping. Contract suite. UI (deals, both moves, undo). e2e desktop +
mobile.
