# #085 Canfield — Game Specification

## Ruleset (`canfield-draw-3`)

- One deck shuffled from a deal number (`?deal=N`): 13 cards form the **reserve** (only its top
  card face up), the next card starts the first foundation and fixes the **base rank**, four cards
  start the four tableau piles, and 34 form the stock.
- **Foundations** build up by suit from the base rank, wrapping from king to ace; a card of the base
  rank may start any empty foundation. Cards home stay home.
- **Tableau** piles build down in alternating colors, also wrapping (a king on an ace); any properly
  built run moves as a unit (a common modern rule; the oldest rules move only whole piles). An
  emptied pile is refilled at once from the top of the reserve; once the reserve is empty, an empty
  pile takes any card.
- The **stock** turns three cards at a time onto the waste (fewer at the end), unlimited passes. The
  tops of the waste and the reserve are playable.
- **Won** with all 52 cards home; **lost** when drawing is the only move left and a whole pass turned
  up nothing else, or after 1500 moves. Score: cards home.

## Modes

Play (undo, hints, automatic finish once the reserve, stock and waste are empty) and Watch AI.
Statistics key `canfield`. The stats row shows the reserve left and the base rank.

## Computer players

They never peek: the reserve below its top card, and the stock until its first pass, are unknown.

| Agent     | Play                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                                                                   |
| `greedy`  | Fixed priorities: cards home, reserve to the tableau, waste to the tableau, then draw.                                                                                                                                                            |
| `planner` | Best-first search (6000 positions) over every move — a line stops where an unknown card turns up — scoring cards home and the reserve emptied; never steps back into a recent position; draws when nothing improves. Used for hints and Watch AI. |

Measured on deals 1–30 (300 ms per move cap): the planner solved **3** (average share home 0.29);
the greedy player 0 (0.13); the random player 0 (0.15).

## States and actions

`CanfieldState` = `seed`, `base`, `reserve`, `stock`, `waste`, `foundations[4]`, `tableau[4]`,
`history`, `quiet`, `recycles`, `result`; validated by replay. Moves: `draw`, `r>f1`, `r>t2`,
`w>f0`, `w>t3`, `t1>f0`, `t0:2>t3`.

## Achievements

| id          | Condition                           |
| ----------- | ----------------------------------- |
| `reserve`   | Empty the reserve.                  |
| `first-win` | Solve a deal.                       |
| `clean`     | Solve a deal without undo or hints. |

## Controls

Tap a card, then where it goes, or tap it twice to send it to its best spot (home first). Cards can
be dragged. Tap the stock to draw. Keyboard: ←/→ pile, ↑/↓ card, Enter pick / drop, D draw, A
auto-move, U undo, H hint, F finish, N new deal.

## Graphics and audio

The shared card art on felt: stock and the waste fanned three wide, four foundations whose empty
slots show the base rank, the reserve stacked on the left, four fanned tableau piles. Card sounds
and a fanfare.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `canfield` v`1.0.0`: one seat, hidden information
(masked reserve and stock), move strings, return 1 when solved or the share home.

## Testing criteria

Engine: the deal and base, base-rank foundations wrapping king to ace and color-alternating
tableau wrapping ace to king, the reserve refill (deal 3), draw three and recycling, replay
validation, the win. Agents: the masked view, the planner beating the greedy player. Definition:
taps to moves, base shown on empty foundations. Contract suite. UI (home, refill, draw three,
undo). e2e desktop + mobile.
