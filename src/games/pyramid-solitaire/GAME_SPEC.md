# #077 Pyramid — Game Specification

## Ruleset (`pyramid-three-passes`)

- One deck shuffled from a deal number (`?deal=N`). 28 cards face up in a pyramid of seven rows
  (1…7), each card half covering two cards of the row above; 24 cards in the stock.
- A pyramid card is **free** when no card of the row below still covers it; the waste's top card
  is free too.
- Remove two free cards whose values add up to **13** (ace 1 … jack 11, queen 12), or a **king**
  alone.
- Drawing turns the stock's top card onto the waste. The waste may be turned back into the stock
  **twice** (three passes in all).
- **Won** when the pyramid is cleared (stock and waste need not be). **Lost** when no move is
  left, or after 600 moves.
- Score: 5 per card removed, +50 for clearing the pyramid.

## Modes

Play (undo, hints) and Watch AI. Statistics key `pyramid` (wins, losses, best score, best time,
streaks); the stats row shows the passes left.

## Computer players

The pyramid is face up; the stock is unknown until it has been seen once (after the first pass
every card has been on the waste), and the planner never peeks at it.

| Agent     | Play                                                                                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                                                        |
| `greedy`  | Removes pyramid pairs (deepest first), then pairs with the waste, then draws.                                                                                                                                                          |
| `planner` | Best-first search (20 000 positions) for the most pyramid cards removed, weighting cards high in the pyramid; a draw turning up an unknown card ends a line; it replays a clearing line once it sees one. Used for hints and Watch AI. |

Measured on deals 1–50: the planner cleared **15 of 50** (average share removed 0.79); the random
player 0 of 50 (0.60); on deals 1–30 the greedy player cleared 4 (0.73).

## States and actions

`PyramidState` = `seed`, `pyramid[28]` (−1 where removed), `stock`, `waste`, `recycles`,
`history`, `score`, `result`; validated by replaying the history from the deal. Positions: pyramid
index r(r+1)/2 + k, `w` the waste top. Moves: `draw`, `p27` (a king), `w` (a king on the waste),
`p20+p27`, `p25+w`.

## Achievements

| id          | Condition                                |
| ----------- | ---------------------------------------- |
| `first-win` | Clear the pyramid.                       |
| `one-pass`  | Clear it without turning the waste back. |
| `clean`     | Clear it without undo or hints.          |
| `quick`     | Clear it in under 3 minutes.             |

## Controls

Tap a free card, then its partner (or drag one onto the other); tap a king twice, or double-click.
Tap the stock to draw. Keyboard: ←/→ card, Enter pick / pair, D draw, A remove, U undo, H hint,
N new deal.

## Graphics and audio

The shared card art on felt: the pyramid's overlapping rows (removed cards leave no slot), the
stock and waste below. A chime for each removal, a flick for draws, a fanfare on clearing.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `pyramid-solitaire` v`1.0.0`: one seat, hidden
information (observation = the stock masked until seen), move strings, return 1 for a cleared
pyramid or the share of its cards removed.

## Testing criteria

Engine: the deal and free cards, freeing a card, kings and pairs of 13 (deal 2), only two
recycles and the loss, clearing with cards left in the stock, the direct legality check matching
the move list over a full random game, replay validation. Agents: the masked stock, a planned
clearing line, the planner beating the greedy player. Definition: layout and pairing taps.
Contract suite. UI: a king in two taps, a pair, a draw and undo. e2e desktop + mobile.
