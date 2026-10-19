# #001 Tic-Tac-Toe 3×3 — Game Specification

## Ruleset (`classic-3x3`)

- Board: 3×3 grid, initially empty. Two players: **X** (seat 0) and **O** (seat 1).
- Players alternate placing their own mark in any empty cell. Marks never move or get removed.
- The first player to complete a straight line of three of their marks — any row, column or
  either diagonal (8 lines) — wins immediately.
- If all nine cells are filled and nobody has a line, the game is a **draw**.
- Convention: X moves first. In a match, the platform can alternate which mark starts each round
  (a common house rule, off by default only in the AI adapter's default config).
- No other rules (no swap, no misère). Misère and 4×4 are separate catalog games (#004, #002).

## Game states

| State        | Description                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------- |
| `menu`       | Mode setup: vs Computer / Two Players / Watch AI; options; resume saved match                |
| `playing`    | A round in progress; `board[9]` (0 empty, 1 X, 2 O), `toMove`, move `history`, `firstPlayer` |
| `round-over` | Win (winner + winning line) or draw; result overlay, scores updated                          |

Match state: setup, round state, round number, scores `{x, o, draws}`.

## Actions

- `place(cell)` with `cell ∈ 0..8` (row-major). Legal iff the round is not over and the cell is empty.
- UI-only actions: undo (vs computer: removes the human's last move and the computer's reply;
  two players: removes the last move), restart round, next round, new match, hint.

## Scoring and statistics

- Match scoreboard: wins for X, wins for O, draws.
- Profile statistics (`recordResult`) per round: vs computer → win/loss/draw with mode
  `vs-ai:<difficulty>`; two players → `complete` or `draw` with mode `local`. Watch mode records
  nothing.

## Modes and difficulty

| Mode        | Details                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| vs Computer | Choose your mark (X or O) and difficulty.                               |
| Two Players | Hot-seat on one device, editable player names.                          |
| Watch AI    | Pick an agent for X and for O, speed, pause/step; rounds auto-continue. |

Computer opponents (implemented with the generic agents in `src/ai/agents`, configured in `ai.ts`):

- **Easy** — looks two plies ahead (takes immediate wins, blocks immediate losses) but plays a
  random move 60% of the time.
- **Medium** — same two-ply search, random move 15% of the time. Does not see forks.
- **Perfect** — full-depth alpha-beta search; never loses. Chooses uniformly among optimal moves
  and prefers faster wins / slower losses.

Option: _Alternate who starts each round_ (default on in vs Computer and Two Players).

## Levels / progression

None (single-board game). Progression is via achievements and per-difficulty statistics.

## Achievements

| id               | Condition                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `first-win`      | Win a round against the computer (any difficulty).                                          |
| `beat-medium`    | Win a round against Medium.                                                                 |
| `perfect-draw`   | Draw a round against Perfect.                                                               |
| `fork-master`    | Win a round (not Watch mode) by first creating a fork: two different winning cells at once. |
| `three-move-win` | Win with your third mark (the fewest possible).                                             |
| `hot-seat`       | Finish a two-player round.                                                                  |

## Controls

- Mouse / touch: click or tap a cell.
- Keyboard: arrow keys or WASD move the cursor; Enter/Space place; digits 1–9 place directly
  using numeric-keypad layout (7 8 9 = top row); `U` undo; `H` hint; `R` restart round;
  `N` next round (when the round is over).

## Graphics

Inline SVG board with rounded grid strokes; X and O drawn as animated strokes
(`stroke-dashoffset`); winning line drawn across the board; last move and keyboard cursor
highlighted; hint pulse. Player colors from `--player-1/2` tokens (colorblind palette available),
X and O are distinct shapes regardless of color. Reduced motion disables drawing animations.

## Audio (synthesized, `audio.ts`)

Place X (bright pluck), place O (rounder lower pluck), win (rising arpeggio), loss (falling
tones), draw (two neutral tones), invalid (short low buzz), hint (soft chime).

## Save format (`schema 1`)

`{ setup, round: { board, toMove, history, firstPlayer }, roundNumber, scores, recorded }`
saved after every move in vs Computer and Two Players; validated on load (board length 9, values
0–2, history consistent with board). Watch mode is not saved. Starting a new match clears it.

## AI interface (`ai-adapter.ts`)

- Env id `tic-tac-toe`, version `1.0.0`, ruleset `classic-3x3`, kind `turn-based`, 2 players,
  deterministic, perfect information, zero-sum.
- State: `{ board: number[9], toMove: 0|1, history: number[], firstPlayer, result }`.
- Action: cell index 0–8 (`actionSpaceSize = 9`, `encodeAction` = identity).
- Observation: full state (perfect information). Tensor `[3, 3, 3]`: plane 0 = current player's
  marks, plane 1 = opponent's marks, plane 2 = all ones if X to move.
- Outcome returns: win +1 / loss −1 / draw 0; reason `line` or `board-full`.
- Config: `{ firstPlayer?: 0 | 1 }`.
- Agents: `random`, `easy`, `medium`, `perfect` (exact oracle).

## Testing criteria

- Rules: all 8 lines detected; draw on full board; no moves after terminal; illegal moves rejected;
  `firstPlayer` respected; undo correctness.
- Exhaustive: enumerate every reachable position (5,478) and verify terminal classification;
  perfect agent never loses to any opponent strategy (exhaustive check over all opponent replies).
- Known theory: perfect vs perfect is always a draw.
- Adapter contract suite (random playouts, serialization, replay, illegal actions, encoding).
- Save validation rejects corrupted data.
- UI (jsdom): clicking cells places marks, win overlay, undo, keyboard input.
- Playwright: direct URL load, full round vs computer, two-player win, mobile viewport.
