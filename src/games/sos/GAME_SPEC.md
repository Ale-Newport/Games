# #050 SOS — Game Specification

## Ruleset (`sos-6x6-extra-turn`)

- A 6×6 grid; **Red** (seat 0) and **Blue** (seat 1) take turns writing an **S** or an **O** in an
  empty cell. The first player alternates between rounds.
- Each new line of three cells reading **S-O-S** through the cell just written (across, down or
  diagonally; an S may finish a line from either end) scores one point for the writer, who then
  **writes again**. One letter can score several lines.
- When the grid is full the higher score wins; equal scores draw.

## States and actions

`SosState`: `cells`, `first`, `toMove`, `movers` (writer of each letter), `history`, `scores`,
`lines` (scored lines with their owner), `result`, validated by replay. Actions: `S14` / `O14`.

## Modes and difficulty

vs Computer, Two Players, Watch AI. A move is _safe_ when it scores nothing and leaves the
opponent no scoring move.

| Level  | Play                                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Easy   | Best scoring move, else a safe move, else anything; random move 25% of the time                                            |
| Medium | Same without slips, and the cheapest sacrifice when nothing is safe                                                        |
| Hard   | Alpha-beta over net points (~1 s): scoring moves free in depth, a reduced move set, and a parity bonus for safe moves left |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 8–0–2,
Hard vs Medium 6–3–1 — Hard is ahead but the margin over Medium is modest.

## Achievements

| id                         | Condition                 |
| -------------------------- | ------------------------- |
| `first-win`                | Win against the computer. |
| `beat-medium`, `beat-hard` | Beat each level.          |
| `wordsmith`                | Win with 8 or more SOS.   |
| `hot-seat`                 | Finish a two-player game. |

## Controls

Choose the letter with the S / O buttons (or keys), then tap an empty cell. Keyboard: arrows, `S`,
`O`, Enter; `U`/`H`/`R`/`N`. A status line says when a player writes again.

## Graphics and audio

A paper grid with serif letters that ink in, scored lines drawn over the letters in the scorer's
color, the last cell and the hint highlighted, a score line. Pen and scoring sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `sos` v`1.0.0`; codec: cell·2 + (0 S, 1 O)
(`actionSpaceSize` 72); tensor `[2, 6, 6]` (S cells, O cells); outcome carries the scores. Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Scoring and the extra turn, several lines from one letter (all four directions, S at either end),
full grid draw, replay validation, codec, strength ordering (seeded), save round trip and tamper
rejection, contract suite, UI (letter picker, scoring, extra-turn status), e2e desktop + mobile.
