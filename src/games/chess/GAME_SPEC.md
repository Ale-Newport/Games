# #015 Chess — Game Specification

## Ruleset (`fide-standard`)

Standard chess under the FIDE Laws of Chess (basic rules and the automatic draw rules):

- 8×8 board, **White** (seat 0) moves first, **Black** (seat 1) second; players choose a color
  (the shell's "alternate who starts" is disabled via `fixedFirstSeat`).
- Usual piece moves; pawns move one square (two from the starting rank), capture diagonally,
  capture **en passant** immediately after an enemy double step, and **promote** on the last rank to
  a queen, rook, bishop or knight.
- **Castling** king- or queenside when neither the king nor that rook has moved, the squares between
  are empty, the king is not in check and does not pass through or land on an attacked square.
- A move may never leave the own king in check. **Checkmate** wins.
- Draws, applied automatically: **stalemate**, **threefold repetition** (same placement, side to
  move, castling rights and a _capturable_ en passant square), the **fifty-move rule** (100 plies
  without a capture or pawn move), and **dead positions** with insufficient material (K v K, K+minor
  v K, and bishops-only positions with every bishop on one square color).
- Optional **clocks** (3+2, 5+0, 10+5, 15+10: minutes per side + increment in seconds). A flag fall
  loses, except when the opponent cannot mate by any sequence of legal moves (no material, or a lone
  minor piece against a bare king) — then it is a draw.
- **Resignation** (vs computer and two players) and **draw by agreement** (two players) end the
  round; both need a confirming second click.

Not implemented (documented): the optional 75-move / fivefold automatic rules (the 50-move and
threefold draws are applied automatically instead of on claim), draw offers to the computer, and
pre-moves.

## States and actions

Shared engine `src/games/shared/chess/` (variant `STANDARD`). Internally a mutable 0x88-style
mailbox `Position` with Zobrist keys, legal move generation and make/unmake; the immutable
`ChessState` stores `startFen`, `fen`, `history` (actions), `san` (moves in SAN), `keys`
(repetition keys since the last irreversible move), `checks` and `result`. Saves and deserialized
states are validated by replaying the history from `startFen` and comparing the whole state.

Actions are strings: coordinate moves `e2e4`, promotions `e7e8q`/`e7e8n`, and `O-O` / `O-O-O`.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. One engine (`ChessSearchAgent`, negamax
alpha-beta with quiescence search, transposition table, MVV-LVA + killer move ordering,
iterative deepening, piece-square tables, endgame king activity and a mop-up term to convert won
endings, repetition awareness from the real game history), four levels:

| Level  | Search                                                   |
| ------ | -------------------------------------------------------- |
| Easy   | 1 ply + captures; a random legal move 30% of the time    |
| Medium | 2 plies + captures (400 ms cap)                          |
| Hard   | Iterative deepening to 4 plies (900 ms cap)              |
| Expert | Iterative deepening, as deep as 1.6 s allow (~5–7 plies) |

On the clock the computer spends at most ~1/30 of its remaining time plus 60% of the increment.

Measured (seeded, colors alternated, `chess-match` bench on the shared engine): Easy vs Random
10–0, Medium vs Easy 10–0, Hard vs Medium 6–0, Expert vs Hard 6–0 (all by checkmate). Speed is
about 250–300k nodes per second in Node on a laptop.

## Achievements

| id                                        | Condition                                                           |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `first-win`                               | Win against the computer.                                           |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                                    |
| `swift-mate`                              | Checkmate the computer in at most 20 of your moves.                 |
| `promoted`                                | Promote a pawn in a game against the computer.                      |
| `on-the-clock`                            | Win a timed game against the computer over the board (not on time). |
| `hot-seat`                                | Finish a two-player game.                                           |

## Controls

Click/tap a piece to show its moves (dots; rings for captures), then the destination; or drag the
piece (mouse, pen or touch). Castling: move the king two squares, or select the king and then its
rook. A promotion asks for the piece. Keyboard: arrows move the cursor, Enter/Space select and
move, Esc cancels; `U` undo (untimed games), `H` hint (Hard), `R` restart, `N` next round.

## Graphics and audio

Original flat piece set (`ChessPieces.tsx`, drawn for this project), slate frame, cream/teal
squares with coordinates, last-move and selection highlights, red glow on a checked king, dashed
hint squares, slide animation (off with reduced motion), drag ghost, captured pieces with material
balance beside each side, horizontally scrolling SAN move list (localized piece letters: K Q R B N
/ R D T A C), clocks in the scoreboard (red under 20 s). Synthesized sounds for move, capture,
castling, check, promotion and the round result.

## Save format and AI interface

Shared two-player match envelope (schema 1) with optional `clock` and `adjudication`. Env `chess`
v`1.0.0`, ruleset `fide-standard`; action encoding `((from·64 + to)·6 + promo)` plus two castling
indices (`actionSpaceSize` 24 578); observation tensor `[12, 8, 8]` (own pawn…king, then the
opponent's; rank 1 first); `stateKey` = FEN without move counters. Agents `random`, `easy`,
`medium`, `hard`, `expert`.

## Testing criteria

Perft on six standard positions (start to depth 4, Kiwipete, positions 3–6) and three Chess960
positions; make/unmake integrity; FEN round trips; SAN (disambiguation, en passant, promotion,
castling, check/mate suffixes); every draw rule; checkmate/stalemate detection; engine finds mates
and wins material, converts K+R v K; strength ordering (seeded); action codec bijective; save
round-trip and tamper rejection; flag fall vs insufficient mating material; contract suite; UI
(targets, castling on the rook, promotion picker, resign confirmation, clock and flag fall); e2e
desktop + mobile.
