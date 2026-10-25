# #082 Forty Thieves — Game Specification

## Ruleset (`forty-thieves-single-pass`)

- Two decks shuffled from a deal number (`?deal=N`). Ten columns of four face-up cards; the other
  64 cards form the stock.
- Build down in the **same suit**, one rank lower; only **one card moves at a time**. An empty
  column takes any card.
- Drawing turns the stock's top card onto the waste; only the waste's top card plays. The stock is
  gone through **once** (no redeal).
- Eight foundations built up by suit from the ace (an ace may start any empty one); cards home stay
  home.
- **Won** with all 104 cards home; **lost** when no move is left, or after 1500 moves. The score
  shown is the cards home.

## Modes

Play (undo, hints, automatic finish once the stock and waste are empty) and Watch AI. Statistics
key `forty-thieves` (wins, losses, best time, streaks). The stats row shows the stock left.

## Computer players

The agents never peek at the stock (masked view). Same agents as #080, with cards resting on their
own suit counted as progress.

Measured on deals 1–20: the planner solved **2** (average share home 0.40), the greedy player 0
(0.32), the random player 0 (0.17). Forty Thieves is famously hard to win.

## States and actions

Shared `ColumnsState` (see #080). Moves: `deal` (turn the stock), `c3:2>c7` (always the top card),
`c3>f2`, `w>c3`, `w>f1`.

## Achievements

| id          | Condition                                   |
| ----------- | ------------------------------------------- |
| `first-win` | Solve a deal.                               |
| `early`     | Solve a deal with cards still in the stock. |
| `clean`     | Solve a deal without undo or hints.         |

## Controls

Tap a card, then where it goes, or tap it twice to send it to its best spot (home first). Cards can
be dragged. Tap the stock to draw. Keyboard: ←/→ pile, Enter pick / drop, D draw, A auto-move,
U undo, H hint, F finish, N new deal.

## Graphics and audio

The shared card art on felt: stock and waste top left, eight foundations, ten fanned columns that
compress to fit. Card sounds and a fanfare.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `forty-thieves` v`1.0.0`: one seat, hidden information
(the stock), move strings, return 1 when solved or the share home.

## Testing criteria

Shared column tests (see #080: one-card moves and the single pass). Module: layout and stock, an
in-suit move (deal 2), single-card picking, the planner beating random play, contract; UI (two-tap
move, drawing, undo); e2e desktop + mobile.
