# #071 Klondike — Draw One — Game Specification

## Ruleset (`klondike-draw-1-unlimited`)

- One 52-card deck shuffled from a deal number (seeded; any deal can be replayed with `?deal=N`).
  Seven tableau columns get 1…7 cards with only the top card face up; the other 24 form the stock.
- **Tableau**: build down in alternating colors; any face-up run may move; only a king (or a run
  headed by one) may fill an empty column. A face-down card left on top turns up automatically.
- **Foundations**: four piles built up by suit from the ace; an ace may start any empty
  foundation. Foundation cards may move back to the tableau.
- **Stock**: each draw turns **one** card onto the waste; only the waste's top card plays. An empty
  stock is refilled from the waste in order, with **unlimited** passes.
- **Won** when all 52 cards are on the foundations. **Lost** when drawing is the only legal move
  and a whole pass through the stock has gone by with nothing else possible (nothing can ever
  change), or after 1500 moves. Starting another deal with this one unfinished also counts as a
  loss in the statistics.
- **Scoring** (a documented house version of the usual standard scoring, no time bonus): waste →
  column +5, waste or column → foundation +10, turning a column card up +5, foundation → column
  −15, each pass through the stock −100; never below 0.

## Modes

Play (with undo, hints and an automatic finish once every card is face up and the stock is empty)
and Watch AI (the planner plays deal after deal). Statistics key `draw-1`: wins, losses, best score,
best time, streaks.

## Computer players

Single-player environment; the agents are assistants and benchmarks, never peeking at face-down
cards: the planner works on a masked view where face-down tableau cards — and the stock until its
first pass — are unknown placeholders that fit nowhere.

| Agent     | Play                                                                                                                                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Any legal move.                                                                                                                                                                                                                                                                               |
| `greedy`  | Fixed priorities among useful moves: safe cards home, turn cards up, waste to column, draw.                                                                                                                                                                                                   |
| `planner` | Best-first search over every legal move (20 000 nodes; states already met in the game are skipped, so it never loops) toward cards home, cards turned up and empty columns; it replays a winning line once it sees one, and just draws once no line can improve. Used for hints and Watch AI. |

Measured on deals 1–20 (400 ms per move cap): the planner solved **9 of 20** (average return
0.57, i.e. most cards home even when it fails); the greedy player solved 0 of 20 (0.17) and the
random player 0 of 20 (0.14). The greedy player is kept as a simple, honest baseline. Solve rates
are lower than published "thoughtful solitaire" figures because no agent here sees the face-down
cards.

## States and actions

`KlondikeState` = `seed`, `draw`, `stock`, `waste`, `foundations[4]`, `tableau[7]`, `down[7]`
(face-down counts), `history`, `score`, `recycles`, `quiet` (forced draws in a row), `result`;
validated by replaying the history from the seed. Moves: `draw`, `w>f2`, `w>t3`, `t1>f0`,
`t1:4>t5` (column 1 from its card 4), `f0>t3`.

## Achievements

| id          | Condition                                           |
| ----------- | --------------------------------------------------- |
| `first-win` | Solve a deal.                                       |
| `quick`     | Solve a deal in under 4 minutes.                    |
| `clean`     | Solve a deal without undo or hints.                 |
| `one-pass`  | Solve a deal without going through the stock twice. |

## Controls

Tap a card to pick it (it and the cards on it glow), then tap the pile to put it on; tap it again
or double-click to send it to its best spot (foundations first, then non-empty columns). Cards can
also be dragged. Tap the stock to draw. Keyboard: ←/→ pile, ↑/↓ card in a column, Enter pick /
drop, D draw, A auto-move, U undo, H hint, F finish, N new deal.

## Graphics and audio

Original SVG cards: corner indices, classic pip layouts for 2–10, framed court cards with simple
emblems (feather, tiara, crown), a blue patterned back; a four-color deck (blue diamonds, green
clubs) in colorblind mode. A green felt table, dashed slots with A / K / ↺ glyphs, cards sliding to
their new place (off with reduced motion), hint glow. Synthesized slap, flick, draw and chime
sounds; a fanfare on solving.

## Save format and AI interface

Save slot schema 1: `{ state, elapsedMs, undos, hints, recorded }`, validated by replaying the
state. Env `klondike-draw-1` v`1.0.0`: one seat, hidden information (observation = the masked
view), actions are move strings, outcome return 1 for a solved deal or the share of cards brought
home; `evaluateAgents` compares two agents on the same deals.

## Testing criteria

Shared tests: card numbering, names and seeded multi-deck shuffles, card art; the deal; tableau and
foundation building; draw, recycle and scores; runs moving with the uncovered card turning up; the
win; the stuck rule only after a full forced pass; the direct legality check matching the move
list; replay validation; the masked view; the planner finding a winning line; the adapter contract;
single-player evaluation. Module: layout, taps and drops to moves, the automatic finish, move
descriptions, the planner beating the greedy player on seeded deals; UI (tap-tap to a foundation,
draw, undo, the loss on abandoning, dragging, hints and resuming a save); e2e desktop + mobile.
