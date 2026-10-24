# #067 Game of the Amazons — Game Specification

## Ruleset (`amazons-10x10`)

- A 10 × 10 board. White (seat 0) has amazons on a4, d1, g1, j4 and Black on a7, d10, g10, j7.
  Rounds alternate who opens.
- A turn: move one amazon like a chess queen (any distance orthogonally or diagonally over empty
  squares), then shoot an arrow from its new square, also like a queen — it may fly back over or
  onto the square just left. The arrow's square is burned for the rest of the game. Nothing is
  captured.
- The player to move who has no full turn loses; the game cannot be drawn (at most 92 turns).

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Evaluation: the "minimum distance" territory
count — each empty square belongs to the side whose amazons reach it in fewer queen moves (a tie
counts ±0.2 for the side to move), and an amazon with no move counts −2 against its side.

| Level  | Search                                                                         |
| ------ | ------------------------------------------------------------------------------ |
| Easy   | Medium's turn, or a random turn 35% of the time                                |
| Medium | Every turn scored by the territory left after it (full width, one ply)         |
| Hard   | Medium's best 12 turns, each answered by the opponent's best reply (two plies) |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 9–1,
Hard vs Medium 10–0 (Hard averages ~50 ms a turn, at most ~0.35 s). Widening Hard to 30 candidates
was tried and scored only 5–5 against Medium, so it stays at 12.

## States and actions

`AmazonsState` = `board` (100 cells, row by row from the top; 0 empty, 1 White, 2 Black,
3 burned), `toMove`, `first`, `history`, `result` {winner, reason `stuck`}; validated by replay from
`first`. Actions: `"from-to-arrow"` cell indices (2176 at the start).

## Achievements

| id                         | Condition                                |
| -------------------------- | ---------------------------------------- |
| `first-win`                | Win against the computer.                |
| `beat-medium`, `beat-hard` | Beat each level.                         |
| `landslide`                | Win with 20 or more squares still yours. |
| `hot-seat`                 | Finish a two-player game.                |

## Controls

Tap an amazon (movable ones are ringed), then a green dot to move it, then a red dot to shoot. Tap
the moved amazon to choose its square again, or Cancel. Keyboard: arrows move the cursor, Enter
chooses, Esc steps back; `U`/`H`/`R`/`N`. A prompt under the board names the step; the status line
shows how many squares each side reaches first. The board turns for Black.

## Graphics and audio

A wooden checkerboard, ivory and ebony shields with gold crowns, burned squares as dark tiles with
an orange arrow mark that fade in, the last move's squares in gold and the hint dashed in blue. A
short whoosh-and-thud for every shot.

## Save format and AI interface

Shared match envelope (schema 1). Env `amazons` v`1.0.0`; codec: (from·100 + to)·100 + arrow
(`actionSpaceSize` 1 000 000); tensor `[3, 10, 10]` (the observer's amazons, the opponent's, burned
squares). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Engine: the starting position and 2176 opening turns, queen moves blocked by pieces, shooting back
to the square just left, the stuck loss, replay validation with the opener, a unique code for every
turn. Evaluation: queen distances and a symmetric opening. Module: strength ordering (seeded),
alternating opener, save round trip and tamper rejection, contract suite, UI (the three taps,
stepping back and cancelling), e2e desktop + mobile.
