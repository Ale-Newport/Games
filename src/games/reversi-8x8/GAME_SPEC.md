# #010 Othello / Reversi 8×8 — Game Specification

Public title: **Reversi** (generic name; "Othello" is a trademark). Rules are those of modern
tournament Othello/Reversi.

## Ruleset (`reversi-8x8`)

- 8×8 board. Start position: white discs on d4 and e5, black discs on e4 and d5 (columns a–h left
  to right, rows 1–8 top to bottom). **Black** (seat 0) always moves first; players choose a color.
- A move places a disc of your color on an empty square so that at least one straight line
  (horizontal, vertical or diagonal) of one or more opposing discs is bracketed between the new disc
  and another disc of yours. Every bracketed disc in every direction is flipped.
- A player with no legal move must pass (the pass is an explicit action). Passing is not allowed when
  a legal move exists.
- The game ends when neither player can move (normally a full board). The player with more discs
  wins; equal counts are a draw. Final disc counts are shown (no empty-square award).

## States and actions

Shared Reversi engine (`src/games/shared/reversi/`): `board[64]`, `toMove`, `history` (squares or
the pass action 64), `lastFlipped` (display), `result`. Action space 65 (64 squares + pass).

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. All non-random levels use
`ReversiSearchAgent` (mutable negamax, positional weights with corner-aware X/C squares, mobility,
exact endgame solving maximizing the disc difference):

| Level  | Agent                                                                                  |
| ------ | -------------------------------------------------------------------------------------- |
| Easy   | 1 ply, random move 30% of the time                                                     |
| Medium | 3 plies; exact endgame in the last 6 empties                                           |
| Hard   | Iterative deepening up to 12 plies within 700 ms; exact endgame in the last 12 empties |

Measured (seeded, 5% randomness on searched levels for variety): Easy vs Random 19–0–1, Medium vs
Easy 20–0, Hard vs Medium 16–0 (avg 520 ms, max 732 ms).

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `wipeout` (win leaving the opponent no discs),
`four-corners` (finish owning all four corners), `hot-seat`.

## Controls

Click/tap a square with a legal-move dot. Keyboard: arrows, Enter/Space place, `P` pass (when it is
the only legal action), `U` undo, `H` hint, `R` restart, `N` next round.

## Graphics and audio

Green felt board with wooden frame and coordinates, shaded discs, flip (squash) animation for
flipped discs, placement pop, legal-move dots in the mover's color, last-move marker, hint ring,
Pass bar when no move exists; live disc counts and final count. Clack / multi-flip / pass sounds.

## Save format and AI interface

Shared two-player match envelope; validated by replay. Env `reversi-8x8` v`1.0.0`, ruleset
`reversi-8x8`, actions 0–64 (64 = pass), tensor `[3, 8, 8]` (own, opponent, legal mask); outcome
`scores` = disc counts. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Start position and first moves; flips in all 8 directions; bracketing required; forced pass; end
when neither can move; disc-count result; randomized full games and replay validation; exact
endgame solver agrees with brute force; agent takes an available corner; strength ordering; UI;
e2e.
