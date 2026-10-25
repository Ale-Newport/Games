# #078 TriPeaks — Game Specification

## Ruleset (`tripeaks-wrap`)

- One deck shuffled from a deal number (`?deal=N`). 28 cards form three overlapping peaks in rows
  of 3 (the peak tops), 6, 9 and 10; only the bottom row starts face up, and a card turns up as
  soon as both cards covering it are gone. One card starts the waste; 23 stay in the stock.
- Play an uncovered card onto the waste if it is **one rank above or below** the waste's top card,
  whatever the suit; **king and ace touch** (ranks wrap).
- Drawing turns the stock's top card onto the waste; the stock is used once.
- **Won** when all 28 cards are cleared; **lost** when the stock is empty and nothing fits.
- **Score**: each card played scores the length of the current run of plays (1, 2, 3, …; a draw
  ends the run), +15 for each peak top, +30 for clearing all three.

## Modes

Play (undo, hints) and Watch AI. Statistics key `tripeaks` (wins, losses, best score, best time,
streaks). The stats row shows the current run and the stock.

## Computer players

The agents never peek: in their masked view covered cards and the stock are unknown.

| Agent     | Play                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                             |
| `greedy`  | Plays whatever fits, preferring cards that uncover others; otherwise draws.                                                                                                                                 |
| `planner` | Best-first search over chains of plays (20 000 positions), scoring cards cleared, unknown cards it would turn up, and free cards that still fit; draws when no chain improves. Used for hints and Watch AI. |

Measured on deals 1–100: the planner cleared **55**, the greedy player 45, the random player 0
(average share cleared 0.96, 0.95, 0.59).

## States and actions

Shared `UpDownState` = `seed`, `tableau[28]` (−1 where played), `stock`, `waste`, `run`, `history`,
`score`, `result`; validated by replay. Positions: peak tops 0–2, then rows of 6, 9 and 10. Moves:
`draw`, `p12`.

## Achievements

| id          | Condition                                            |
| ----------- | ---------------------------------------------------- |
| `first-win` | Clear all three peaks.                               |
| `long-run`  | Win with a run of ten plays or more without drawing. |
| `spare`     | Win with five or more cards left in the stock.       |
| `clean`     | Win without undo or hints.                           |

## Controls

A single tap plays an uncovered card (or drag it onto the waste); tap the stock to draw.
Keyboard: ←/→ card, Enter play, D draw, U undo, H hint, N new deal.

## Graphics and audio

The shared card art on felt: three peaks of overlapping cards (played cards leave no slot), the
stock and waste centered below. A chime for each play, a flick for draws, a fanfare on clearing.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `tripeaks` v`1.0.0`: one seat, hidden information
(observation masks covered cards and the stock), move strings, return 1 when cleared or the share
cleared.

## Testing criteria

Shared up-or-down tests: both layouts and their free cards, wrap rules, golf scoring and the stuck
loss, TriPeaks run scoring, the direct legality check matching the move list over random games,
replay validation, the masked view, a planned chain, the contract suite. Module: layout and face-down
cards, single-tap plays (deal 1, ace on king), the planner beating the greedy player; UI (tap plays,
a run, a refused card, draw, undo); e2e desktop + mobile.
