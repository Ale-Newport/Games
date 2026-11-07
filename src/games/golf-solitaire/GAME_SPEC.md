# #079 Golf — Game Specification

## Ruleset (`golf-no-wrap`)

- One deck shuffled from a deal number (`?deal=N`). Seven columns of five face-up cards; only the
  bottom card of each column can play. One card starts the waste; 16 stay in the stock.
- Play a column's bottom card onto the waste if it is **one rank above or below** the waste's top
  card, whatever the suit. Ranks do **not** wrap (king and ace do not touch); a queen may go on a
  king and a king on a queen.
- Drawing turns the stock's top card onto the waste; the stock is used once.
- **Won** when all 35 cards are cleared; **lost** when the stock is empty and nothing fits.
- **Strokes** (lower is better), as in golf: the cards left on the table; clearing it scores minus
  the cards left in the stock (each one a stroke under par).

## Modes

Play (undo, hints) and Watch AI. Statistics key `golf` (wins, losses, best — lowest — strokes,
best time, streaks). The stats row shows the stock left.

## Computer players

The table is face up; the stock is unknown to the agents.

| Agent     | Play                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                         |
| `greedy`  | Plays whatever fits, preferring cards that free others; otherwise draws.                                                                                |
| `planner` | Best-first search over chains of plays, scoring cards cleared and free cards that still fit; draws when no chain improves. Used for hints and Watch AI. |

Measured on deals 1–100: the planner cleared **3**, the greedy player 2, the random player 0
(average share cleared 0.79, 0.75, 0.32). Golf is mostly decided by the order of the stock, which
nobody can see.

## States and actions

Shared `UpDownState` (see #078); positions c·5 + k for column c, card k from the back. Moves:
`draw`, `p19`.

## Achievements

| id          | Condition                                             |
| ----------- | ----------------------------------------------------- |
| `first-win` | Clear the whole table.                                |
| `birdie`    | Clear the table with cards still in the stock.        |
| `eagle`     | Clear the table with five or more cards in the stock. |
| `clean`     | Win without undo or hints.                            |

## Controls

A single tap plays a free card (or drag it onto the waste); tap the stock to draw. Keyboard:
←/→ card, Enter play, D draw, U undo, H hint, N new deal.

## Graphics and audio

The shared card art on felt: seven fanned columns (played cards leave no slot), the stock and
waste below. A chime for each play, a flick for draws, a fanfare on clearing.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `golf-solitaire` v`1.0.0`: one seat, hidden
information (observation masks the stock), move strings, return 1 when cleared or the share
cleared.

## Testing criteria

Shared up-or-down tests (see #078: layouts, no wrap in Golf, golf scoring with the under-par bonus,
the stuck loss, legality check, replay, masked view, planned chains, contract). Module: layout and
strokes, column-top plays (deal 3), the planner beating random; UI (tap play, strokes, a refused
card, draw, undo); e2e desktop + mobile.
