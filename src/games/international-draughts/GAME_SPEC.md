# #013 International Draughts — Game Specification

## Ruleset (`international-fmjd`)

International draughts as defined by the FMJD:

- 10×10 board, play on the 50 dark squares; each player has 20 men on the first four rows.
  **White** (seat 0, bottom) moves first, **Black** (seat 1) second.
- Men move one square diagonally forward; men **capture forward and backward**.
- Kings are **flying**: they move any number of empty squares along a diagonal, and capture an
  enemy piece at any distance on a diagonal (all squares before it empty), landing on any empty
  square beyond it; capturing continues from the landing square.
- **Captures are compulsory** and the **majority rule** applies: the player must choose a sequence
  capturing the **maximum number of pieces** (kings and men count the same). Among equal
  sequences the choice is free.
- During a sequence captured pieces stay on the board until it ends (Turkish strike rule): they
  may not be jumped twice and they block further jumps.
- A man is crowned only if it **ends** its move on the far row; passing through it during a capture
  does not crown it.
- The player who cannot move loses.
- Draws: threefold repetition; 25 moves by each player with only kings moving and no capture
  (50 plies without a capture or man move); FMJD endgame counts — three pieces including at least
  one king against a lone king are drawn after 16 moves each, two pieces or fewer (with a king)
  against a lone king after 5 moves each.

Not implemented (documented): draw by agreement, time controls.

## States, actions, AI interface

Shared draughts engine with variant `INTERNATIONAL` (`board[100]`, `toMove`, `history` paths,
`noProgress`, `recent`, `endgamePlies`, `result`). Actions are full paths. Env
`international-draughts` v`1.0.0`, ruleset `international-fmjd`, tensor `[4, 10, 10]`, notation
squares 1–50. Agents `random`, `easy` (2 plies, 30% random), `medium` (4 plies), `hard` (iterative
deepening to 14 plies, 700 ms).

Measured (seeded, 5% randomness on searched levels): Easy vs Random 10–0, Medium vs Easy 10–0,
Hard vs Medium 7–0–1 (avg 622 ms).

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `crowned`, `grand-capture` (capture four or more pieces in
one move), `hot-seat`.

## Controls, graphics, audio, saves

As #012 (shared draughts board): wide side layout on large screens, step-by-step entry of capture
paths (each landing square in turn), flying-king landing choices shown as targets.

## Testing criteria

Shared hand-built tests (backward man captures, majority rule, flying captures with landing
choices, no crowning when passing the far row, FMJD count) plus contract suite, strength ordering,
UI, e2e.
