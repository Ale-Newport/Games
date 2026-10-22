# #040 Dots and Boxes — Game Specification

## Ruleset (`dots-and-boxes-4x4`)

- A 4×4 grid of boxes (5×5 dots, 40 lines). **Orange** (seat 0) draws first, **Blue** (seat 1)
  second.
- A turn draws one undrawn line between two neighboring dots. Completing the fourth side of one box
  (or two at once) claims it and the same player **must draw again**.
- When every line is drawn (all 16 boxes claimed), the player with more boxes wins; 8–8 is a draw.

## States and actions

`DotsState`: `lines` (0 or the drawer's seat + 1), `boxes` (owner or −1), `toMove`, `movers` (who
drew each line), `history`, `scores`, `result`, validated by replay. Actions are line numbers:
horizontal (r, c) → r·4 + c (0–19), vertical (r, c) → 20 + r·5 + c (20–39). The shell's undo and
"who moved" use `movers`, since a player can draw several lines in a row.

## Modes and difficulty

vs Computer (Orange or Blue), Two Players, Watch AI.

| Level  | Play                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| Easy   | Takes any box, else a safe line (gives nothing away), else any line; 15% random lines |
| Medium | Same, but when no safe line is left it gives away the smallest chain                  |
| Hard   | `DotsSearchAgent`: negamax over net boxes for about 1 s (see below)                   |

Hard searches on mutable arrays with a transposition table keyed by the drawn-line mask (the value
is "boxes from here for the side to move", so scores and seats are not part of the key). Captures
do not use up depth. Move set: with a capturable box, take one (captures commute) or play the
double-dealing line that hands the last two boxes of a chain over; otherwise safe lines, or every
line once none is safe. A unit test builds a position with a 4-box chain opened and a 12-box chain
left, where Hard takes two boxes and double-deals (finishing 14–2 instead of 4–12).

Measured (seeded, seats alternated, 10 games per pair): Easy vs Random 10–0, Medium vs Easy 8–2,
Hard vs Medium 10–0.

## Achievements

| id                         | Condition                  |
| -------------------------- | -------------------------- |
| `first-win`                | Win against the computer.  |
| `beat-medium`, `beat-hard` | Beat each level.           |
| `landslide`                | Win with 12 or more boxes. |
| `hot-seat`                 | Finish a two-player game.  |

## Controls

Tap (or click) between two dots to draw that line; wide invisible hit areas make it easy on a
phone. Keyboard: arrows walk through the free lines, Enter draws; Tab also reaches every free
line; `U`/`H`/`R`/`N`. A status line says when a player draws again; boxes with three sides are
outlined in amber.

## Graphics and audio

Paper board with ink dots, lines in each player's color, claimed boxes tinted with the owner's
initial, the last line glowing and the hint dashed. Line and box-closing sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `dots-and-boxes` v`1.0.0`; codec: the line number
(`actionSpaceSize` 40); tensor `[3, 40]` (drawn, drawn by the observer, drawn by the opponent);
outcome carries the box counts as scores. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Line/box geometry and names, extra turn after closing, double box with one line, every game ends
with 16 boxes, the double-dealing position, strength ordering (seeded), save round trip and tamper
rejection, contract suite, UI (draw, close, extra-turn status, drawn lines inert), e2e desktop +
mobile.
