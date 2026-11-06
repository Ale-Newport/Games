# #020 Gardner Minichess — Game Specification

## Ruleset (`gardner-5x5`)

Martin Gardner's 5×5 minichess (1969):

- 5×5 board, files a–e, ranks 1–5. Each side has, from a to e on its first rank, **rook, knight,
  bishop, queen, king**, and five pawns on its second rank (`rnbqk/ppppp/5/PPPPP/RNBQK`). White
  moves first.
- Pieces move as in chess. Pawns move **one square only** (no double step, hence no en passant) and
  promote on the last rank to a queen, rook, bishop or knight. There is **no castling**.
- Checkmate wins; stalemate, threefold repetition, the fifty-move rule and dead positions draw;
  clocks, resignation and agreed draws as in #015.
- The game is known to be a draw with perfect play (solved by Mhalla and Prost, 2013); no level
  here plays perfectly.

## States and actions

Shared engine `src/games/shared/chess/` (variant `GARDNER`, `width`/`height` 5). Actions as in
#015 with 5×5 square names (`b1c3`, `a4a5q`).

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. The shared `ChessSearchAgent` (no 8×8
piece-square tables here: a centrality term instead), tuned deeper for the small board:

| Level  | Search                                                |
| ------ | ----------------------------------------------------- |
| Easy   | 1 ply + captures; a random legal move 30% of the time |
| Medium | 3 plies + captures (400 ms cap)                       |
| Hard   | Iterative deepening to 6 plies (900 ms cap)           |
| Expert | Iterative deepening, as deep as 1.6 s allow           |

Measured (seeded, colors alternated, `chess-match` bench with these presets): Easy vs Random 6–0–2 (Easy
stalemated Random twice), Medium vs Easy 8–0, Hard vs Medium 2–0–4 (three fifty-move draws, one
repetition — small-board endings are drawish), Expert vs Hard 6–0.

## Achievements

| id                                        | Condition                                           |
| ----------------------------------------- | --------------------------------------------------- |
| `first-win`                               | Win against the computer.                           |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                    |
| `hold-expert`                             | Draw against Expert.                                |
| `quick-mate`                              | Checkmate the computer in at most 10 of your moves. |
| `hot-seat`                                | Finish a two-player game.                           |

## Controls

As #015 (no castling).

## Graphics and audio

Shared chess board at 5×5 with coordinates a–e / 1–5 and the original piece set; badge "5×5".

## Save format and AI interface

Shared match envelope (schema 1). Env `gardner-minichess` v`1.0.0`, ruleset `gardner-5x5`;
`actionSpaceSize` 3 752, tensor `[12, 5, 5]`; agents `random`, `easy`, `medium`, `hard`,
`expert`.

## Testing criteria

Start position and its seven moves (no double step, no castling), promotion on the fifth rank,
the engine finds a back-rank mate, perft-style random games in the shared tests, strength ordering
(seeded), save round trip and tamper rejection, contract suite, UI (25 squares, no double step,
SAN), e2e desktop + mobile.
