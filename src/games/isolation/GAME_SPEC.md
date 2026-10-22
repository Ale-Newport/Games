# #039 Isolation — Game Specification

## Ruleset (`isolation-7x7-king`)

- A 7×7 board of tiles and one pawn each: **Gold** (seat 0) starts on d1 and moves first, **Jade**
  (seat 1) starts on d7.
- A turn has two steps: **move** your pawn one cell in any of the eight directions onto a free tile
  (present and not occupied), then **remove** any free tile (the one just left included).
- A player who cannot move at the start of their turn loses. Tiles only disappear, so the game
  always ends; there are no draws (no "Agree draw" button).

## States and actions

`IsolationState`: `tiles` (1 present / 0 removed), `pawns`, `toMove`, `phase` (`move` or
`remove`), `history`, `result`, validated by replay. Actions: `m38` (step to cell 38) and `x10`
(remove cell 10); every turn is exactly two actions, so the mover of action k is ⌊k/2⌋ mod 2.
Undo against the computer steps back one of your own actions at a time.

## Modes and difficulty

vs Computer (Gold or Jade), Two Players, Watch AI. Generic alpha-beta (one ply = one action) with a
transposition table; steps toward open space and removals next to the opponent first; evaluation =
own free steps ×3 minus the opponent's ×4, plus half the two-step areas' difference.

| Level  | Search                                                  |
| ------ | ------------------------------------------------------- |
| Easy   | 2 actions (its own turn); random action 25% of the time |
| Medium | 6 actions (three turns)                                 |
| Hard   | Iterative deepening for about 1 s                       |

Measured during tuning (seeded, seats alternated, 10–12 games per pair): a 4-action search lost
4–8 to a 2-action one (it stops at the opponent's reply and misjudges), while 6 actions beat 2 and
4 actions 12–0 — so Medium uses 6. With the shipped presets (8 games per pair): Easy vs Random
8–0, Medium vs Easy 7–1, Hard vs Medium 7–1.

## Achievements

| id                         | Condition                         |
| -------------------------- | --------------------------------- |
| `first-win`                | Win against the computer.         |
| `beat-medium`, `beat-hard` | Beat each level.                  |
| `quick-trap`               | Win with more than 24 tiles left. |
| `hot-seat`                 | Finish a two-player game.         |

## Controls

Step 1: tap one of the tiles marked with a dot. Step 2: tap any free tile to remove it (it turns
red under the pointer). Keyboard: arrows move the cursor, Enter acts; `U`/`H`/`R`/`N`. A status line
names the current step; a counter shows each pawn's free steps.

## Graphics and audio

Raised slate tiles over a dark void, sunken holes where tiles were removed, original gem pawns
that hop when they move, the last removal and the hint highlighted. Step and removal sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `isolation` v`1.0.0`; codec: step t → t, remove t → 49 + t
(`actionSpaceSize` 98); tensor `[3, 7, 7]` (tiles, own pawn, opponent pawn). Agents `random`,
`easy`, `medium`, `hard`.

## Testing criteria

Opening steps, removal choices (vacated tile allowed, pawns' tiles not), turn order of the two-step
turns, isolation loss, codec, strength ordering (seeded), undo against the computer, save round trip
and tamper rejection, contract suite, UI (step, removal, status line, counter), e2e desktop + mobile.
