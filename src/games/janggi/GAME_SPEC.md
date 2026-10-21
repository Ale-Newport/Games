# #024 Janggi — Game Specification

## Ruleset (`janggi-kja-basic`)

Janggi (Korean chess), basic rules as commonly played under the Korea Janggi Association:

- 9×10 points, no river. **Cho** (seat 0, blue, bottom) moves first; **Han** (seat 1, red, top)
  receives **1.5 points** of compensation in point counts.
- Start: chariots in the corners, guards beside the palace center files, the **general in the
  palace center**, cannons on the third line, five soldiers on the fourth. Each side's horses and
  elephants occupy files b, c, g, h in one of four orders (HEEH, EHEH, HEHE, EHHE); in real play
  each player chooses — here every new round draws both orders at random (shown in the status
  line; _Restart_ keeps them).
- General and guards: one step along the palace lines (orthogonal and the palace diagonals),
  confined to the palace. Horse: one step orthogonally then one diagonally outward, blocked on
  the first point. Elephant: one step orthogonally then two diagonally outward, blocked by a piece
  on either intermediate point. Chariot: rook moves plus slides along the diagonals of either
  palace. Cannon: moves **and** captures only by jumping exactly one piece (the screen) along a
  line or palace diagonal; the screen may not be a cannon and a cannon can never be captured by a
  cannon. Soldier: one step forward or sideways; inside the enemy palace also diagonally forward
  along the palace lines.
- A move may never leave the own general in check; **checkmate wins**. A player may **pass**
  when not in check.
- **Bikjang**: when a move leaves the two generals facing each other on a file with nothing
  between, the opponent must break it; if the reply leaves it standing, the game is decided **on
  points** (chariot 13, cannon 7, horse 5, elephant 3, guard 3, soldier 2; Han +1.5 — so there are
  no ties). Two passes in a row and the 300-ply limit are also decided on points.
- Threefold repetition is a draw, except that a side giving check with every move of the cycle
  loses. Clocks (5+5, 10+10), resignation and agreed draws as in the other board games.

Not implemented (documented): choosing the setup in the menu (drawn at random instead), the
tournament rule variations for declaring bikjang, and repetition rules beyond perpetual check.

## States and actions

`JanggiState`: `startPlacement` (one of the 16 allowed setups — validated), `board`, `toMove`,
`history`, `notation`, `keys`, `checks`, `result` (with `points` when decided on points), validated
by replay. Actions: `from` + `to` (`e1d2`) or `pass`. Notation like xiangqi (`Ke1-d2`, `Cb2xb9`,
`pass`).

## Modes and difficulty

vs Computer (Cho or Han), Two Players, Watch AI. `JanggiSearchAgent`: negamax alpha-beta,
quiescence on captures, transposition table, MVV-LVA + killers, iterative deepening, contempt;
passing is searched as a move (never twice in a row), and a pass after a pass is scored as a win
or loss on points; evaluation = official points ×100 + soldier/horse/chariot activity + Han's 1.5.

| Level  | Search                                          |
| ------ | ----------------------------------------------- |
| Easy   | 1 ply + captures; a random move 30% of the time |
| Medium | 2 plies + captures (500 ms cap)                 |
| Hard   | Iterative deepening to 4 plies (1.2 s cap)      |
| Expert | Iterative deepening, as deep as 2 s allow       |

Measured (seeded, sides alternated, random setups, `jg-match` bench): Easy vs Random 8–0 (on points: Easy passes
back when Random passes while it is ahead), Medium vs Easy 8–0, Hard vs Medium 4–0, Expert vs Hard
4–0 (three mates, one on points).

## Achievements

| id                                        | Condition                                  |
| ----------------------------------------- | ------------------------------------------ |
| `first-win`                               | Win against the computer.                  |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                           |
| `cannon-mate`                             | Checkmate the computer with a cannon move. |
| `on-points`                               | Beat the computer on points.               |
| `hot-seat`                                | Finish a two-player game.                  |

## Controls

Tap a piece, then its destination (dots; rings for captures); the **Pass** button sits below the
board while passing is legal. Keyboard: arrows, Enter/Space, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

Shared point board without the river (continuous files) and with palace diagonals; original
octagonal pieces in blue (Cho) and red (Han) ink, sized by rank (general largest, guards and
soldiers smallest), with Latin letters; status line with both setups, check and bikjang warnings.
Synthesized move, capture, check and pass sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `janggi` v`1.0.0`, ruleset `janggi-kja-basic`;
`reset(seed)` picks setups `seed mod 4` (Cho) and `(seed >> 2) mod 4` (Han); `actionSpaceSize`
8 101 (`from·90 + to`, 8100 = pass); tensor `[14, 10, 9]`; outcome `scores` = points when decided
on points. Agents `random`, `easy`, `medium`, `hard`, `expert`.

## Testing criteria

Start move count (31 + pass, checked by hand for EHEH/EHEH), general's palace diagonals, cannon
screens (non-cannon screen, no cannon capture, no move without a screen), long elephant blocking,
chariot and soldier palace diagonals, checkmate, no pass in check, two passes and bikjang decided
on points (exact point totals), random games end and validate; codec with the pass; setups read
back (Han mirrored) and kept on restart; engine mates and wins material; strength ordering
(seeded); save round trip and rejection of unknown setups; contract suite; UI (setups line,
palace diagonal move, pass); e2e desktop + mobile.
