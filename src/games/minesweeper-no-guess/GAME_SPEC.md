# #117 No-Guess Minesweeper — Game Specification

## Ruleset (`minesweeper-no-guess`)

The rules of Classic Minesweeper (#116) — Beginner 9×9/10, Intermediate 16×16/40, Expert 16×30/99,
safe first opening with an opened area, flood fill, flags, chords — with one guarantee: every board
can be cleared by deduction from the first opened cell, without ever guessing.

## Boards

After the first opening, layouts are drawn from the game's seed and that cell (deterministic, so a
game replays) and each one is checked by the deduction solver: it opens the first cell's area and
repeatedly applies single-number deductions (a number with all its mines found frees its other
neighbours; one with as many closed neighbours as missing mines has them all as mines), subset
deductions between two numbers, and the global mine count. The first layout it clears completely is
used (up to 3000 tries; in practice a few dozen on Expert).

| Board        | Random layouts the solver clears (Expert, 200 tried) | Generation on first click (avg) | Deduction agent clears (200 boards) |
| ------------ | ---------------------------------------------------- | ------------------------------- | ----------------------------------- |
| Beginner     | —                                                    | 0.1 ms                          | 100%                                |
| Intermediate | —                                                    | 0.8 ms                          | 100%                                |
| Expert       | 9 of 200 (4.5%)                                      | 23 ms                           | 100%                                |

## Modes, play features, controls

As Classic Minesweeper (shared table): new or daily board, resume, watch the AI; tap / long-press /
right-click / Flag mode; chords; mine counter, timer with pause, keyboard cursor; hints that explain
the next deduction and apply it — here a deduction always exists, and if the player is stuck the
hint says the numbers already hold the answer. Expert is turned on narrow screens.

## Computer players

| Agent    | Play                                                       | Boards cleared     | Time per game        |
| -------- | ---------------------------------------------------------- | ------------------ | -------------------- |
| `random` | Opens any closed cell.                                     | 0% / 0% / 0%       | ≤ 19 ms (generation) |
| `logic`  | The deductions (never needs its least-risk fallback here). | 100% / 100% / 100% | 0.3 / 5.4 / 63 ms    |

## States and actions

Shared `MinesState` with `noGuess: true`; save validation regenerates the layout from the seed and
first cell with the same no-guess search. Environment actions `r:cell`; the observation hides the
mines until the end.

## Achievements

| id                 | Condition                                              |
| ------------------ | ------------------------------------------------------ |
| `first`            | Clear a board.                                         |
| `speed`            | Clear Beginner in under 45 seconds.                    |
| `win-intermediate` | Clear Intermediate.                                    |
| `win-expert`       | Clear Expert.                                          |
| `no-flags`         | Clear a board without placing a flag or taking a hint. |

## Graphics and audio

The shared minesweeper look and sounds.

## Save format and AI interface

Save slot schema 1: `{ state }`. Env `minesweeper-no-guess` v`1.0.0`: kind `puzzle`, one seat, hidden
information, config `{ difficulty }`, one board per episode; return 1 when cleared, 0 when a mine
goes off.

## Testing criteria

The standard boards with 99 mines on Expert and its layout cleared by the solver; hidden mines in
the observation; the contract suite; UI: a safe start, flags, and the board cleared through hints
alone with the result recorded; the shared engine's tests (no-guess boards cleared by hints alone).
E2E desktop + mobile.
