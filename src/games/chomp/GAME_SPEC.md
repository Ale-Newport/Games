# #045 Chomp — Game Specification

## Ruleset (`chomp-poison-corner`)

- A chocolate bar of **4×5, 4×7, 5×6, 5×8 or 6×7** squares (rows × columns) is drawn per round
  (the AI environment draws it from its seed); its top-left square is **poisoned**. The first
  player alternates between rounds.
- A move picks a remaining square and eats it **with every square below and to its right**.
- The poisoned square cannot be picked; whoever has to eat it loses, so a move that leaves only the
  poison wins at once. Every bite removes squares, so the game always ends; there are no draws.
- Theory (used to test the solver): the first player wins every bar larger than 1 × 1 (strategy
  stealing); on square bars biting at (1, 1) wins; on two rows the winning bite leaves the top row
  one square longer.

## States and actions

`ChompState`: `size`, `rows` (row lengths, non-increasing), `first`, `toMove`, `history`,
`result`, validated by replay (sizes restricted to the list above). Actions: `r,c` (row, column
from the top-left, 0-based). Restart keeps the bar; a new round draws another size.

## Modes and difficulty

vs Computer, Two Players, Watch AI. Exact memoized solver over bar shapes (at most 3 003 shapes for
6 × 8).

| Level  | Play                                                         |
| ------ | ------------------------------------------------------------ |
| Easy   | Winning bite 30% of the time, otherwise random               |
| Medium | Winning bite 75% of the time                                 |
| Hard   | Always a winning bite; when lost, the smallest bite possible |

Measured (seeded bars, seats alternated, 40 games per pair): Easy vs Random 27–13, Medium vs Easy
31–9, Hard vs Medium 36–4. A test checks that Hard always wins when it moves first.

## Achievements

| id                         | Condition                           |
| -------------------------- | ----------------------------------- |
| `first-win`                | Win against the computer.           |
| `beat-medium`, `beat-hard` | Beat each level.                    |
| `big-bar`                  | Win on a bar of 42 squares or more. |
| `hot-seat`                 | Finish a two-player game.           |

## Controls

Tap a square to preview the bite (the squares that would go are lifted); tap again or press
“Eat n” to confirm. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`. Squares are named A1… (column
letter, row number from the top).

## Graphics and audio

A chocolate bar with bevelled squares, a green poisoned corner with an original drop mark, eaten
squares left as faint crumbs, the bite preview and the hint outlined. Crunch sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `chomp` v`1.0.0`; codec: r·8 + c (`actionSpaceSize` 48);
tensor `[6, 8]` (1 where a square remains). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Bite geometry, poison rule, replay validation and size whitelist, codec, solver vs theory
(rectangles, squares, two rows, symmetric L), Hard always wins first, strength ordering (seeded),
save round trip and tamper rejection, contract suite, UI (poison refused, preview, eat), e2e
desktop + mobile.
