# #046 Kayles — Game Specification

## Ruleset (`kayles-row-10to20`)

- A row of **10 to 20 pins** is drawn per round (the AI environment draws it from its seed); the
  first player alternates between rounds.
- A move knocks down **one standing pin**, or **two standing pins next to each other**. Gaps split
  the row into independent groups.
- Whoever knocks down the last pin **wins**. There are no draws.
- Theory: a group of n pins has Grundy value g(n) = mex{g(a) ⊕ g(b)} over the splits a + b = n − 1
  and a + b = n − 2; a position is lost for the mover exactly when the XOR of its groups' values is 0. Every full row is a first-player win (knock out the middle, then mirror).

## States and actions

`KaylesState`: `pins` (standing or not), `first`, `toMove`, `history`, `result`, validated by
replay. Actions: `7` or `7-8` (0-based positions; the UI numbers pins from 1).

## Modes and difficulty

vs Computer, Two Players, Watch AI. Grundy table up to 20 pins (unit-tested against the published
sequence and against a brute-force search of all 1 024 positions of 10 pins).

| Level  | Play                                                                        |
| ------ | --------------------------------------------------------------------------- |
| Easy   | Winning knock 30% of the time, otherwise random                             |
| Medium | Winning knock 75% of the time                                               |
| Hard   | Always a winning knock; when lost, one pin off the end of the longest group |

Measured (seeded rows, seats alternated, 40 games per pair): Easy vs Random 25–15, Medium vs Easy
34–6, Hard vs Medium 34–6. A test checks that Hard always wins when it moves first.

## Achievements

| id                         | Condition                 |
| -------------------------- | ------------------------- |
| `first-win`                | Win against the computer. |
| `beat-medium`, `beat-hard` | Beat each level.          |
| `full-lane`                | Win on a row of 20 pins.  |
| `hot-seat`                 | Finish a two-player game. |

## Controls

Tap a pin to choose it; tap a standing neighbor to choose both; tap a chosen pin again or press
“Knock down” to confirm. Keyboard: ←/→, Enter, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

A wooden lane with original striped pins; knocked pins topple over and stay faded; choices and the
hint are outlined. Knock sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `kayles` v`1.0.0`; codec: pin i → i, pair i,i+1 → 20 + i
(`actionSpaceSize` 40); tensor `[2, 20]` (standing pins, positions in this row). Agents `random`,
`easy`, `medium`, `hard`.

## Testing criteria

Moves and splits, last pin wins, replay validation, codec, Grundy sequence, brute-force agreement,
Hard always wins first, strength ordering (seeded), save round trip and tamper rejection, contract
suite, UI (single, pair, confirm, gaps break pairs), e2e desktop + mobile.
