# #116 Classic Minesweeper — Game Specification

## Ruleset (`minesweeper-classic-safe-start`)

- Boards: Beginner 9×9 with 10 mines, Intermediate 16×16 with 40, Expert 16×30 with 99.
- Opening a cell shows how many of its eight neighbours hold mines; a 0 opens its neighbours
  automatically (flood fill). Opening a mine loses; opening every safe cell wins (the mines are then
  flagged).
- The mines are placed after the first opening, never on that cell or its eight neighbours (so the
  first click always opens an area), from the game's seed and the first cell — a game replays
  exactly. The numbers may leave a guess.
- Flags are notes: a flagged cell cannot be opened by a tap. Opening ("chording") a number whose
  flag count equals it opens all its other neighbours (a wrong flag can make that lose).

## Modes

New game or today's board at each size, resume, and watching the deduction AI play. Statistics key:
the board; a cleared board is a completion with its time (best time kept), a loss a failure.

## Play features

Tap to open (or chord on a number); long-press (420 ms), right-click or the Flag mode to flag. A mine
counter (mines minus flags), a timer that starts with the first opening and pauses, a restart face,
keyboard play with a cursor, and hints: wrong flags first; otherwise the next deduction with its
reason — a single number ("The 1 at R9C11 has exactly as many closed neighbours as missing mines:
they are all mines."), a pair of numbers (subset reasoning), or the mine count — applied on request
(flags for mines, openings for safe cells); when nothing is certain, the least risky cell with an
estimated risk. Expert is turned to 30×16 on narrow screens (display only).

## Computer players

| Agent    | Play                                                                                  | Boards cleared (300 per size) | Time per game     |
| -------- | ------------------------------------------------------------------------------------- | ----------------------------- | ----------------- |
| `random` | Opens any closed cell.                                                                | 0% / 0% / 0%                  | ≤ 0.1 ms          |
| `logic`  | Deductions (single numbers, number pairs, the mine count); else the least risky cell. | 93.3% / 81.7% / 26.7%         | 0.2 / 4.3 / 24 ms |

Risk is estimated per cell as the worst ratio "mines still needed / closed neighbours" among the
numbers touching it, or the overall density for cells away from the numbers.

## States and actions

`MinesState` = `difficulty`, `seed`, `rows`, `cols`, `mineCount`, `noGuess`, `first` (first opened
cell), `mines` (empty until the first opening), `revealed`, `flags`, `status` (ready, playing, won,
lost), `exploded`, `moves`, `hints`, `elapsedMs`. Save validation regenerates the layout from the seed
and first cell. Environment actions `r:cell` (open a closed cell); the observation hides the mines
until the game ends (hidden information).

## Achievements

| id                 | Condition                             |
| ------------------ | ------------------------------------- |
| `first`            | Clear a board.                        |
| `speed`            | Clear Beginner in under 30 seconds.   |
| `win-intermediate` | Clear Intermediate.                   |
| `win-expert`       | Clear Expert.                         |
| `no-flags`         | Clear a board without placing a flag. |

## Controls

Tap/long-press/right-click as above. Keyboard: arrows move, Space/Enter open, F flag, H hint, N new
game, P pause.

## Graphics and audio

Raised closed tiles, flat open cells with the classic number colours (adapted to both themes),
flags and mines drawn with icons, the exploded mine in red, wrong flags crossed out after a loss;
synthesized click, cascade, flag, boom and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state }`. Env `minesweeper` v`1.0.0`: kind `puzzle`, one seat, hidden
information, config `{ difficulty }`, one board per episode; return 1 when cleared, 0 when a mine
goes off; score = safe cells opened.

## Testing criteria

Shared: placement after the first opening and away from it, deterministic layouts, flags, chords,
losing, winning (auto-flags), deductions (single, count), no-guess boards cleared by hints alone,
save validation, the deduction agent clearing most Beginner boards. Game: the standard boards,
hidden mines in the observation, the contract suite. UI: a safe start, long-press and right-click
flags, hints played to the end with the result recorded. E2E desktop + mobile.
