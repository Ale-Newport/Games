# #012 English Checkers — Game Specification

## Ruleset (`english-wcdf`)

English draughts / American checkers as played under World Checkers/Draughts Federation rules:

- 8×8 board, play on the 32 dark squares; each player has 12 men on the dark squares of their
  first three rows. **Black** (seat 0, bottom) moves first, **White** (seat 1) second.
- Men move one square diagonally forward. Kings move one square diagonally forward or backward
  (no flying kings).
- **Captures are compulsory.** A capture jumps an adjacent enemy piece diagonally into the empty
  square beyond; men capture forward only, kings in all four directions. A capture must be
  continued while further jumps are available (a multi-jump is one move), but when several capture
  sequences exist the player may choose **any** of them (no majority rule).
- A man reaching the far row is crowned a king. If it gets there by capturing, the move ends there
  (it may not continue jumping as a king in the same move).
- Captured pieces are removed when the move ends; a piece cannot be jumped twice.
- The player who cannot move (no pieces or all blocked) **loses**.
- Draws: **threefold repetition** of the same position with the same player to move, or the
  **40-move rule** (80 plies without a capture or a man move).

Not implemented (documented): the tournament "three-move ballot" openings and draw offers by
agreement (players can use Restart instead).

## States and actions

Shared draughts engine (`src/games/shared/draughts/`, variant `ENGLISH`): `board[64]` (0 empty,
1/2 Black man/king, 3/4 White man/king), `toMove`, `history` (move paths), `noProgress`,
`recent` position keys, `result`. An action is the full path `[from, …, to]` of square indices.

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. Levels (generic `AlphaBetaAgent`, material /
advancement / back-rank / center evaluation, captures ordered first):

| Level  | Agent                                            |
| ------ | ------------------------------------------------ |
| Easy   | 2 plies; random move 30% of the time             |
| Medium | 4 plies, transposition table                     |
| Hard   | Iterative deepening up to 14 plies within 700 ms |

Measured (seeded, 5% randomness on searched levels for variety): Easy vs Random 10–0, Medium vs
Easy 9–1–0, Hard vs Medium 7–1–0 (avg 523 ms).

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `crowned` (crown a king), `triple-jump` (capture three or
more pieces in one move), `hot-seat`.

## Controls

Click/tap a piece that can move (outlined), then the highlighted destination; for multi-jumps,
click each landing square in turn. Keyboard: arrows, Enter/Space to select/step, Esc to cancel the
selection, `U`/`H`/`R`/`N`.

## Graphics and audio

Wooden board with frame, turned wooden pieces (dark and cream) with crowns for kings, movable
pieces outlined, landing targets pulsing, pieces about to be captured fade as the path is entered,
last move outlined; live piece counts; slide / capture / crowning sounds.

## Save format and AI interface

Shared two-player match envelope; validated by replay. Env `english-checkers` v`1.0.0`, ruleset
`english-wcdf`; actions are paths (no fixed action space), observation tensor `[4, 8, 8]` (own men,
own kings, opponent men, opponent kings); notation uses squares 1–32. Agents `random`, `easy`,
`medium`, `hard`.

## Testing criteria

Hand-built positions for compulsory capture with free choice of sequence, multi-jumps, no backward
man captures, crowning ending the move, king steps, loss with no moves, threefold repetition and the
40-move rule (shared tests); randomized complete games with replay validation; contract suite;
strength ordering; UI step-by-step multi-jump entry; e2e.
