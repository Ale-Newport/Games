# #014 Spanish Checkers — Game Specification

## Ruleset (`spanish-damas`)

Spanish draughts (_damas españolas_):

- 8×8 board, 12 men each. The board is used rotated relative to English draughts (each player's
  left-hand corner square is the playing color's double corner); in our engine this is the other
  square parity (`playableParity: 0`). **White** (seat 0, bottom) moves first, **Black** second.
- Men move one square diagonally forward and **capture forward only**.
- Kings (_damas_) are **flying**: they move any number of empty squares diagonally and capture at a
  distance, landing on any empty square beyond the captured piece, then continuing.
- **Captures are compulsory.** Precedence (_ley de la cantidad y de la calidad_): the player must
  take the sequence capturing the **most pieces**; among those, the one capturing the **most
  kings**; any remaining tie is a free choice.
- Captured pieces are removed when the move ends (cannot be jumped twice; they block).
- A man reaching the far row is crowned; because men capture forward only, reaching the far row
  always ends the move.
- The player who cannot move loses.
- Draws applied: threefold repetition; 40 moves by each side (80 plies) without a capture or man
  move (documented choice; the federation's specific king-ending counts are not implemented).

## States, actions, AI interface

Shared draughts engine, variant `SPANISH`. Env `spanish-checkers` v`1.0.0`, ruleset
`spanish-damas`, tensor `[4, 8, 8]`, actions are paths. Agents `random`, `easy` (2 plies, 30%
random), `medium` (4 plies), `hard` (iterative deepening to 14 plies, 700 ms).

Measured (seeded, 5% randomness on searched levels): Easy vs Random 10–0, Medium vs Easy 9–0–1,
Hard vs Medium 8–0 (avg 549 ms).

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `crowned`, `king-hunter` (capture an enemy king), `hot-seat`.

## Controls, graphics, audio, saves

As #012 (shared draughts board and shell).

## Testing criteria

Shared tests (opening position on the other parity, quantity-then-quality capture), plus contract
suite, flying-king capture in this variant, strength ordering, UI, e2e.
