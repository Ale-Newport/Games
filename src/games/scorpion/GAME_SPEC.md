# #081 Scorpion — Game Specification

## Ruleset (`scorpion-classic`)

- One deck shuffled from a deal number (`?deal=N`). Seven columns of seven cards; in the first four
  the bottom three are face down. Three cards stay in reserve.
- Build down in the **same suit**. **Any face-up card moves with every card on top of it**, in
  sequence or not. An empty column takes only a king (moving a whole column into an empty one is
  not offered).
- Dealing puts the three reserve cards face up on the first three columns (once).
- A complete king-to-ace run of one suit on top of a column leaves the table; a face-down card left
  on top turns up by itself. There are no foundations.
- **Won** with all four runs removed; **lost** when no move is left, or after 1000 moves. The score
  shown is the cards removed.

## Modes

Play (undo, hints) and Watch AI. Statistics key `scorpion` (wins, losses, best time, streaks). The
stats row shows the reserve left.

## Computer players

The agents never peek at face-down cards or the reserve (masked view). Same agents as #080: the
planner's progress also counts cards resting on their own suit, since runs are what Scorpion builds.

Measured on deals 1–30: the planner solved **2** (average share removed 0.13), the greedy player 1
(0.12), the random player 0 (0.03). Scorpion is a hard patience, and the agents cannot see the cards
that decide it.

## States and actions

Shared `ColumnsState` (see #080). Moves: `deal`, `c3:5>c7`.

## Achievements

| id           | Condition                                             |
| ------------ | ----------------------------------------------------- |
| `first-win`  | Solve a deal.                                         |
| `no-reserve` | Solve a deal without dealing the three reserve cards. |
| `clean`      | Solve a deal without undo or hints.                   |

## Controls

Tap a card (it and everything on it), then the column to move it to, or tap it twice to send it to
its best spot. Cards can be dragged. Tap the stock to deal the reserve. Keyboard: ←/→ pile, ↑/↓
card, Enter pick / drop, D deal, A auto-move, U undo, H hint, N new deal.

## Graphics and audio

The shared card art on felt: the reserve on the left, four "K" slots that fill with the kings of
completed runs, seven fanned columns. Card sounds (a chime when a run completes) and a fanfare.

## Save format and AI interface

Save slot schema 1, validated by replay. Env `scorpion` v`1.0.0`: one seat, hidden information,
move strings, return 1 when solved or the share removed.

## Testing criteria

Shared column tests (see #080: suit building, run removal and the reserve deal). Module: layout and
reserve, suit building (deal 1), the planner against random play, contract; UI (two-tap build, the
reserve deal, undo); e2e desktop + mobile.
