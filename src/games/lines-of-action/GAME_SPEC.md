# #068 Lines of Action — Game Specification

## Ruleset (`loa-8x8`)

- An 8 × 8 board. Black (seat 0) has twelve pieces on the top and bottom rows and White twelve on
  the left and right columns, corners empty. **Black moves first.**
- A piece moves in a straight line (orthogonal or diagonal) **exactly** as many squares as there are
  pieces of either color on that whole line. It may pass over its own pieces but not the
  opponent's; it may land on an opponent's piece (capturing it) but not on its own.
- You **win** when all your pieces form a single group (8-connected). A move that connects both
  sides wins for the mover; a capture that leaves the opponent connected wins for them. A player
  with no legal move loses; after **300 plies** the game is drawn.

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. Generic alpha-beta with a transposition table
and capture-first, center-first move ordering. Evaluation per side: how much the pieces' spread
around their center of mass exceeds the tightest possible blob, minus 1.5 per extra group, plus
small bonuses for central squares and mobility; difference squashed with tanh.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 2 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 9–1,
Hard vs Medium 10–0.

## States and actions

`LoaState` = `board` (64 cells, row by row from the top; 0 empty, 1 Black, 2 White), `toMove`,
`history`, `result` {winner, reason `connected` | `stuck` | `limit`}; validated by replay.
Actions: `"from-to"` cell indices (36 at the start, the standard count).

## Achievements

| id                         | Condition                          |
| -------------------------- | ---------------------------------- |
| `first-win`                | Win against the computer.          |
| `beat-medium`, `beat-hard` | Beat each level.                   |
| `unbroken`                 | Win without losing a single piece. |
| `hot-seat`                 | Finish a two-player game.          |

## Controls

Tap one of your pieces (movable ones are ringed), then a green dot to move or a red ring to
capture. Keyboard: arrows move the cursor, Enter picks / moves, Esc cancels; `U`/`H`/`R`/`N`. The
status line counts each side's groups. The board turns for White.

## Graphics and audio

A sage-green checkerboard, black and white stones with an inner ring, the last move's squares in
gold joined by a dashed trail, the hint dashed in blue. A slide tone, and a thud for captures.

## Save format and AI interface

Shared match envelope (schema 1). Env `lines-of-action` v`1.0.0`; codec: from·64 + to
(`actionSpaceSize` 4096); tensor `[2, 8, 8]` (the observer's pieces, then the opponent's). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Engine: the setup and the 36 opening moves (b8's three targets), blocked by enemy pieces, captures
by landing and the opponent winning when left connected, the mover winning a double connection,
replay validation, codec and a symmetric opening evaluation. Module: strength ordering (seeded),
Black first, save round trip and tamper rejection, contract suite, UI (pick and move), e2e desktop

- mobile.
