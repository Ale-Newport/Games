# #034 Pentago — Game Specification

## Ruleset (`pentago-standard`)

- A 6×6 board made of four 3×3 quadrants (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right).
  **White** (seat 0) moves first.
- A turn: place a marble of your color on an empty hole, then **twist** one quadrant a quarter
  turn clockwise or counter-clockwise (the twist is compulsory).
- **Five in a row** (row, column or diagonal; 32 lines) wins. If the placement already makes five,
  the player wins without twisting. If the twist makes five for both players, or the board fills
  with no five, it is a draw; if the twist makes five only for the opponent, the opponent wins.
- Pentago is known to be a first-player win with perfect play; no level here plays perfectly.

## States and actions

`PentagoState`: `board` (0/1/2, index row·6 + col), `toMove`, `history`, `result` (winner and
line, or draw), validated by replay. Actions: `14:2R` (place on 14, twist quadrant 2 clockwise),
`14:2L` (counter-clockwise), or `14` when the placement wins.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. `PentagoSearchAgent`: negamax alpha-beta on
raw boards; every (place, twist) child is resolved and scored statically (open lines of five,
weighted by marbles), children ordered best-first and limited to a beam below the root; iterative
deepening under a time budget; immediate wins are taken at once.

| Level  | Search                                             |
| ------ | -------------------------------------------------- |
| Easy   | 1 ply (static order); 20% random moves             |
| Medium | 2 plies over the 12 best replies                   |
| Hard   | Iterative deepening, beam 14, about 1.8 s per move |

Measured (seeded, colors alternated, 10/10/8 games): Easy vs Random 10–0, Medium vs Easy 9–1,
Hard vs Medium 3–0–5 (Hard never lost; the draws are full boards or double fives). The first version of the search sorted children worst-first, so the beam
kept only the worst moves (every game ended in nine plies); found by the bench and fixed.

## Achievements

| id                         | Condition                                         |
| -------------------------- | ------------------------------------------------- |
| `first-win`                | Win against the computer.                         |
| `beat-medium`, `beat-hard` | Beat each level.                                  |
| `no-twist-needed`          | Win with a placement that already makes five.     |
| `quick-five`               | Beat the computer in at most seven of your moves. |
| `hot-seat`                 | Finish a two-player game.                         |

## Controls

Tap a hole (the marble appears faded), then one of the twist arrows that appear on every quadrant;
a placement that already wins plays at once. Keyboard: Tab through holes and arrows, Enter
chooses; `U`/`H`/`R`/`N`.

## Graphics and audio

Red quadrants with sunken holes on a dark tray, shaded white and black marbles, last-move ring,
animated quarter turns (off with reduced motion), dashed hint on the suggested hole and quadrant,
winning line outlined in gold. Place and twist sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `pentago` v`1.0.0`; codec: winning placement p → p, place p
then twist t (quadrant·2 + 0 clockwise / 1 counter-clockwise) → 36 + 8p + t (`actionSpaceSize`
324); tensor `[2, 6, 6]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

32 lines, quarter twists in both directions (inverse of each other), win by placement without a
twist, win by a twist, simultaneous five draw, engine takes a win and blocks a four, codec over the
288 opening actions, strength ordering (seeded), save round trip and tamper rejection, contract
suite, UI (place, twist carries the marble), e2e desktop + mobile.
