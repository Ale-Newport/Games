# Progress Journal

Newest entries first. Record only verified facts (tests actually run, games actually played).

## 2026-11-07 — Session 1: #177 Shifting Mazes COMPLETE

- The advanced maze chase on the core shared with #176: four generated mazes changing every two
  levels, sentinels that take a random way at 12 % of junctions, and a bonus gem that comes in
  through the tunnel and wanders the corridors. The runner averaged 8581 points; the grazer 3285.
- Played in headless Chromium (Pixel 7 emulation, Spanish; the in-app pane was hidden): the
  pixel-reading script steered with the real arrow keys through the first maze into level 2, met
  blue sentinels, and lost its last life at 3690 points.
- Verified (actually run): lint, typecheck, 3207 unit tests (404 files), build, 614 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #176 Maze Chase COMPLETE

- A maze chase with an original name, generated maze and art (a rover and four diamond-shaped
  sentinels): seeds, power cells, sentinels that each hunt in their own way along the shortest
  corridors and alternate with scatter spells, eyes going home, a bonus gem, levels that speed up.
  Shares its core with #177. The runner averaged 8494 points and one maze cleared; the grazer 4071.
- Fixed while testing: one maze had a dead end above the house door (the door counted as a way
  out); eyes wandered inside the house instead of going straight to its middle.
- Played in headless Chromium (Pixel 7 emulation, Spanish) — the in-app browser pane was hidden, so
  its game loop would not run: a pixel-reading script steered with the real arrow keys, cleared the
  first maze, met blue sentinels and lost three lives on level 2 (4540 points, Spanish ending).
- Verified (actually run): lint, typecheck, 3197 unit tests (402 files), build, 610 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #175 Falling Blocks Classic COMPLETE

- The 8-bit way on the core shared with #174: a nearly-uniform draw, one piece of preview, no hold,
  soft drop only, no wall kicks, slower auto-repeat, the classic gravity table and scoring; start at
  level 0, 9 or 18. The planner was still playing after 30 minutes from level 0 (about 1120 lines).
- Played in the in-app browser (mobile, Spanish): rotated and moved at level 18 until the well filled
  up. Fixed: the "Level 10" achievement unlocked just by starting at level 18; it now needs the
  level climbed by clearing lines.
- Verified (actually run): lint, typecheck, 3174 unit tests (399 files), build, 606 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #174 Falling Blocks COMPLETE

- A modern falling-blocks game with an original name: seven-piece bags, five pieces of preview,
  hold, ghost piece, hard drop, wall kicks, a lock delay, T-spins, combos and back-to-back bonuses;
  a 150-line marathon and a 40-line sprint. Shares its core with #175. The planner (every rotation
  and column of the current piece, scored on height, holes, wells and bumpiness) finishes the
  marathon; a hard-dropping dropper tops out quickly.
- The arcade shell gained rotate-back (Z) and hold (C) controls and touch buttons.
- Played in the in-app browser (mobile, Spanish): hold, rotate, move and hard drop with the touch
  buttons, then watched the planner reach 31 lines and level 4 in 20 seconds.
- Verified (actually run): lint, typecheck, 3164 unit tests (397 files), build, 602 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #173 Wraparound Snake COMPLETE

- The snake without walls (the edges lead round), on the core shared with #172: a grey block lands
  on the board every five apples, a golden fruit appears now and then for a few seconds, and a
  one-minute sprint mode joins the endless one.
- Played in the in-app browser (mobile, Spanish): a pixel-reading script steered with the real arrow
  keys through two sprints — wrapping over the edges, eight blocks after 44 apples, the golden fruit
  and its achievement, the clock counting down, and a crash into a block at length 47 (1340 points).
- Verified (actually run): lint, typecheck, 3148 unit tests (394 files), build, 598 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #172 Classic Snake COMPLETE

- The classic snake on a 20 × 20 board, with walls: apples grow it and score more as it lengthens, and
  it quickens every four apples (150 ms a cell down to 50). Shares its core with #173. The pathfinder
  (breadth-first search to the apple, kept only if it can still reach its tail) averaged length 105
  and 7145 points; greedy traps itself at length 31.
- Played in the in-app browser (mobile, Spanish): a pixel-reading script steered with the real arrow
  keys to 15 apples, then crashes, the achievement toast and the AI watch mode. Fixed in the arcade
  shell: a tap on an on-screen arrow shorter than one step was lost; presses are now kept until the
  next step reads them.
- Verified (actually run): lint, typecheck, 3138 unit tests (392 files), build, 594 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #171 Space Rocks COMPLETE

- A vector space shooter on a wrap-around field with an original name and art: a ship with
  momentum and drag, four short-lived shots, rocks splitting in three sizes, saucers that aim at
  you, hyperspace, extra ships every 10 000. The pilot (leads its shots, thrusts out of collisions,
  jumps only when cornered) averaged 8283 points and 2.7 fields; a spinning turret 2428.
- Watched the AI in the in-app browser (mobile, Spanish): rocks split, the ship drawn on both edges
  as it wraps.
- Verified (actually run): lint, typecheck, 3122 unit tests (389 files), build, 590 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #170 Diving Swarm COMPLETE

- A swarm shooter with an original name and sprites: 36 fliers swaying in formation, looping dives
  that end in a run at your ship with aimed bullets, commanders diving with their guards, double
  points for divers, quicker swarms. The pilot (dodges bullets and divers, hunts divers first)
  averaged 6426 points and nearly three swarms; standing still scores nothing.
- Watched the AI in the in-app browser (mobile, Spanish): a diver coming down firing at the ship.
- Verified (actually run): lint, typecheck, 3108 unit tests, build, 584 of 586 Playwright tests; the two
  failures were this game's stand-still spec on a seed that lasts 87 s (budget 80 s); moved to a seed
  that lasts 31 s and re-run: 4 of 4 Diving Swarm specs green.

## 2026-11-07 — Session 1: #169 Invaders from Above COMPLETE

- A fixed shooter in the classic mould with an original name and pixel sprites: a 55-invader
  formation that quickens as it thins, bombs, eroding shields, a mystery ship, waves starting lower.
  The gunner (dodges bombs, lines up, fires) averaged 4263 points and 3.3 waves; standing still lasts
  22 seconds.
- Played in the in-app browser (mobile, Spanish). Two fixes: bombing was halved after a cannon fell
  four seconds into the game, and the arcade shell no longer lets Space also press the focused
  button (it paused the game); the start button gives up the focus too.
- Verified (actually run): lint, typecheck, 3094 unit tests (385 files), build, 582 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #168 Enhanced Brick Breaker COMPLETE

- Five designed walls on the shared brick core: one-, two- and three-hit bricks (coloured and
  numbered), unbreakable gold blocks, and capsules (wide paddle, multi-ball, slow, laser, extra
  life). The planner averaged 1998 points and cleared all five walls in 33 of 40 runs; the follower
  1658 and none within 15 minutes (its steep rallies are slow, not stuck).
- Watched the AI in the in-app browser (mobile, Spanish): numbered two-hit bricks, a caught extra
  life.
- Verified (actually run): lint, typecheck, 3080 unit tests (383 files), build, 578 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #167 Breakout COMPLETE

- New shared brick core `shared/bricks` (simulation, rule sets, players, drawing) for #167–#168.
  Breakout: the classic eight-row wall played twice with three balls, row points 1/3/5/7, speed-ups
  in the upper rows and the paddle shrinking once a ball reaches the top. Both computer players
  clear the 896 points (the paddle outpaces the ball); a ball that breaks nothing for ten seconds
  is nudged off its loop so that no wall can stall.
- Played in the in-app browser (mobile, Spanish): a launched ball breaking the first bricks.
- Verified (actually run): lint, typecheck, 3070 unit tests (381 files), build, 574 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #166 Pong COMPLETE

- New shared real-time arcade shell `shared/arcade` for #166–#200: a pure simulation contract
  (`ArcadeDef`), a canvas driven by the existing fixed-step loop, held keys, touch buttons and
  pointer steering, pause (also on leaving the tab), restart, HUD, endings with results and
  achievements, a save of an interrupted run, watch mode, and a `real-time` AI environment.
- Pong at 60 Hz against a computer with three skill levels (speed, aiming error, reaction line).
  A follower that tracks the ball's height won 100/87/20 of 100 games against easy/medium/hard; a
  tracker that angles its returns won them all. Hard was first tuned unbeatable (endless rallies)
  and loosened.
- Played in the in-app browser (mobile, Spanish): a game started, the paddle dragged on the field,
  the computer's first point.
- Verified (actually run): lint, typecheck, 3052 unit tests, build, 568 of 570 Playwright tests; the two
  failures were Pong's watch spec waiting 20 s for a point (they take ~26 s), rewritten to check that
  the canvas animates and re-run: 4 of 4 Pong specs green.

## 2026-11-07 — Session 1: #165 Memory Pairs COMPLETE

- Memory Pairs (concentration) on 4 × 4, 4 × 6 and 6 × 6 grids with original faces, solo or against
  a computer that remembers the last 6 or 14 cards turned over, or all of them. Solo on 4 × 4 the
  perfect memory needs 12.4 turns on average, the forgetful one 16.2; perfect beat forgetful in 349
  of 400 games (27 ties).
- The throw duels (#162, #163) now declare their environment kind as `simultaneous`, the documented
  convention for sequential commitment with a hidden pending throw.
- Played in the in-app browser (mobile, Spanish) against the attentive computer: a missed pair, then
  the computer's turn.
- Verified (actually run): lint, typecheck, 3032 unit tests (376 files), build, 566 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #164 Naval Battle COMPLETE

- Naval Battle (generic name, original art): 10 × 10 hidden fleets of 5-4-3-3-2, manual or random
  placement, alternating shots with miss / hit / sunk. The analyst (probability density over the
  placements of the ships still afloat) sinks a fleet in 45.3 shots on average, the hunter
  (checkerboard search, then closing in) in 51.6, random fire in 95.3; analyst beat hunter 203/300.
- Played in the in-app browser (mobile, Spanish): a 5-ship placed across row A, a 4-ship rotated
  upright, a random fleet, a hinted hit on F5 and the computer's reply. Your shot's result now stays
  on screen with the computer's answer after it.
- Verified (actually run): lint, typecheck, 3006 unit tests (374 files), build, 562 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #163 Rock Paper Scissors Lizard Wizard COMPLETE

- The five-throw extension on the shared `shared/throws` core with an original cast (a wizard in
  the fifth place: it melts rock and enchants scissors; paper binds it; the lizard bites it). Each
  throw beats two and loses to two; the mind reader wins 98% of rounds against the counter, 75%
  against the pattern reader and 51% against random throws.
- Played in the in-app browser (mobile, Spanish): a wizard and a lizard, the verbs of both rounds
  shown, the throw counts updating.
- Verified (actually run): lint, typecheck, 2992 unit tests (372 files), build, 558 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #162 Rock Paper Scissors COMPLETE

- New shared core `shared/throws` (duel engine with a hidden pending throw, readers, environment,
  table, original SVG throws) for #162–#163. Readers: coin flip, counter (frequency), pattern
  reader (Markov on two rounds) and a mind reader (an ensemble with second-guessing shifts).
- The first mind reader skipped empty predictors, so its candidates changed places between rounds
  and their scores were mixed up (48% against the pattern reader); with fixed positions it wins 91%
  against the pattern reader, 99% against the counter and 50% against random throws.
- Played in the in-app browser (mobile, Spanish): four rocks in a row, the computer's paper after
  the first, and its revealed read ("its throw beats Rock").
- Verified (actually run): lint, typecheck, 2970 unit tests (370 files), build, 554 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #161 Tile Rummy COMPLETE

- Tile Rummy (generic name, original art): 106 tiles with jokers, plays validated as whole tables,
  the 30-point first play from the own rack, drawing and passing, going out or the blocked end. The
  table is an editable workspace (tap a tile, then a set, "New set" or the rack), with invalid sets
  outlined and hints that lay a play out for you.
- The move generator finds rack sets, table additions and run splits; borrowing table tiles (a run's
  end, any tile of a group of four) raised planner self-play games ending with a player going out
  from 21 to 41 of 50. The planner beat the rack-only basic player in 200 of 200 games.
- Played in the in-app browser (mobile, Spanish): a hinted 52-point first play (7–10 orange and three
  6s), then the computer's draw.
- Verified (actually run): lint, typecheck, 2942 unit tests (367 files), build, 550 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #160 Riichi Mahjong COMPLETE

- Four-player riichi mahjong, an East-only game: walls and dead wall from the seed, chi/pon/kan
  calls decided seat by seat, riichi, furiten, kuikae, dora and ura-dora, 40+ yaku and yakuman, fu
  and han with limits, honba and sticks, exhaustive draws with ready payments. Simplifications are
  listed in the spec (no red fives, no abortive draws, no kans after riichi, head bump).
- Shanten is computed per suit with memoized splits (about 50× faster than the first whole-hand
  search, which made the players too slow for the tests). The careful player folds against riichi
  once it is not ready; that cut its deal-ins from 178 to 136 over 200 games (avg 25 170 points,
  rank 2.50 against three efficient players).
- Played in the in-app browser (mobile, Spanish) through a whole hand on hints: a rival's riichi, an
  exhaustive draw with two ready players paid 1500 each. Fixed: the drawn tile now sits apart at
  the end of the hand, the hand fits one row, and messages name tiles with an article.
- Verified (actually run): lint, typecheck, 2921 unit tests (365 files), build, 546 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #159 Mahjong Solitaire COMPLETE

- Mahjong solitaire on two original layouts (Crossroads, 84 tiles; Pyramid, 144) with original SVG
  tile faces (`shared/mjtiles/Face.tsx`, also for #160). Deals are built solvable by removing free
  pairs from the layout in turn (the tests replay that order to clear every deal), shuffles redeal
  solvably, undo and hints. The strategist, which sees only uncovered faces, cleared 154 of 200
  Crossroads deals without a shuffle (random play: 51) and 189 with shuffles.
- The first deal builder gave a pair's second tile that was only free once the first had gone; both
  are now chosen free together.
- Played in the in-app browser (mobile, Spanish) on the Pyramid: a hinted pair of 1-dots removed, a
  blocked tile refused with its reason.
- Verified (actually run): lint, typecheck, 2895 unit tests (362 files), build, 542 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #158 All Fives Dominoes COMPLETE

- All Fives Dominoes to 150 on the shared domino core: a spinner on the opening double, multiples of
  five scored at once (doubles at an end and a one-sided spinner counting whole), and hand bonuses
  rounded to five. The planner beat the heavy player in 72 of 100 two-player games and won 45 of 100
  four-player games against three heavy players.
- Watched a computer game in the in-app browser (mobile, Spanish): the spinner opened its top arm
  and a 2–2 scored 10. Fixed "1 fichas" on the score chips, and the hand-end check of the domino
  UI tests, which only matched the computer's wording.
- Verified (actually run): lint, typecheck, 2873 unit tests (360 files), build, 538 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #157 Draw Dominoes COMPLETE

- Draw Dominoes to 100 on the shared domino core: seven tiles each for two players, five for three
  or four, drawing until something fits. The planner beat the heavy player in 98 of 100 two-player
  games and won 50 of 100 four-player games against three heavy players.
- Played in the in-app browser (mobile, Spanish): opened with the 6–6, the computer's 6–4, a hinted
  4–4. Fixed the empty-table placeholder that said "Tú está jugando…" on your own opening turn.
- Verified (actually run): lint, typecheck, 2851 unit tests (358 files), build, 534 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #156 Block Dominoes COMPLETE

- New shared domino core `shared/bones` (engine, players, environment, table, SVG tiles) for
  #156–#158: double-six deals fixed by the seed, the opening double, two-arm lines and the all-fives
  spinner, drawing and passing, blocked hands, hidden hands in observations and known voids.
- Block Dominoes to 50: the planner (determinized Monte Carlo over 160 deals consistent with what it
  has seen) beat the heavy player in 88 of 100 two-player games and won 68 of 100 four-player games
  against three heavy players.
- The first heavy player evaluated all-fives plays by applying them to its hidden-hand view, which
  crashed when a play ended the hand; it now scores the layout directly.
- Played in the in-app browser (mobile, Spanish): a hinted 0–3 on a chosen end and the computer's
  reply.
- Verified (actually run): lint, typecheck, 2829 unit tests (356 files), build, 530 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #155 Colour Rows COMPLETE

- Colour Rows (catalog id `qwixx`, original name, art and text): a roll-and-cross game for 1–4 with
  four coloured rows, the white step for everyone and the colour step for the thrower, left-to-right
  crossing, five-cross locks, penalties and triangular row scores. The planner values sheets by
  crosses plus the crosses still expected (weighted by two-dice odds, factor 0.8 tuned over
  0.3–1.2) and plans both steps of its throw: it beat the careful player in 923 of 1000 games and
  averages 96.8 solo (careful 69.4).
- Played in the in-app browser (mobile, Spanish): a hinted 11 in green, the computer's white-step
  cross and the colour step lit for the thrower.
- Verified (actually run): lint, typecheck, 2798 unit tests (353 files), build, 526 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #154 Shut the Box COMPLETE

- Shut the Box (tiles 1–9, one die once the open tiles add up to 6 or less), solo or 2–4 players,
  solved by dynamic programming over the 512 boxes: 11.02 expected from a fresh box. Over 20 000
  turns the solver averaged 10.89 and shut the box 10.2% of the time, against 11.20 and 7.2% for the
  big-tiles-first player; head to head it won 48.8% to 47.5% (3.7% ties) — the dice decide most games.
- Played in the in-app browser (mobile, Spanish) against the computer: hinted shuts of 8 and 3.
- Verified (actually run): lint, typecheck, 2770 unit tests (351 files), build, 522 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #153 Summit Rush COMPLETE

- Summit Rush (catalog id `cant-stop`, original name and art): eleven columns 2–12, four dice paired
  into two sums, three climbers, busts, stops and claimed summits, 2–4 players. The strategist
  weighs climbs by column and stops by the rule of 28 or the exact bust chance over 1296 rolls; it
  beat the cautious player in 1000 of 1000 games and three of them in 998 of 1000.
- Played in the in-app browser (mobile, Spanish): a hinted climb of 2 + 10, a 9 + 10, a stop and the
  computer's turn. Made markers larger and kept your last message on screen during computer turns.
- Verified (actually run): lint, typecheck, 2751 unit tests (349 files), build, 518 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #152 Pig COMPLETE

- Pig to 100 with one die, solved by value iteration over both scores and the turn total (10⁶
  states, about 0.7 s once): the first player wins 53.06% with perfect play, as published. The
  optimal player beat hold-at-20 in 53.9% of 4000 games; hints give the exact chance to win.
- The first unit test of optimal against hold-at-20 used 400 games and failed by chance (197 wins);
  it now plays 4000 fixed games.
- Played in the in-app browser (mobile, Spanish): a hint (53%), three rolls to 12, a hold, and the
  computer losing its turn on a 1.
- Verified (actually run): lint, typecheck, 2723 unit tests (347 files), build, 514 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #151 Farkle COMPLETE

- Farkle to 10 000 with the 500 opening, hot dice and a final round; the planner plays each turn by
  dynamic programming over dice left and points at stake (600.7 expected from a fresh turn) and won
  241 of 400 games against the cautious player; solo it needs 17.4 turns against 19.2.
- Played in the in-app browser (mobile, Spanish): followed hints to three 3s and a 5, then hot dice
  and a 550 opening bank. Fixed the mid-turn prompt that still said "roll to start the turn".
- Verified (actually run): lint, typecheck, 2711 unit tests (345 files), build, 510 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #150 Generala COMPLETE

- Generala on the shared scorecard core: eleven boxes, the three straights, served bonuses, double
  generala and the instant win of a served generala; the planner stands early on served hands and
  won 146 of 200 games against the simple player.
- Played in the in-app browser (mobile, Spanish): hinted turns to a full house and a four of a kind.
- Verified (actually run): lint, typecheck, 2691 unit tests (343 files), build, 506 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #149 Five Dice COMPLETE

- A shared scorecard dice core (`src/games/shared/scorecard`): an exact turn planner over the 252
  hands of five dice, the state and actions for any scorecard rules, the computer players and the
  table with holds and previews.
- Five Dice (a generic name) with the upper bonus, five-of-a-kind extras and the joker rule; the
  planner averaged 240.6 points solo and won 160 of 200 games against the simple player.
- Played in the in-app browser (mobile, Spanish): hinted turns to a five of a kind, chance and fives.
- Verified (actually run): lint, typecheck, 2672 unit tests (341 files), build, 502 Playwright tests
  (desktop + mobile) — all green (a first run caught the AI bundle missing from the registry; fixed
  and re-run).

## 2026-11-07 — Session 1: #148 Snakes and Ladders COMPLETE

- A board of its own (nine ladders, ten snakes, exact finish), the classic one-die game and a Choice
  variant with two dice; the planner uses an exact value iteration of expected turns to 100 and won
  91% of Choice games against always taking the larger die.
- Played in the in-app browser (mobile, Spanish): Choice turns with hints.
- Verified (actually run): lint, typecheck, 2651 unit tests (339 files), build, 498 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #147 Parchís COMPLETE

- Spanish parchís on the cross-board core: a 5 to come out (obligatory), sixes that roll again and
  count seven with every pawn out, three sixes sending the last pawn home, barriers, twelve safe
  squares, bonus moves of 20 for a capture and 10 for the goal. The heuristic won 131 of 200
  two-player games against the simple rule.
- Played in the in-app browser (mobile, Spanish): four players, an exit on a five, sixes rolling
  again, moves by taps.
- Verified (actually run): lint, typecheck, 2631 unit tests (337 files), build, 494 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #146 Pachisi COMPLETE

- On the cross-board core at arm length 8: cowrie throws (25, 10, 2–6), grace throws to enter and
  throw again, the route down the arm, round and back up, twelve castles, partnerships. The engine
  gained a custom throw and route, partnerships and a non-exact homecoming (cowries never show 1,
  which first left pieces stranded one square from home — found by a stalled test and fixed).
- The heuristic partnership won 145 of 200 games against a simple one.
- Played in the in-app browser (mobile, Spanish): four players, cowrie throws, moves by taps.
- Verified (actually run): lint, typecheck, 2611 unit tests (335 files), build, 490 Playwright tests
  (desktop + mobile): 488 green; the Ludo test ran into the 30 s limit (it needs ~29 s to roll a six
  and move twice), so it now waits for each decision with a 90 s budget (re-run green, separate
  commit).

## 2026-11-07 — Session 1: #145 Ludo COMPLETE

- A shared cross-board race core (`src/games/shared/cross`): the board for any arm length, a rules
  engine with options (exit throws, sixes, captures and homecomings earning a roll or a bonus move,
  safe pairs or barriers, safe squares, six-as-seven), the heuristic players and the table.
- Ludo for 2–4 players with sixes to get out, captures, stars, safe pairs and extra rolls; the
  heuristic beat the simple rule 151 of 200 two-player games.
- Played in the in-app browser (mobile, Spanish): four players, rolls and moves by taps.
- Verified (actually run): lint, typecheck, 2591 unit tests (333 files), build, 486 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #144 Senet COMPLETE

- Kendall's reconstruction: the S-shaped route, four throw sticks with extra throws on 1, 4 and 5,
  swaps with lone pieces, protective pairs and blocking threes, the stop on 26, the Water and the
  exact exits. Expectiminimax two moves deep beat greedy 60 of 100 (a game of much chance).
- Played in the in-app browser (mobile, Spanish): throws, moves by taps, a hint, extra throws.
- Verified (actually run): lint, typecheck, 2571 unit tests (331 files), build, 482 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #143 Royal Game of Ur COMPLETE

- Finkel's rules: four binary dice, seven pieces a side, captures on the shared row, rosettes for
  another throw and a safe central rosette; the board in its historical shape. An expectiminimax
  search three moves deep over the throws beat the greedy player 59 of 60.
- Also fixed the Backgammon and Narde messages to read naturally for the player ("You win",
  "Ganas") with singular side names (separate commit).
- Played in the in-app browser (mobile, Spanish): throws, entering by taps, a hint, a rosette's
  extra throw.
- Verified (actually run): lint, typecheck, 2557 unit tests (329 files), build, 478 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #142 Narde COMPLETE

- Long narde on the shared race board: both sides the same way round from opposite heads, single
  checkers hold points, the head rule (two off the head with 6-6, 4-4 or 3-3 on the first turn),
  the six-point rule, oin and mars in matches to 1, 3 or 5.
- Evaluation weights tuned by greedy-against-greedy matches; expectimax beat greedy 69 of 120.
- Played in the in-app browser (mobile, Spanish): opening dice, turns by taps and by hints against
  the computer.
- Verified (actually run): lint, typecheck, 2542 unit tests (327 files), build, 474 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #141 Backgammon COMPLETE

- Full backgammon: bar, hits, bearing off, the use-most-dice and larger-die rules, gammons and
  backgammons, the doubling cube with the Crawford rule in matches to 1, 3 or 5. A shared SVG
  race board (`src/games/shared/raceboard`) for Backgammon and Narde.
- Computer players: greedy (hand-weighted evaluation) and expectimax over the 21 replies, which
  beat greedy 75 of 120; doubling by an estimated win chance.
- Played in the in-app browser (mobile, Spanish): a 3-3 played by taps, hinted turns, a computer
  double taken (cube to 2, owned by the player).
- Verified (actually run): lint, typecheck, 2526 unit tests (325 files), build, 470 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #140 Sliding Blocks COMPLETE

- The klotski-style 4×5 tray under a generic name: free-path moves (one block, any distance, round
  corners), a bank of 100 generated puzzles (11–138 moves) plus the traditional layout, every
  minimum confirmed by the breadth-first solver (81 for the traditional layout).
- Played in the in-app browser (mobile, Spanish): the traditional layout, a tap-to-move, a hint.
- Verified (actually run): lint, typecheck, 2506 unit tests (323 files), build, 466 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #139 Fibonacci Merge COMPLETE

- The Fibonacci variant on the shared merge core: tiles merge only with their Fibonacci neighbour
  (and 1 with 1); 4×4 to 2584, 3×3 to 144, 5×5 to 4181 (the search reaches it before the
  5 000-move environment cap). Expectimax made 2584 in 6 of 6 games on 4×4.
- Played in the in-app browser (mobile, Spanish): 60 hinted moves to a 55.
- Verified (actually run): lint, typecheck, 2486 unit tests (321 files), build, 462 Playwright tests
  (desktop + mobile): 461 green and the Royal Regions watch test, which drew a random puzzle and
  timed out under load, now uses a fixed seed (re-run green, separate commit).

## 2026-11-07 — Session 1: #138 Number Trios COMPLETE

- A threes-style puzzle under a generic name: one-cell shifts, 1+2 and equal-pair merges, a
  shuffled 1/2/3 deck with bonus tiles, the next tile shown, end-of-game scoring by powers of three;
  4×4, 3×3 and 5×5. Expectimax over where the shown tile enters reaches 384 in 5 of 6 games.
- Played in the in-app browser (mobile, Spanish): keys and 25 hinted moves to a 48, score checked
  against the tiles.
- Verified (actually run): lint, typecheck, 2466 unit tests (319 files), build, 458 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #137 Merge to 2048 COMPLETE

- A shared sliding-merge core (`src/games/shared/merge`): rules as data, seeded spawns, one-step
  undo, replay validation, expectimax search, the table with keys and swipes. Merge to 2048 on
  3×3, 4×4 and 5×5; the search reaches 2048 in 5 of 6 games at 1.2 ms a move.
- Played in the in-app browser (mobile, Spanish): keys, a swipe, hints applied for 30 moves.
- Verified (actually run): lint, typecheck, 2444 unit tests (317 files), build, 454 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #136 Twisty Cube 4×4 COMPLETE

- The 4×4 on the shared cube core with wide (two-layer) turns by a switch or the W key; 3- and
  8-turn scrambles and a 40-turn full scramble. There is no 4×4 search: hints and watch mode undo
  the scramble and the turns so far (simplified), which always solves it but not by the shortest
  way; the rules and the spec say so.
- Played in the in-app browser (mobile, Spanish): a wide turn by key, then hints back to solved
  from an 8-turn scramble.
- Verified (actually run): lint, typecheck, 2424 unit tests (315 files), build, 450 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #135 Twisty Cube 3×3 COMPLETE

- The 3×3 on the shared cube core, with 3- and 7-turn scrambles and full random states. Hints and
  watch mode use the two-phase solver, which now keeps searching for shorter solutions within a
  time budget (60 ms here): every 3-turn scramble gets a 3-turn solution, full scrambles 20.6 turns
  on average.
- Played in the in-app browser (mobile, Spanish): a 7-turn scramble solved by hints in 7 turns,
  and the AI solving a full scramble in 18 turns.
- Verified (actually run): lint, typecheck, 2404 unit tests (313 files), build, 446 Playwright tests
  (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #134 Twisty Cube 2×2 COMPLETE

- A shared twisty-cube core (`src/games/shared/cube`): a sticker model for any size, a CSS 3D view
  with animated layer turns, drag to orbit, buttons and keys, an optimal 2×2 solver (IDA* over
  permutation and twist tables) and a Kociemba two-phase solver for the 3×3 that comes next.
- The 2×2 with 3- and 6-turn scrambles and full random states; hints are optimal from anywhere.
- Played in the in-app browser (mobile, Spanish): turns animate the right way round at a constant
  radius, hints to solved, and the AI solving a full scramble in 8 turns.
- Verified (actually run): lint, typecheck, 2383 unit tests (311 files), build, 442 Playwright tests
  (desktop + mobile) — all green; the cube hint e2e (a hint asked mid-turn) was fixed and re-run.

## 2026-11-07 — Session 1: #133 Towers of Hanoi COMPLETE

- Towers of Hanoi with 3, 5 and 7 disks on three pegs and 6 disks on four; an exact breadth-first
  distance table over every position gives optimal hints from anywhere (17 moves for the four-peg
  tower). The cyclic hand rule is optimal on three pegs and takes 63 on four.
- Played in the in-app browser (mobile, Spanish): the four-peg tower, a first move by keys, then
  hints to the 17-move optimum.
- Verified (actually run): lint, typecheck, 2363 unit tests (309 files), build, 438 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #132 Ball Sort COMPLETE

- Ball Sort on the shared sorting core: one ball per move, 4–12 colors with tubes of four or five;
  the solver finishes any level in 0.1–10 ms.
- Played in the in-app browser (mobile, Spanish): moved a ball with the number keys and finished
  with hints.
- Verified (actually run): lint, typecheck, 2345 unit tests (307 files), build, 434 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #131 Water Sort COMPLETE

- New shared tube-sorting core `src/games/shared/sorting/` (pour rules, a depth-first solver with
  explored-position memory, state with undo by replay, agents, table) for #131 and #132.
- Water Sort with 4–12 colors; every seeded shuffle checked solvable; the solver finishes any level
  in about a millisecond. The greedy agent first oscillated (pouring straight back) and lost to
  random play; it now never undoes its last pour.
- Played in the in-app browser (mobile, Spanish): poured a whole layer by taps and finished with
  hints. Fixed on the way: the lifted tubes hit the counters (top padding added).
- Verified (actually run): lint, typecheck, 2327 unit tests (305 files), build, 430 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #130 Color Links (Flow) COMPLETE

- Numberlink-family path puzzle under a generic name: 5×5 to 9×9 generated by cutting a random
  full-grid path into color stretches (fewest shortcuts of 20 cuts kept); drawing with cutting and
  shortening rules; hints reveal a whole guaranteed path.
- Played in the in-app browser (mobile, Spanish): drew a path by dragging and finished with hints.
  Fixed on the way: the fill counter counted bare dots (40% at the start) and hint messages were
  wiped by the state update.
- Verified (actually run): lint, typecheck, 2309 unit tests (303 files), build, 426 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #129 Lights Out COMPLETE

- Lights Out on 4×4, 5×5, 7×7 and a diagonal 5×5; scrambles are random presses (always solvable);
  a GF(2) solver tries the whole null space for the fewest presses (the all-on 5×5 needs 15, the
  known minimum). Light chasing solves everything but with 2–3× the presses.
- Played in the in-app browser (mobile, Spanish): a press, then hints to all dark.
- Verified (actually run): lint, typecheck, 2291 unit tests (301 files), build, 422 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #128 Peg Solitaire COMPLETE

- Peg Solitaire on the English (33, centre finish), European (37, a start hole found by search to
  allow one peg) and triangle (15, six directions) boards; a depth-first solver with dead-position
  memory finishes from the start in 1 / 33 / 350 ms and proves hopeless positions for hints.
- Played in the in-app browser (mobile, Spanish): the triangle drawn as a triangle, a jump by taps,
  then hints to a single peg.
- Verified (actually run): lint, typecheck, 2272 unit tests (299 files), build, 418 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #127 Sokoban COMPLETE

- Sokoban with an original bank of 152 warehouses generated offline by `tools/generate-sokoban.ts`
  (crates on goals pulled back as far as possible): 2 / 3 / 4 crates, 10–41 fewest pushes. A push
  solver (breadth-first over crates and keeper region, dead cells pruned) gives optimal hints.
- Played in the in-app browser (mobile, Spanish): pushed with the keys, walked by tapping and
  finished with hints in the fewest pushes.
- Verified (actually run): lint, typecheck, 2253 unit tests (297 files), build, 414 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #126 Traffic Jam COMPLETE

- Sliding-block parking puzzle under a generic name with an original bank of 310 puzzles generated
  offline by `tools/generate-traffic-jam.ts` (whole reachable space explored, farthest position
  kept): easy 6–11, medium 12–19, hard 20–37 fewest moves. Breadth-first solver for hints (8–98 ms).
- Played in the in-app browser (mobile, Spanish): dragged a car along its lane and finished with
  hints. Fixed on the way: a rose vehicle could be mistaken for the red car; vehicle hues now avoid
  red and their names were updated.
- Verified (actually run): lint, typecheck, 2234 unit tests (295 files), build, 410 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #125 15-Puzzle COMPLETE

- 15-Puzzle on the shared sliding core: easy/medium walk scrambles and random boards; optimal IDA*
  within a budget, weighted A* beyond it (54.2 moves on random boards vs about 52.6 optimal), with
  the plan cached so that following hints costs one search.
- Played in the in-app browser (desktop, Spanish): a random board solved through hints (first hint
  in 95 ms, 59 moves).
- Verified (actually run): lint, typecheck, 2215 unit tests (293 files), build, 406 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #124 8-Puzzle COMPLETE

- New shared sliding core `src/games/shared/sliding/` (solvability, seeded scrambles, line slides,
  IDA* with Manhattan + linear conflicts, weighted A* fallback, state with undo, agents, table with
  number or picture tiles) for #124 and #125.
- 8-Puzzle: optimal solver in about 1 ms (22.2 moves on average for random boards; the hardest
  board in 31), hints that name the next tile and the moves left, a counter against the best.
- Played in the in-app browser (mobile, Spanish): number and picture tiles, taps and arrows, hints
  to the end (14 moves after one detour, optimal 12). Shortened the counters so they fit on phones.
- Verified (actually run): lint, typecheck, 2203 unit tests (291 files), build, 402 Playwright tests (desktop + mobile; the new 8-Puzzle spec re-run after waiting for the board) — all green.

## 2026-11-07 — Session 1: #123 Number Trail (Zip) COMPLETE

- Numbered path puzzle under a generic name: 5×5 to 8×8 generated from a seed; a pruned path
  counter (parity, reachability, two-ways-in forcing) drives a repair loop that adds walls or
  numbers until the trail is unique (8×8 in 0.46 s on average).
- Played in the in-app browser (mobile, Spanish): dragged the trail, extended with the arrows, got
  the "go back" hint after leaving the solution and finished with hints. Fixed on the way: fast
  drags skipped cells and were ignored; the trail now walks step by step toward the pointer.
- Verified (actually run): lint, typecheck, 2182 unit tests (289 files), build, 398 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #122 Royal Regions (Queens) COMPLETE

- Colored-regions queens puzzle under a generic name: 6×6 to 10×10 generated from a seed, with a
  region-repair step that breaks alternative solutions (unique puzzles in 2–83 ms on average), a
  four-technique solver that grades every level, drag-to-cross, auto-crosses and explained hints
  naming region colors.
- Played in the in-app browser (mobile, Spanish): an 8×8 crossed by dragging and solved with hints;
  the explanations were checked against the board.
- Verified (actually run): lint, typecheck, 2161 unit tests (287 files), build, 394 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #121 Hangman COMPLETE

- Hangman with original lists (six categories, 280 English / 262 Spanish words), three levels, daily
  word, two players with a typed secret word, an SVG drawing with the strokes to come shown faintly.
- Word-list solver: every listed word solved on every level (0.24–0.84 misses on average); letter
  frequency alone solves 5–35%.
- Played in the in-app browser (mobile, Spanish): a word solved with hints and a friend's accented
  word ("Pingüino") normalized and played.
- Verified (actually run): lint, typecheck, 2140 unit tests (285 files), build, 390 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #120 Word Guess COMPLETE

- Word Guess (generic five-letter word game) in English and Spanish: hand-picked answer lists (981 /
  640), accepted guesses from Webster's Second International (public domain) plus generated Spanish
  forms, today's word, hard mode, a colored on-screen keyboard with Ñ, explained hints.
- Solver (expected-size over the answers): 3.227 guesses on average in English and 3.094 in Spanish
  over every answer, never more than 5 in normal mode.
- Played in the in-app browser (mobile, Spanish): rejected a non-word, guessed with the physical and
  on-screen keyboards (Ñ), resumed after a reload and solved with hints. Fixed on the way: absent
  tiles looked like unsent ones and absent keys were not dimmed; accented vowels now type plain.
- Verified (actually run): lint, typecheck, 2118 unit tests (283 files), build, 386 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #119 Bulls and Cows COMPLETE

- Bulls and Cows on the shared code-guess core: 3/4/5 digits, solo and daily numbers, and a duel
  against an easy (forgetful), medium (consistent) or hard (expected-size) computer with a fair
  last-guess rule. Notes per digit, contradiction warnings, hints in solo only.
- The shared chooser gained an expected-size rule: 5.21 guesses on average for 4 digits (Knuth's
  worst-case rule gave 5.34). Duel strength separates cleanly (hard beats easy 142–37–21).
- Played in the in-app browser (mobile): a duel against the hard computer won; hints were then
  limited to solo games so duel achievements need the player's own deduction.
- Verified (actually run): lint, typecheck, 2096 unit tests (281 files), build, 382 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #118 Code Breaker COMPLETE

- Code Breaker (generic name for the Mastermind-style game): Easy / Classic / Hard codes, daily code,
  contradiction warnings, counted hints, and a mode where the player sets a code for the AI.
- New shared core `src/games/shared/codeguess/` (code spaces with fast scoring keys, consistency
  filter, minimax chooser with symmetry reduction and a work budget) for #118 and #119.
- Minimax breaker: all 1296 Classic codes in 4.458 guesses on average, never more than 5; Hard
  5.58 avg / 7 worst at 44 ms per guess (200 codes).
- Played in the in-app browser: a Classic code cracked on mobile (manual guess then hints), and the
  AI cracked a Hard code set by the player on desktop.
- Verified (actually run): lint, typecheck, 2074 unit tests (279 files), build, 378 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #117 No-Guess Minesweeper COMPLETE

- No-Guess Minesweeper on the shared engine: layouts redrawn from the seed and first cell until the
  deduction solver (single numbers, number pairs, mine count) clears them. Only 4.5% of random Expert
  layouts qualify, yet generation averages 23 ms; the deduction agent clears 100% of boards at every
  size (200 each).
- Played in the in-app browser (mobile): an Intermediate board cleared through hints alone. Fixed in
  the shared table: the "no flags" achievement ignored flags placed by hints (it now also requires
  no hints).
- Verified (actually run): lint, typecheck, 2049 unit tests (277 files), build, 374 Playwright tests (desktop + mobile) — all green.

## 2026-11-07 — Session 1: #116 Classic Minesweeper COMPLETE

- A shared minesweeper (`src/games/shared/minesweeper/`) for #116–#117: placement after the first
  opening (seeded, replayable), flood fill, flags, chords, deductions (single numbers, number pairs,
  the mine count) for hints and the AI, a no-guess generator, a hidden-information environment and a
  table with long-press flagging, keyboard play and Expert turned on narrow screens.
- Measured over 300 boards per size: the deduction agent clears 93.3% / 81.7% / 26.7% of Beginner /
  Intermediate / Expert boards; random 0%.
- Played in the in-app browser (mobile): Intermediate with an explained hint; Expert turned to 30×16
  fitting a phone, played through hints until a forced guess lost.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 2033 unit tests, build, 370
  Playwright tests.

## 2026-11-07 — Session 1: #115 Nurikabe COMPLETE

- Nurikabe (5×5 to 8×8) with its own engine: techniques for hints (complete island, between two
  islands, unreachable, pool, island and sea exits), an exact solver using them as propagation plus
  search, and an island-growing generator that breaks 2×2 pools in place (without it 3 of 5 7×7 seeds
  failed). Measured over 20 seeds per size: unique, technique-solvable, ≤ 434 ms. 9×9 and larger were
  tried and dropped (rarely unique, up to 11 s).
- Played in the in-app browser (mobile): hints of every technique, a 7×7 solved. Fixed: the board
  size came from a Hitori field (layout broke); hints now apply every cell a step decides.
- The first full run timed out one older contract suite (Halma) under load; Vitest's per-test
  timeout is now 20 s (contract suites play whole games), and the rerun passed.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 2011 unit tests, build, 366
  Playwright tests.

## 2026-11-07 — Session 1: #114 Hashiwokakero (Bridges) COMPLETE

- Bridges with its own engine: facing pairs and crossings, bound-based techniques for hints (full
  island, forced bridge, finished island, crossings, isolation), an exact solver (bounds, crossing
  exclusion, search, connectivity) and an island-growing generator. Measured over 30 seeds per size:
  unique, technique-solvable, ≤ 9 ms.
- Played in the in-app browser (mobile): hints, island-to-island taps, a 9×9 solved. Hints now ring
  only the island they talk about.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1998 unit tests, build, 362
  Playwright tests.

## 2026-11-07 — Session 1: #113 Slitherlink COMPLETE

- Slitherlink (5×5 to 12×12) with its own engine: edge/dot geometry, an exact solver (number and dot
  propagation, single-loop check, search), techniques for hints (numbers, dots, no early loop), and a
  generator (a region grown without holes or pinches, its boundary as the loop, numbers removed while
  unique and technique-drawable). Measured over 20 seeds per size: ≤ 156 ms, both solvers 100%.
- Played in the in-app browser (mobile): tap and dot-to-dot drag input, hints, a 7×7 solved.
  Fixed: a 5×5 region whose full numbers the techniques could not draw is now skipped.
- A first full run timed out four older heavy tests under load (contract suites, 16×16 generation);
  the 16×16 generation test now has a 30 s budget, and the rerun passed.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1979 unit tests, build, 358
  Playwright tests.

## 2026-11-07 — Session 1: #112 Nonogram COMPLETE

- Nonogram with a dynamic-programming line solver, an exact solver (line propagation + search), a
  generator (smoothed noise repaired by flipping undecided cells until the line solver finishes) and
  ten original hand-drawn pictures (four needed redrawing to become line-solvable). Measured over 40
  seeds per size: line-solvable and unique, ≤ 74 ms.
- Played in the in-app browser (mobile): 15×15 fits a phone with its clues; drag painting locked to a
  line, undo of a whole drag, hints, the picture gallery (heart solved and revealed).
- Fixed during verification: on a 1280×720 desktop the board overflowed its height cap and covered
  the buttons (E2E click timed out); the cell size now also respects the available height.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1964 unit tests, build, 354
  Playwright tests (full rerun after the fix).

## 2026-11-07 — Session 1: #111 Hitori COMPLETE

- Hitori (5×5 to 10×10) with its own engine: exact solver (propagation + connectivity + search),
  techniques for hints (next to shaded, twin of kept, sandwich, adjacent pair, connection), and a
  generator (Latin square, scattered shading, several renumberings per layout — one numbering found
  a unique 10×10 only ~2% of the time). Measured over 40 seeds per size: unique, technique-solvable,
  ≤ 152 ms.
- Played in the in-app browser (mobile): hints, tap modes, a 7×7 solved. Fixed: shaded cells looked
  light in the dark theme (now hatched near-black); hints no longer walk through cells whose number
  never repeats (they count as white).
- Fixed in the shared sudoku strings: Spanish menu texts said "sudoku" in Kakuro, Calcudoku and
  Futoshiki (now "puzle").
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1944 unit tests, build, 350
  Playwright tests.

## 2026-11-07 — Session 1: #110 Futoshiki COMPLETE

- Futoshiki (4×4 to 7×7) on the shared core: inequality signs with a propagator for the exact
  solver and an inequality technique; the generator now draws variant rules per candidate solution.
  Measured over 40 seeds per size: unique, at the wanted levels (one 6×6 kept at level 1 after its
  tries), ≤ 164 ms; both solvers 100%.
- Played in the in-app browser (mobile): 6×6 with chevrons, an explained hint, solved to the end.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1925 unit tests, build, 346
  Playwright tests.

## 2026-11-07 — Session 1: #109 Calcudoku COMPLETE

- Calcudoku (original arithmetic-cage puzzle, generic name for the KenKen style) on the shared sudoku
  core, which gained Latin-square geometry (no boxes), per-difficulty board sizes (4×4 to 7×7 in one
  game), arithmetic cages (tuple propagator, cage-arithmetic technique, generator that re-rolls an
  operation or splits a cage where a second solution differs) and a shared cage overlay (Killer
  Sudoku now uses it too).
- Measured over 40 seeds per size: unique, technique-solvable at the wanted levels, ≤ 360 ms to
  generate, at most ~2 one-cell cages on 7×7; both solvers 100%.
- Played in the in-app browser (mobile): 6×6 with "540×"/"4÷" cages, explained hints, solved; Killer
  Sudoku re-checked after the overlay refactor.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1906 unit tests, build, 342
  Playwright tests.

## 2026-11-07 — Session 1: #108 Kakuro COMPLETE

- Kakuro with its own engine: run combinations, an exact solver with combination propagation,
  techniques for hints (singles, hidden singles, run combinations), and a generator (symmetric
  layout, extreme-biased fill, local repair where a second solution differs, givens as a last
  resort, technique-solvability check). Random fills were never unique on their own (0 of 35 on
  7×7); repair brings Easy to 0 givens in 27 of 30 puzzles; Medium averages 1.7 and Hard 3.4.
- Measured over 30 seeds per difficulty: generation ≤ 1.6 s (Hard), techniques solve 100%.
- Played in the in-app browser (mobile): hints, combinations helper, fill notes, a Medium puzzle
  solved to the end. Fixed: clue cells were light in the dark theme (now near-black in both).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1887 unit tests, build, 338
  Playwright tests.

## 2026-11-07 — Session 1: #107 Jigsaw Sudoku COMPLETE

- Jigsaw Sudoku on the shared core, which now carries per-puzzle regions (`geoFor`): the boxes are
  reshaped by random connectivity-preserving swaps, regions get up to four tints so touching ones
  differ, and saves validate the regions. Measured over 50 seeds per difficulty: all at their level
  (Easy/Medium singles, Hard level 2, Expert level 3), generation ≤ 694 ms; both solvers 100%.
- Played in the in-app browser (mobile): a Hard puzzle with region borders and tints, explained
  hints, solved to the end.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1874 unit tests, build, 334
  Playwright tests.

## 2026-11-07 — Session 1: #106 Killer Sudoku COMPLETE

- Killer Sudoku (no givens, cages with sums) on the shared core, which gained: constraint hooks for
  the exact solver (a cage propagator over the valid digit combinations), variant techniques in the
  technique solver (cage combinations; the 45 rule's innies and outies), cages in the play state and
  save validation, and a cage generator that splits a cage wherever a second solution differs.
- Measured over 40 seeds: Easy (cages 2–3) all level 1, Medium (2–4) levels 1–2, Hard (3–6) levels
  2–3, generation ≤ 777 ms; the technique solver solves 100% without guessing, as does the exact
  solver.
- Played in the in-app browser (mobile): cage outlines and sums, a "45 rule" hint over a column,
  Medium and Hard solved through hints. Hints now highlight only the last steps before a placement.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1856 unit tests, build, 330
  Playwright tests.

## 2026-11-07 — Session 1: #105 X-Sudoku COMPLETE

- X-Sudoku on the shared core (the diagonals are units for the solver, every technique and the
  hints): Easy 32 clues, Medium 22–28, Hard level 2, Expert level 3; measured over 100 seeds each,
  all at their level, generation ≤ 349 ms; both solvers 100%. Diagonal cells are tinted (as a
  background image, so the shared highlights still show) with dashed corner-to-corner lines.
- Played in the in-app browser (mobile): a Hard puzzle solved through hints, including "In this
  diagonal, 4 fits only in R2C8" and box–line steps on a diagonal.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1834 unit tests, build, 326
  Playwright tests.

## 2026-11-07 — Session 1: #104 Sudoku 16×16 COMPLETE

- Sudoku 16×16 (symbols 1–9, A–G; keys A–G) on the shared core: Easy 130 clues, Medium 100–116,
  Hard levels 2–3. A rare uniqueness check exploded (58 s for one removal), so the shared solver now
  takes a node budget: a check that runs out keeps the clue (puzzles stay provably unique), and the
  random fill restarts if it wanders. Measured over 30 seeds: generation ≤ 456 ms in Node (1.3 s in
  the dev build in the browser), every puzzle at its level; both solvers 100%.
- Played in the in-app browser (mobile): Hard puzzle, notes in a 4×4 mini-grid, explained hints,
  solved to the end (148 placements).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1816 unit tests, build, 322
  Playwright tests.

## 2026-11-07 — Session 1: #103 Sudoku 6×6 COMPLETE

- Sudoku 6×6 with 2×3 boxes on the shared core: Easy (singles, 14 clues), Medium (singles, 9–12),
  Hard (levels 2–3). Only about one grid in fifty ends above singles, so Hard retries up to 500
  grids: measured over 200 seeds, all at level 2–3 (157 needing Y-Wing/X-Wing-level steps), 26 ms
  average and 126 ms worst to generate. Both solvers 100%; random play ≤ 1%.
- Played in the in-app browser (mobile): a Hard puzzle whose hint chained box–line reduction,
  hidden pair, X-Wing and Y-Wing; notes in a 3×2 mini-grid; solved to the end.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1803 unit tests, build, 318
  Playwright tests.

## 2026-11-07 — Session 1: #102 Mini Sudoku 4×4 COMPLETE

- Mini Sudoku on the shared sudoku core: 4×4 with 2×2 boxes, digits 1–4. Every 4×4 puzzle falls to
  singles, so the levels are clue counts: Easy 8, Medium 6, Hard 4–5 (measured over 200 seeds each,
  all unique, < 1 ms to generate). Random play solves 38% / 23% / 8%; both solvers 100%.
- Played in the in-app browser (mobile): a Hard puzzle with an explained hint, solved to the end.
  Fixed in the shared table: board rows now keep a fixed height (they collapsed on sparse boards).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1803 unit tests (including
  the unregistered 6×6 module), build, 314 Playwright tests.

## 2026-11-07 — Session 1: #101 Classic Sudoku 9×9 COMPLETE

- New shared sudoku core (`src/games/shared/sudoku/`) for #101–#107: geometry for any box shape,
  irregular regions and diagonals; an exact solver (singles propagation + fewest-candidates search);
  human techniques up to X-Wing, Y-Wing and Swordfish; a graded generator; play state with notes,
  undo/redo, mistakes and hints; agents and a puzzle environment; the shared table and rules.
- Measured over 100 seeds per difficulty: every puzzle at its level (Easy/Medium singles, Hard
  locked candidates or pairs, Expert triples/X-Wing/Y-Wing/Swordfish), generation ≤ 321 ms;
  the technique and exact solvers solve 100%, random play 0%.
- Played in the in-app browser (mobile): hints with explanations, notes, a full solve, watch mode.
  Fixed: the speed achievement now requires no hints; a naked single reached after eliminations
  is worded as such.
- Fixed during verification: the environment id must be the game id, not the ruleset id.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1785 unit tests (the run
  also covered the unregistered 4×4 and 6×6 modules being built next), build, 310 Playwright tests.

## 2026-11-07 — Session 1: #100 Go Fish COMPLETE

- Go Fish for 2–4 players: asks, go fish with the lucky draw, books, empty hands drawing, a log of
  the asks. The opponents reason only from the public record of asks (holders, deniers, draws since).
- Hard asks by the chance of success weighted toward books and keeps asking for its threes; first
  versions lost to Medium and even Easy (a stale "lacks it" reset made both sides repeat asks), fixed
  by counting the unseen cards a denier drew since. Measured over 10 000 games: Hard +1.4 books a
  game vs Easy (61%), +0.1 vs Medium (51%); Medium +0.7 vs Easy (56%).
- Played in the in-app browser (mobile, three opponents) to the end, with a shared win; watch mode
  on desktop. Names joined with the locale's list format; log names shortened in watch mode.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1741 unit tests, build, 306
  Playwright tests.

## 2026-11-07 — Session 1: #099 Crazy Eights COMPLETE

- Crazy Eights for 2–4 players: wild eights, draw-one, reshuffles, blocked hands, scoring to 100,
  with a suit picker. Public "could not follow" information drives Medium's and Hard's suit choices.
- A sampled-deal Hard lost to Medium (−4.3 points a hand; −0.7 with a margin), so Hard is a rule
  set that keeps the next player on their gap: +0.4 vs Medium, +2.3 vs Easy over 10 000 hands.
- Played in the in-app browser (mobile): playing an eight and naming a suit.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1720 unit tests, build, 302
  Playwright tests.

## 2026-11-07 — Session 1: #098 Euchre COMPLETE

- Euchre on the shared trick table: 24 cards, bowers, two bidding rounds with stick the dealer,
  the dealer's pickup and throw, going alone, scoring to 10. Hand values for bidding, partnership
  play, Hard's sampled-deal play.
- Measured: Medium vs Easy +0.24 points a hand (10 000 hands), Hard vs Medium +0.06 and vs Easy
  +0.31 (2000 hands), 4.7 ms a decision.
- Played in the in-app browser (mobile): bidding hint, the dealer ordering up; fixed a Spanish
  article in the order prompt.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1700 unit tests, build, 298
  Playwright tests.

## 2026-11-07 — Session 1: #097 Cribbage COMPLETE

- Cribbage: crib, his heels, pegging with automatic goes, the show (29-hand checked), game to 121
  with a peg board. Hard averages all 46 starters for its throw and weighs replies when pegging.
- Measured over 5000 hands: Medium vs Easy +3.0 points a hand, Hard vs Medium +0.7, Hard vs Easy
  +3.7; decisions under 0.2 ms.
- Played in the in-app browser (mobile): only the last play's points were shown when the opponent
  laid two cards in a row — added a play log.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1684 unit tests, build, 294
  Playwright tests.

## 2026-11-07 — Session 1: #096 Gin Rummy COMPLETE

- Gin rummy: least-deadwood meld search, knock / gin / undercut with lay-offs, void hands, match to 100. Hard throws by expected deadwood after its next draw and samples the opponent's hands to
  estimate the undercut risk before knocking.
- Measured: Medium vs Easy +1.5 points a hand (2000 hands), Hard vs Medium +1.7 and vs Easy +4.3
  (1000 hands), 3.3 ms a decision.
- Played in the in-app browser (mobile); fixed Spanish card articles in hints across the card games
  ("el reina" → "Difícil jugaría: reina de …").
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1669 unit tests, build, 290
  Playwright tests.

## 2026-11-07 — Session 1: #095 Contract Bridge COMPLETE

- Bridge: auction with doubles and redoubles, declarer and dummy (the player declares both N–S
  hands), duplicate scoring, Chicago vulnerability over four deals. A natural bidding system
  (openings, competition, placement by combined points and fits); Hard plays by sampled layouts.
  The shared trick table gained open hands (dummy) that can be tapped.
- Medium bidding and play make 59% of 199 contracts; Medium vs Easy +58 points a deal (1000 deals),
  Hard vs Medium +123 and vs Easy +148 (200 deals), 28 ms a decision.
- Played in the in-app browser (mobile): north's cards were hidden when north declared, the status
  named the wrong dummy, a responder with 4 points bid 1NT, overcalls in the opponents' suit, a
  correction of partner's game — all fixed.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1654 unit tests, build, 286
  Playwright tests.

## 2026-11-07 — Session 1: #094 Spades COMPLETE

- Spades on the shared trick table (partnership colours, bidding grid): nil, bags with the tenth-bag
  penalty, sets, game to 500 / −200. Medium bids from a trick estimate and plays as a partner;
  Hard bids from simulated deals and searches its play over sampled deals.
- Measured: Medium vs Easy +13 points a hand (2000 hands), Hard vs Medium +14 and vs Easy +28
  (300 hands), 27 ms a decision.
- Played in the in-app browser (mobile): bidding hint, bids on the plates, spades locked until
  broken.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1638 unit tests, build, 282
  Playwright tests.

## 2026-11-07 — Session 1: #093 Hearts COMPLETE

- New shared `tricks` family (rank order, follow suit, trick winner with trump, a four-seat
  `TrickTable` with fanned hands, card backs, plates and the trick in the middle). `evaluateAgents`
  now seats two agents alternately in environments for more than two players.
- Hearts: passing cycle, two of clubs, no points on the first trick, broken hearts, the moon, game
  to 100. Hard samples deals consistent with shown-out suits and its own pass, plays out with Medium.
- Measured: Medium vs Easy +0.040 (1000 hands), Hard vs Medium +0.078 and vs Easy +0.114 (200 hands;
  ≈2 and 3 points a hand), 48 ms a decision.
- Played in the in-app browser (mobile, desktop watch): the east seat overflowed and trick cards
  overlapped — fixed (shorter plates, larger trick area).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1622 unit tests, build, 278
  Playwright tests.

## 2026-11-07 — Session 1: #092 Leduc Poker COMPLETE

- Leduc on the heads-up table (public card slot, split pots, hand names at showdown).
  `tools/solve-leduc.ts` runs CFR+ (10 000 iterations, 63 s) and writes `strategy.ts` (288
  information sets): value −0.0855, exploitability 0.0020 (Medium 0.683, Easy 0.842).
- Exact EV per hand: Nash vs Medium +0.184, vs Easy +0.144; Medium vs Easy +0.062 (100 000 seeded
  hands agree: +0.180 / +0.137 / +0.061).
- Played a hand in the in-app browser (mobile): raise, public card, Nash coach, the AI's mix.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1605 unit tests, build, 274
  Playwright tests.

## 2026-11-07 — Session 1: #091 Kuhn Poker COMPLETE

- New `src/ai/agents/cfr.ts`: CFR+ for small two-player zero-sum games, exact strategy values and
  exploitability (best responses by information set). New shared `heads-up-poker` table (match vs
  one AI, Nash coach on the buttons, the opponent's move probabilities after each hand, watch mode).
- Kuhn: CFR+ (4000 iterations, ~0.1 s) finds the known equilibrium (α = 0.23, king 3α, queen
  checks, calls/bluffs 1/3), value −1/18, exploitability 0.0004 (Medium 0.037, Easy 0.217).
  100 000 hands: Nash vs Random +0.153, vs Easy +0.031, vs Medium +0.003; Medium vs Easy +0.037.
- Played in the in-app browser (mobile): coach, AI mix, "You win" phrasing fixed.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1592 unit tests, build, 270
  Playwright tests.

## 2026-11-07 — Session 1: #090 Seven Card Stud COMPLETE

- The shared poker engine gained a `STUD` variant: antes, the bring-in from the lowest up card,
  completion, up and down cards by position, the best showing hand opening later streets, small
  then big fixed bets. `stud-ai.ts` removes every visible card from the deck before sampling;
  observations hide only down cards. The table shows seven cards with the player's own down cards
  marked.
- 2000 heads-up hands per pairing: Medium vs Easy +0.62, Hard vs Easy +0.61, Hard vs Medium −0.07
  (level). Hard first lost to Medium (−0.14): its button allowance means nothing in stud and its
  thinner bets and looser calls cost in fixed limit — removed / shared thresholds. Draw re-measured
  with the shared fixed-limit thresholds: +0.27 / +0.20, Hard vs Medium +0.08.
- Played a full hand in the in-app browser (mobile): "Raise" shown for opening bets and "blinds" in
  stud texts — fixed.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1577 unit tests, build, 266
  Playwright tests.

## 2026-11-07 — Session 1: #089 Omaha Hold'em COMPLETE

- Omaha on the shared poker family (four hole cards, two-plus-three scoring, pot-limit); the table's
  presets drop All-in when the pot caps the raise, and A raises the pot.
- The first benchmark showed Medium and Hard losing to Easy in Omaha (−0.34 / −0.11 bb/hand).
  Experiments (1500 hands each) showed thin value bets beat the calling station in every variant
  (Hold'em: +0.84 → +6.68 bb/hand from a 25% to a 6% edge). Retuned: Medium bets from a 12% edge
  (80% pot, 2% bluffs), Hard from 6% (pot, 4% bluffs); fixed limit keeps a 10% floor.
- Re-measured: Hold'em (1500 hands) Medium/Hard vs Easy +4.22 / +5.91, Hard vs Medium +0.33; Omaha
  (1000) +1.17 / +3.61, +0.15; Draw (2000) +0.27 / +0.18, +0.02 — specs updated.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1553 unit tests, build, 262
  Playwright tests.

## 2026-11-07 — Session 1: #088 Five Card Draw COMPLETE

- The shared poker engine gained a `DRAW` variant: a discard round (0–3 cards, public counts, all-in
  players draw too) and fixed-limit betting (1 / 2 big blinds, four-bet cap). `draw-ai.ts`: a simple
  discard rule, a Monte Carlo discard on common random numbers, and equity that deals opponents hands
  fitting their draw counts. The table shows five cards, tap-to-discard and draw counts.
- 2000 heads-up hands per pairing (bb/hand): Easy vs Random +1.45, Medium vs Random +1.34, Medium vs
  Easy +0.14, Hard vs Easy +0.12, Hard vs Medium +0.02. The first Medium/Hard lost to Easy: bluffs
  and slow-plays do not work in fixed limit, so they are reduced there and value bets are thinner.
- Played in the in-app browser (mobile): fixed-limit raise label said "All-in", duplicate draw
  labels, the player's five cards crowding a neighbour — all fixed.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1533 unit tests, build, 258
  Playwright tests.

## 2026-11-07 — Session 1: #087 Texas Hold'em COMPLETE

- New shared `poker` family: hand scores (7-card and Omaha), a sit-and-go engine (blind levels,
  no-limit / pot-limit, short all-ins that do not reopen, side pots, eliminations, replay
  validation), Monte Carlo opponents that read ranges from the chips committed, a one-hand
  environment with masked observations, and the `PokerTable` UI (menu, coach, Watch AI, saves).
- 1000 heads-up hands per pairing (bb/hand): Easy vs Random +6.15, Medium vs Random +5.60,
  Medium vs Easy +1.93, Hard vs Easy +3.22, Hard vs Medium +0.19.
- Played in the in-app browser (mobile and desktop): found and fixed AIs calling all-ins with junk
  (range reading), "You wins" phrasing, busted players' shown cards being hidden.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1511 unit tests, build, 254
  Playwright tests.

## 2026-11-07 — Session 1: #086 Blackjack COMPLETE

- Blackjack table (six decks, S17, 3:2, peek, insurance, DAS, splits to four, chips only) with a
  basic-strategy hint and Watch AI; one-round AI episodes.
- 200 000 seeded rounds: basic strategy −0.14%, dealer mimic −5.50%, random −42.5% per round.
- Fixed `evaluateAgents` overflowing the stack (`Math.max(...latencies)`) on very long runs.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1480 unit tests, build, 250
  Playwright tests.

## 2026-11-07 — Session 1: #085 Canfield COMPLETE

- Canfield on the card shell: reserve with automatic refills, base-rank foundations wrapping king
  to ace, draw three with unlimited passes, masked planner.
- Deals 1–30: planner 3 solved (avg share 0.29), greedy 0 (0.13), random 0 (0.15).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1461 unit tests, build, 246
  Playwright tests.

## 2026-11-07 — Session 1: #084 Clock COMPLETE

- Clock patience on the card shell (glowing pile to turn, smarter auto-move key): turn and place
  under the hour, the fourth-king ending. Engine win rate 152/2000 = 7.6% (theory 1/13).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1445 unit tests, build, 242
  Playwright tests.

## 2026-11-07 — Session 1: #083 Accordion COMPLETE

- Accordion on the card shell: deal-as-you-go row, moves one or three to the left on suit or rank,
  piles-left scoring.
- Deals 1–200: planner won 1 and left 4.4 piles on average; greedy 10.7; random about the same.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1432 unit tests, build, 238
  Playwright tests (the Accordion spec re-run dealing by clicking the stock).

## 2026-11-07 — Session 1: #082 Forty Thieves COMPLETE

- Thin module on the column family: two decks, one-card moves in suit, a single stock pass, eight
  foundations.
- Deals 1–20: planner 2 solved (avg share 0.40), greedy 0 (0.32), random 0 (0.17).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1417 unit tests, build, 234
  Playwright tests.

## 2026-11-07 — Session 1: #081 Scorpion COMPLETE

- Thin module on the column family: suit building, group moves, run removal, a three-card reserve.
- Deals 1–30: planner 2 solved (avg share 0.13), greedy 1 (0.12), random 0 (0.03).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1406 unit tests, build, 230
  Playwright tests.

## 2026-11-07 — Session 1: #080 Yukon COMPLETE

- New configurable column-patience family (`shared/columns`: deal, stock kind, building rule, move
  unit, empty-column rule, foundations or run removal) with Yukon, Scorpion and Forty Thieves
  variants. Planner: shortest line to real progress (a best-first planner chasing long lines lost
  to the greedy player and was replaced).
- Deals 1–30: planner 9 solved (avg share 0.42), greedy 7 (0.31).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1395 unit tests, build, 226
  Playwright tests (the Yukon spec re-run clicking the visible edge of a fanned card).

## 2026-11-07 — Session 1: #079 Golf COMPLETE

- Thin module on the shared up-or-down family: no wrap, golf strokes (lower is better, under par
  for stock left).
- Deals 1–100: planner 3 cleared, greedy 2, random 0 (avg share 0.79 / 0.75 / 0.32).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1370 unit tests, build, 222
  Playwright tests.

## 2026-11-07 — Session 1: #078 TriPeaks COMPLETE

- New shared up-or-down family (`shared/updown`, TriPeaks and Golf layouts) and single-tap play in
  the card shell. Planner values the hidden cards a chain would turn up.
- Deals 1–100: planner 55 cleared, greedy 45, random 0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1359 unit tests, build, 218
  Playwright tests.

## 2026-11-07 — Session 1: #077 Pyramid COMPLETE

- Pyramid on the card shell (free vertical placement and vanishing piles added to the shell):
  pairs of 13 and lone kings, three passes, masked planner.
- Deals 1–50: planner 15 cleared (avg share 0.79), random 0 (0.60); greedy 4 of 30 (0.73).
- Shell: height-placed layouts now size cards to fit the screen height, leaving room for the buttons.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1334 unit tests, build, 214
  Playwright tests (the Pyramid spec re-run after fitting the height).

## 2026-11-07 — Session 1: #076 Spider — Four Suits COMPLETE

- Thin module on the shared Spider family (two full decks).
- Deals 1–10: planner 0 solved (avg share of runs 0.03), greedy 0 (0.00), random 0 (0.00) —
  documented as honest research baselines, not strong players.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1317 unit tests, build, 210
  Playwright tests.

## 2026-11-07 — Session 1: #075 Spider — Two Suits COMPLETE

- Thin module on the shared Spider family (spades and hearts).
- Deals 1–10: planner 2 solved (avg share of runs 0.28), greedy 0 (0.09), random 0 (0.00).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1306 unit tests, build, 206
  Playwright tests.

## 2026-11-07 — Session 1: #074 Spider — One Suit COMPLETE

- New shared Spider family (`shared/spider`) for #074–#076: two-deck deal for one, two or four
  suits, any-suit building with one-suit run moves, automatic run removal, deals blocked by empty
  columns, scoring; masked best-first planner and greedy agents. Shell: optional info line (deals
  left).
- Deals 1–10: planner 5 solved (avg share of runs 0.70), greedy 0 (0.17), random 0 (0.04).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1295 unit tests, build, 202
  Playwright tests.

## 2026-11-07 — Session 1: #073 FreeCell COMPLETE

- FreeCell on the shared card shell: run limits from free cells and empty columns, safe automatic
  plays home (new optional `autoPlay` hook in the shell), linear-time replay validation.
- Best-first solver on canonical positions: deals 1–50 all solved (≤ 0.13 s a decision); greedy 2,
  random 2.
- Undo now takes back the player's move together with the automatic plays after it, and pauses
  automatic plays until the next move.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1269 unit tests, build, 198
  Playwright tests.

## 2026-11-07 — Session 1: #072 Klondike — Draw Three COMPLETE

- Thin module on the shared Klondike / solitaire / cards pieces: three cards per draw with the
  waste fanned, −20 per pass, its own achievements.
- Deals 1–20: planner 2 solved (avg return 0.22), greedy 0 (0.08), random 0 (0.11).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1247 unit tests, build, 194
  Playwright tests.

## 2026-11-07 — Session 1: #071 Klondike — Draw One COMPLETE

- New shared card infrastructure: `shared/cards` (card numbering, seeded multi-deck shuffles,
  names, original SVG card art with a four-color mode), `shared/solitaire` (the patience shell:
  fitted layout with compressing fans, tap / drag / keyboard, undo, hints, automatic finish, Watch
  AI, clock, score, stats, saves, `?deal=N`), `shared/klondike` (engine for draw one and three,
  greedy and planner agents on a masked view that never peeks at face-down cards).
- `evaluateAgents` now handles single-player environments (both agents play the same deals).
- Deals 1–20: planner 9 solved (avg return 0.57), greedy 0 (0.17), random 0 (0.14).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1232 unit tests, build, 188
  Playwright tests (the Klondike spec re-run after clicking the stock's top card and centering
  the layout).

## 2026-11-07 — Session 1: #070 Gale (catalog "Bridg-It") COMPLETE

- Shown under the generic name Gale. Two interleaved dot grids on an 11 × 11 lattice, one bridge per
  slot, Orange top–bottom and Teal left–right, alternating openers, no draws.
- AI after Shannon's resistance machine (each network solved as a circuit) with alpha-beta. Seeded
  (10 games per pair): Easy vs Random 10–0, Medium vs Easy 9–1, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1196 unit tests, build, 182
  Playwright tests (the Gale spec re-run after centering the frame and moving the cursor outline to
  its own overlay).

## 2026-11-07 — Session 1: #069 Paper Soccer COMPLETE

- 8 × 10 field with two-square goals; lines never redrawn nor along the border or goal sides;
  bounces off used dots and the border; goals, own goals and the stuck loss.
- Alpha-beta over single lines. Seeded (10 games per pair): Easy vs Random 9–1, Medium vs Easy
  10–0, Hard vs Medium 8–2.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1181 unit tests, build, 180
  Playwright tests.

## 2026-11-07 — Session 1: #068 Lines of Action COMPLETE

- 8 × 8, twelve pieces a side; moves of exactly the line's piece count, jumping own pieces only,
  captures by landing, the single-group win (mover wins a double connection), draw at 300 plies.
- Alpha-beta on concentration, groups, centralization and mobility. Seeded (10 games per pair):
  Easy vs Random 10–0, Medium vs Easy 9–1, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1165 unit tests, build, 178
  Playwright tests (the e2e spec re-run after layering the board's move trail).

## 2026-11-07 — Session 1: #067 Game of the Amazons COMPLETE

- 10 × 10, four amazons a side, queen move plus arrow shot, the last player able to move wins;
  alternating openers; a three-tap board (amazon, square, arrow) with step-back and cancel.
- Custom agents on the queen-distance territory count: Medium full width one ply, Hard two plies
  over its best 12 turns. Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 9–1, Hard
  vs Medium 10–0 (a 30-candidate Hard only managed 5–5, so 12 it is).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1151 unit tests, build, 176
  Playwright tests.

## 2026-11-07 — Session 1: #066 Chinese Checkers COMPLETE

- Thin module on the shared jump-race family: the 121-hole star, two players in opposite points
  with ten marbles, hops over either color, the anti-blocking win, alternating openers.
- Seeded (6 games per pair): Easy vs Random 6–0, Medium vs Easy 5–1, Hard vs Medium 6–0; every game
  ended by filling the point.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1135 unit tests, build, 174
  Playwright tests (the board e2e specs re-run after fitting the star outline).

## 2026-11-07 — Session 1: #065 Halma COMPLETE

- New shared jump-race family `src/games/shared/jump-race/` for #065 and #066: graph geometries
  (16 × 16 square with 8 directions, the 121-hole star), steps and jump chains over either color,
  pieces locked in the far camp, the anti-blocking win (camp full with at least one own piece), a
  ply limit decided by distance left, alternating openers, an SVG board that draws the last jump
  path.
- Halma 16 × 16 with 19 pieces. Seeded: Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs Medium 4–0;
  every game ended by filling the camp.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1124 unit tests, build, 172
  Playwright tests.

## 2026-11-07 — Session 1: #064 Congkak COMPLETE

- Thin module on the shared mancala family: 7 houses × 7 seeds, stores passed only on your own side,
  relay sowing, extra turn in your store, capture from an empty own house, rounds alternate the
  opener.
- With alternating turns the opener wins almost every game whatever the levels (a pie rule was
  tried and dropped); documented in GAME_SPEC. Seeded: Easy vs Random 20–0, Medium vs Easy 19–1;
  Hard vs Medium 10–10, with Hard's margins larger (+90 opening vs Medium's +59).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1105 unit tests, build, 170
  Playwright tests.

## 2026-11-07 — Session 1: #063 Bao COMPLETE

- Bao la Kujifunza on a 4 × 8 board: each player sows around their own 16-pit ring in either
  direction; captures across the middle are sown back from the kichwa on the capture's side, relays
  from occupied pits, compulsory capture, loss with an empty front row or no two-seed pit.
- Board: choose a pit, then the neighboring pit (or a button) for the direction.
- Seeded (10 games per pair): Easy vs Random 9–1, Medium vs Easy 10–0, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1095 unit tests, build, 168
  Playwright tests (the Bao spec re-run after fixing its status assertion).

## 2026-11-07 — Session 1: #062 Oware COMPLETE

- Thin module on the shared mancala family (Abapa rules): 2–3 captures backward, the grand-slam
  exception, skipping the origin pit on big sowings, the feeding rule, win above 24.
- Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 9–1.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1078 unit tests, build, 166
  Playwright tests.

## 2026-11-07 — Session 1: #061 Kalah Mancala COMPLETE

- New shared mancala family `src/games/shared/mancala/` for #061, #062, #064: one sowing engine with
  variant rules (stores and extra turns, relay sowing, empty-pit or 2–3 captures with the grand-slam
  exception, skipping the origin pit, the feeding rule), a carved board with pebble seeds that turns
  to the player's side.
- Kalah (6 pits × 4 seeds). Seeded (10 games per pair): Easy vs Random 8–2, Medium vs Easy 10–0, Hard
  vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1068 unit tests, build, 164
  Playwright tests.

## 2026-11-07 — Session 1: #060 Yoté COMPLETE

- 5 × 6 board, 12 pieces in hand each: drop, step or jump; every capture earns a bonus removal
  (board first, then hand) as a second action; draw with three pieces or fewer each, repetition or
  200 plies.
- Alpha-beta presets. Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs
  Medium 9–0–1.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1053 unit tests, build, 162
  Playwright tests.

## 2026-11-06 — Session 1: #059 Alquerque COMPLETE

- 5×5 line board, 12 pieces each, no-retreat steps, compulsory captures with compulsory chains,
  draws by repetition or 200 quiet plies.
- The bench rejected two evaluations that lost to Random (advancement made pieces strand
  themselves; legal-move mobility read forced captures as weakness); material + plain-step room
  works. Seeded (10 games per pair): Easy vs Random 8–1–1, Medium vs Easy 10–0, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1039 unit tests, build, 160
  Playwright tests.

## 2026-11-06 — Session 1: #058 Bagh-Chal COMPLETE

- Thin module on the shared hunt family: 5×5 board with alternate diagonals, four tigers in the
  corners, twenty goats placed one per turn and then moved; single tiger jumps, five captures win
  for the tigers, immobilized tigers lose; repetition or 300 plies draw.
- Seeded (10 games per pair): Easy vs Random 7–0–3, Medium vs Easy 8–1–1, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1025 unit tests, build, 158
  Playwright tests.

## 2026-11-06 — Session 1: #057 Fox and Geese COMPLETE

- New shared hunt family `src/games/shared/hunt/` for #057–#058: point-graph boards (holes and
  diagonal points), prey that may not retreat or that are placed from hand, hunter jumps (chained
  for the fox), capture goals, trapped-hunter wins, original goose/goat/fox/tiger art.
- Fox and Geese: 33-point cross, 13 geese, 8 captures for the fox. The bench showed geese drawing by
  shuffling sideways, so stalling (repetition / ply limit) now counts as the fox's escape and the
  evaluation rewards advancing geese. Seeded: Easy vs Random 14–6, Medium vs Easy 17–3 (20 games),
  Hard vs Medium 7–3 (10 games).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 1015 unit tests, build, 156
  Playwright tests (then "Agree draw" was hidden for Fox and Geese, which cannot be drawn; e2e rerun).

## 2026-11-06 — Session 1: #056 Tablut COMPLETE

- Thin module on the shared tafl family: 9×9, 16 attackers against 8 defenders and the king,
  escape to any edge square; the king falls to four attackers on the throne, three plus the throne
  beside it, and a plain sandwich elsewhere. Hard uses the fast mutable-board search (1 s).
- Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 999 unit tests, build, 154
  Playwright tests.

## 2026-11-06 — Session 1: #055 Hnefatafl COMPLETE

- New shared tafl family `src/games/shared/tafl/` for #055–#056: rook moves, restricted throne and
  corners, custodial captures against pieces or hostile squares, armed king, corner or edge escape,
  four-sided or Tablut-style king capture, original crowned king art.
- Hnefatafl 11×11 (corner escape). The first Hard (generic alpha-beta) split 4–5–1 with Medium on
  this branching factor; a dedicated mutable-board search with Zobrist hashing now goes deeper.
  Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 7–3, Hard vs Medium 9–0–1.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 989 unit tests, build, 152
  Playwright tests (the king rendered smaller than the other pieces on the screenshot; fixed, e2e
  rerun on a fresh build).

## 2026-11-06 — Session 1: #054 Fanorona COMPLETE

- 5 × 9 line board, approach / withdrawal captures of whole lines, compulsory capture, capture
  chains (no repeated direction, no revisits, optional stop), draw by repetition or 30 quiet turns.
  The adapter's state key now includes an open chain so the transposition table cannot confuse a
  mid-chain position with the same board between turns.
- Alpha-beta presets. Seeded (10 games per pair): Easy vs Random 8–2, Medium vs Easy 10–0, Hard vs
  Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 973 unit tests, build, 150
  Playwright tests.

## 2026-11-06 — Session 1: #053 Konane COMPLETE

- 6×6 full checkerboard; two opening removals (Black middle/corner, White next to the hole), then
  straight-line jumps with optional multi-jumps; no jump loses. The first bench crashed on an
  endless capture loop in multi-jumps (it stepped over the landing cell); fixed and covered.
- Alpha-beta on jump mobility. Seeded (10 games per pair): Easy vs Random 8–2, Medium vs Easy
  10–0, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 958 unit tests, build, 148
  Playwright tests (the seat icon colors were swapped on the screenshot; fixed, e2e rerun).

## 2026-11-06 — Session 1: #052 Clobber COMPLETE

- 6×6 full checkerboard; move onto an adjacent enemy stone to remove it; no move loses.
- The bench showed mobility is always equal in Clobber (each touching pair gives one move to each
  side) and heuristic alpha-beta barely beat Random (14–6 at depth 4); the levels are MCTS-based
  (Hard: 1.5 s MCTS, exact alpha-beta at ≤ 10 moves). Seeded (10 games per pair): Easy vs Random
  9–1, Medium vs Easy 9–1, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 945 unit tests, build, 146
  Playwright tests (the Clobber e2e first moved a White stone as Black; fixed and rerun).

## 2026-11-06 — Session 1: #051 Sprouts COMPLETE

- Real-geometry Sprouts on a fine grid: curves are cell paths, living spots keep reserved room,
  regions decide which spots can be joined, the new spot goes on a roomy straight stretch. A
  bounds check (every game between 2n and 3n − 1 moves) caught two discretization artifacts —
  reserved cells of dead spots walling off corridors, and new spots born boxed in on a bend — both
  fixed; 600 random games then stayed within bounds.
- Freehand drawing (drag, rub out, snap to a spot) plus tap-two-spots auto-routing; Monte Carlo
  agents over routed candidate curves. Seeded (12 games per pair): Easy vs Random 10–2, Medium vs
  Easy 8–4, Hard vs Medium 11–1 (Medium lightened after tying a first Hard 6–6).
- Played a full game in the browser (mobile, Spanish) against Medium; added curve simplification
  (no cell staircase) and no text selection while drawing after that check.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 931 unit tests, build, 144
  Playwright tests (Sprouts unit and e2e tests rerun after the visual fixes).

## 2026-11-06 — Session 1: #050 SOS COMPLETE

- 6×6 grid, write S or O; each S-O-S through the new letter scores and grants another turn (the
  state records each writer for undo); scored lines drawn in the scorer's color; letter picker.
- Greedy Easy/Medium (safe moves, cheapest sacrifice) and a Hard alpha-beta over net points.
  Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 8–0–2, Hard vs Medium 6–3–1
  (a modest margin, documented as such).
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 915 unit tests, build, 142
  Playwright tests.

## 2026-11-06 — Session 1: #049 Sim COMPLETE

- Six points, 15 lines; closing a triangle of your own color loses. An exact memoized solver
  (~112 000 positions, milliseconds) confirms the known second-player win; Hard never loses as
  second (tested). Hexagon board with polygon touch areas and a "would close your triangle" warning.
- Seeded (40 games per pair): Easy vs Random 38–2, Medium vs Easy 33–7, Hard vs Medium 28–12.
- The e2e hung clicking a line whose center lies under a crossing line's touch area; the spec now
  dispatches clicks on the line, and hover tints only apply on devices that can hover.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 901 unit tests, build, 140
  Playwright tests (Sim e2e rerun after the fix).

## 2026-11-06 — Session 1: #048 Cram COMPLETE

- Thin module on the shared domino family (both orientations for both seats, 5×6). Cram is
  impartial, so the bench showed a zero evaluation leaving Easy and Medium at chance (5–5, 4–6);
  leaves now use a parity estimate (dominoes that still fit, packed greedily).
- Seeded (10 games per pair): Easy vs Random 7–3, Medium vs Easy 10–0, Hard vs Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 885 unit tests, build, 138
  Playwright tests.

## 2026-11-06 — Session 1: #047 Domineering COMPLETE

- New shared domino family `src/games/shared/dominoes/` for #047–#048: one engine (per-seat
  orientations, stuck player loses), a mutable-array alpha-beta with a transposition table,
  blocking-first ordering and a mobility + safe-move evaluation, a grid board where you tap a cell
  and then a highlighted neighbor; tests solve small boards exactly against known results.
- Domineering 8×8. Seeded (10 games per pair): Easy vs Random 10–0, Medium vs Easy 9–1, Hard vs
  Medium 10–0.
- Verified (actually run): lint, typecheck, `vitest run --maxWorkers=6` → 874 unit tests, build, 136
  Playwright tests (pip size on vertical dominoes adjusted afterwards; Domineering e2e rerun).

## 2026-11-06 — Session 1: #046 Kayles COMPLETE

- Row of 10–20 pins (drawn per round); knock one pin or two neighbors; last pin wins. Grundy
  table checked against the published sequence and a brute-force search of all 10-pin positions;
  original pin art that topples.
- Seeded (40 games per pair): Easy vs Random 25–15, Medium vs Easy 34–6, Hard vs Medium 34–6.
- Verified (actually run): the first `npm run verify` hit 55–77 timeouts while the machine was at
  load 28–38 from other apps (no assertion failures except a time-limited Gomoku strength check);
  rerun as its steps: lint, typecheck, `vitest run --maxWorkers=4` → 858 unit tests, build, 134
  Playwright tests, all passing.

## 2026-11-06 — Session 1: #045 Chomp COMPLETE

- Chocolate bar with a poisoned corner; bites remove everything below/right; bar size drawn per
  round from five sizes. Exact memoized solver over Young-diagram shapes, unit-tested against the
  known results (first player wins every rectangle, (1,1) on squares, two-row rule, symmetric L).
- Seeded (40 games per pair): Easy vs Random 27–13, Medium vs Easy 31–9, Hard vs Medium 36–4; a
  20-game variant of the ordering test was too noisy and now uses the 40-game setup.
- Mobile screenshot: uneven rows and a barely visible bite preview; rows are now equal and the
  preview is hatched and outlined.
- Verified (actually run): `npm run verify` → 842 unit tests, build, 132 Playwright tests (Chomp
  unit and e2e tests rerun after the CSS fix).

## 2026-11-06 — Session 1: #044 Subtraction Game COMPLETE

- Thin module on the shared heap family: one heap of 15–30, take 1–3 (only the last three
  counters are selectable); the solver matches the multiples-of-four theory up to 30.
- Seeded (40 games per pair): Easy vs Random 27–13, Medium vs Easy 33–7, Hard vs Medium 33–7.
- The 44th title made the AI Lab "Games" label lookup ambiguous in the platform e2e; the Lab selects
  now carry `lab-game` / `lab-games` test ids.
- Verified (actually run): `npm run verify` → 824 unit tests, build, 130 Playwright tests.

## 2026-11-06 — Session 1: #043 Wythoff's Game COMPLETE

- Thin module on the shared heap family: two heaps of 4–15, take from one heap or the same from
  both (the board's "From both heaps" toggle / `B`); the solver matches the golden-ratio pairs on
  every position up to 15 × 15.
- Seeded (40 games per pair): Easy vs Random 28–12, Medium vs Easy 34–6, Hard vs Medium 31–9.
- Mobile screenshot: two-digit heap labels wrapped; the shared board now shows a letter tile and
  the size (full names stay in the accessible labels).
- Verified (actually run): `npm run verify` → 812 unit tests, build, 128 Playwright tests (Nim/Wythoff
  unit and e2e tests rerun after the label change).

## 2026-11-06 — Session 1: #042 Misère Nim COMPLETE

- Thin module on the shared heap family (misère flag): the last counter loses; the solver's
  misère results are unit-tested against the classic rule (nim-sum, except all-single heaps).
- Seeded (40 games per pair): Easy vs Random 27–13, Medium vs Easy 35–5, Hard vs Medium 35–5.
- Verified (actually run): `npm run verify` → 800 unit tests, build, 126 Playwright tests.

## 2026-11-06 — Session 1: #041 Nim COMPLETE

- New shared heap family `src/games/shared/heaps/` for #041–#044: one engine (heaps, allowed
  amounts, Wythoff's both-heaps move, normal/misère), seeded random setups per round, an exact
  memoized solver unit-tested against the known theory (nim-sum, misère rule, Wythoff golden-ratio
  pairs, multiples of four), accuracy-based agents, a counters board with mark-then-confirm.
- Nim: 3–5 heaps of 1–9. Seeded (40 games per pair): Easy vs Random 29–11, Medium vs Easy 33–7,
  Hard vs Medium 36–4; Hard never loses a winning start (tested).
- Verified (actually run): `npm run verify` → 788 unit tests, build, 124 Playwright tests.

## 2026-11-06 — Session 1: #040 Dots and Boxes COMPLETE

- 4×4 boxes (40 lines); closing a box claims it and draws again; the state records who drew each
  line so the shell's undo and turn tracking work with repeated turns.
- Easy/Medium greedy agents (safe lines; Medium gives away the smallest chain) and a Hard negamax
  with captures as free depth, a line-mask transposition table and double-dealing moves; a unit
  test checks Hard double-deals in a 4-chain + 12-chain position. Seeded (10 games per pair): Easy
  vs Random 10–0, Medium vs Easy 8–2, Hard vs Medium 10–0.
- e2e could not click SVG `<line>` hit targets (zero-height boxes): they are now rectangles that
  stop short of the dots; the keyboard cursor no longer recolors lines drawn by pointer.
- Played a full game in the browser (mobile, Spanish) against Hard: lost 0–16 with careless lines.
- Verified (actually run): `npm run verify` → 766 unit tests, build, 122 Playwright tests.

## 2026-11-06 — Session 1: #039 Isolation COMPLETE

- 7×7 tiles, one pawn each; a turn is a king step then the removal of any free tile; whoever cannot
  step at the start of their turn loses (no draws, no "Agree draw"). Two actions per turn, so the
  shell's undo against the computer steps back one human action at a time (tested).
- Alpha-beta on mobility (own steps ×3, opponent's ×4, two-step areas). Tuning found a 4-action
  search losing 4–8 to a 2-action one (it stops right after the opponent's reply); 6 actions won
  12–0, so Medium searches 6. Shipped presets: Easy vs Random 8–0, Medium vs Easy 7–1, Hard vs
  Medium 7–1.
- Played in the browser (mobile, Spanish) against Medium: two-step turns, status line, the CPU
  removing a tile next to my pawn.
- Verified (actually run): `npm run verify` → 752 unit tests, build, 120 Playwright tests.

## 2026-11-06 — Session 1: #038 Breakthrough COMPLETE

- 8×8, sixteen pawns each: straight steps onto empty cells, diagonal steps that may capture; the
  first pawn on the far row wins, as does capturing everything. A "no moves" rule was dropped
  after proving it unreachable (the most advanced pawn always has a free or capturable diagonal).
- Alpha-beta presets (material, squared advancement, home-row defenders, hanging pawns, decisive
  bonus for an unstoppable runner); captures first. Easy 1 ply + 25% random, Medium 3, Hard
  iterative deepening 1 s. Seeded (8 games per pair): Easy vs Random 8–0, Medium vs Easy 7–1,
  Hard vs Medium 8–0.
- Board flips for the Black side; original pawn art; no "Agree draw" (the game cannot be drawn).
- Played in the browser (mobile, Spanish) as Black against Hard: flipped board, steps, AI replies;
  fixed uneven row heights and a low-contrast last-move mark found there.
- Verified (actually run): `npm run verify` → 738 unit tests, build, 118 Playwright tests (rerun the
  Breakthrough unit and e2e tests after the CSS fix).

## 2026-11-06 — Session 1: #037 Ataxx COMPLETE

- 7×7 open board: clone to a neighbor or jump two cells, converting every adjacent enemy piece;
  forced pass without a move; ends on a full board, a wipeout, no moves for either side or 400
  plies (most pieces wins), threefold repetition draws.
- Alpha-beta presets on piece difference with a small bonus for surrounded pieces, clones first
  (Easy 1 ply + 25% random, Medium 2, Hard iterative deepening 1 s). Seeded: Easy vs Random 8–0,
  Medium vs Easy 8–0, Hard vs Medium 7–0–1.
- Played in the browser (mobile, Spanish) against Medium: clone, jump, conversions both ways; added
  a ring on the last destination after the screenshot review.
- Verified (actually run): `npm run verify` → 724 unit tests, build, 116 Playwright tests.

## 2026-11-06 — Session 1: #036 Teeko COMPLETE

- 5×5 board, four markers each: a drop phase, then single-step moves in eight directions; four in
  a straight line or a 2×2 square wins (44 shapes); repetition and 200-ply draws.
- Alpha-beta presets with an open-shape evaluation (Easy 2 plies + 25% random, Medium 4, Hard
  iterative deepening 1 s). Seeded: Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 10–0.
- Verified (actually run): `npm run verify` → 710 unit tests, build, 114 Playwright tests.

## 2026-11-06 — Session 1: #035 Nesting Tic-Tac-Toe COMPLETE

- Catalog "Gobblet Gobblers" under a generic name with original cup art: 3×3, six cups in three
  sizes per side, place or move a visible cup over a strictly smaller one; lifting a cup can reveal
  the opponent's line, which then wins for them; repetition and 120-ply draws.
- Alpha-beta presets with a visible-line evaluation (Easy 2 plies + 25% random, Medium 4, Hard
  iterative deepening 1 s). Seeded: Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 6–4
  (the first player is strongly favored, so seats decide many games between good players).
- Verified (actually run): `npm run verify` → 697 unit tests, build, 112 Playwright tests.

## 2026-11-06 — Session 1: #034 Pentago COMPLETE

- 6×6 board of four rotating 3×3 quadrants: place a marble, then twist one quadrant 90°; five in
  a row wins (both at once, or a full board, is a draw); a placement that already makes five wins
  without the twist.
- `PentagoSearchAgent`: negamax over (place, twist) on raw boards, static ordering with a beam,
  iterative deepening. The bench caught children sorted worst-first (the beam kept the worst
  moves); fixed, and Medium got a narrower beam so the levels separate.
- Seeded (10/10/8 games): Easy vs Random 10–0, Medium vs Easy 9–1, Hard vs Medium 3–0–5.
- Verified (actually run): `npm run verify` → 685 unit tests, build, 110 Playwright tests.

## 2026-11-06 — Session 1: #033 Quarto COMPLETE

- 16 pieces with four binary traits (original SVG art: tall/short, dark/light, square/round,
  hollow/solid); each turn places the given piece and chooses the opponent's next one; any line of
  four sharing a trait wins at once (automatic "Quarto!").
- `QuartoSearchAgent`: negamax over whole turns, winning placements first, poisoned gives last,
  safe-piece count at the leaves. Seeded: Easy vs Random 10–0, Medium vs Easy 9–0–1, Hard vs
  Medium 8–0–2.
- Mobile screenshot showed stretched oval cells spilling off the round board; the grid now has
  square rows and is inscribed in the circle.
- Verified (actually run): `npm run verify` → 670 unit tests, build, 108 Playwright tests.

## 2026-11-06 — Session 1: #032 Six Men's Morris COMPLETE

- Thin module on the shared Morris family: two concentric squares (16 points, 8 mills), six pieces
  each, placement, sliding (no flying), removal on a mill, loss at two pieces or blocked.
- Seeded (12 games per pair): Easy vs Random 10–0–2, Medium vs Easy 10–0–2, Hard vs Medium 7–0–5
  (the draws are repetitions between two careful players).
- Verified (actually run): `npm run verify` → 656 unit tests, build, 106 Playwright tests.

## 2026-11-06 — Session 1: #031 Three Men's Morris COMPLETE

- Thin module on the shared Morris family: 3×3 board with both diagonals, three pieces each,
  placement then sliding along lines (no flying, no removal); three on a row or column wins (the
  diagonals are only for moving).
- Screenshot check: target glows covered the board lines on the small board; they now sit under
  the lines (shared Morris board).
- Seeded (12 games per pair): Easy vs Random 12–0–0, Medium vs Easy 8–0–4, Hard vs Medium 0–0–12.
  The game is a draw with good play, so Medium and Hard are both sound; the spec says so plainly.
- Verified (actually run): `npm run verify` → 646 unit tests, build, 104 Playwright tests.

## 2026-11-06 — Session 1: #030 Nine Men's Morris COMPLETE

- Shared Morris family `src/games/shared/morris/`: one engine for 9/6/3 men (placement, sliding,
  flying at three, mills with removal choice — pieces in mills protected unless all are — loss at
  two pieces or when blocked, repetition and quiet-move draws); generic alpha-beta presets with a
  mobility-aware evaluation; SVG board with the mill drawn, removal step and pieces-in-hand trays.
- Bench found Hard blocked at the end of placement: mobility now counts in every phase and Medium
  searches 2 plies. Seeded (12 games per pair): Easy vs Random 12–0–0, Medium vs Easy 12–0–0,
  Hard vs Medium 11–0–1.
- Verified (actually run): `npm run verify` → 636 unit tests, build, 102 Playwright tests.

## 2026-11-06 — Session 1: #029 Hex 11×11 COMPLETE

- Thin module on the shared Hex family (levels: 300 fills with 20% random moves, 6 000 fills,
  1.5 s, 2.5 s), the standard competition size.
- Seeded bench: Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs Medium 4–2, Expert vs Hard 3–1 (on
  this board the extra time helps, so Expert stays).
- Verified (actually run): `npm run verify` → 619 unit tests, build, 100 Playwright tests.

## 2026-11-06 — Session 1: #028 Hex 7×7 COMPLETE

- Shared Hex family `src/games/shared/hex/`: rhombus board, the swap rule (second player may take
  the first stone's mirrored point once), win detection with the connecting path highlighted;
  `HexMctsAgent` (UCT with random-fill playouts; a full board always has exactly one winner) with a
  swap decision; hexagon SVG board with colored edges.
- Seeded bench: Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs Medium 4–2. A 2 s Expert went 1–3
  against Hard on 7×7, so this board ships with three levels.
- Shell: new `drawless` definition flag hides "Agree draw" for games that cannot be drawn (Hex,
  Go — noticed on the Hex screenshot).
- Verified (actually run): `npm run verify` → 607 unit tests, build, 98 Playwright tests.

## 2026-11-06 — Session 1: #027 Go 19×19 COMPLETE

- Thin module on the shared Go family (levels: 200/800 playouts, 2 s); `goPresets` now takes an
  optional Expert.
- Seeded bench (two games per pairing; a 19×19 game runs 280–480 plies): Easy vs Random 2–0
  (+21.5), Medium vs Easy 2–0 (+48), Hard vs Medium 2–0 (+63). A 3 s Expert split 1–1 with Hard,
  so 19×19 ships with three levels.
- Verified (actually run): `npm run verify` → 591 unit tests, build, 96 Playwright tests.

## 2026-11-06 — Session 1: #026 Go 13×13 COMPLETE

- Thin module on the shared Go family (levels: 300/1 500 playouts, 1.5 s, 2.5 s).
- Seeded bench (two games per pairing): Easy vs Random 2–0 (+46), Medium vs Easy 2–0 (+23.5), Hard
  vs Medium 2–0 (+63), Expert vs Hard 2–0 (+32).
- Verified (actually run): `npm run verify` → 581 unit tests, build, 94 Playwright tests.

## 2026-11-06 — Session 1: #025 Go 9×9 COMPLETE

- Shared Go family `src/games/shared/go/`: rules with captures, no suicide, positional superko,
  passing, Tromp–Taylor area scoring with komi 7.5; `GoMctsAgent` (UCT + RAVE, playouts that never
  fill their own eyes and capture atari groups, passes when ahead after a pass); definition on the
  shared `GoBoard` with a pass button and the counted territory shown at the end.
- Found and fixed my own infinite loop in the playout move picker (stale length after removals);
  made tree tie-breaks deterministic (no `Math.random`) so seeded tests are reproducible.
- Seeded bench 9×9: Easy vs Random 6–0 (+20.8), Medium vs Easy 6–0 (+22.2), Hard vs Medium 4–0
  (+21.3), Expert vs Hard 4–0 (+12.5).
- Played in the browser (mobile): capture, two passes, territory and the area count.
- Verified (actually run): `npm run verify` → 571 unit tests, build, 92 Playwright tests.

## 2026-11-06 — Session 1: #024 Janggi COMPLETE

- New `janggi.ts` next to xiangqi: palace diagonals for generals/guards/chariots/cannons/soldiers,
  long elephant, cannons that need a non-cannon screen to move or capture, passing, bikjang and
  two passes / 300 plies decided on points (Han +1.5), threefold repetition with perpetual-check
  loss; four horse/elephant setups per side drawn per round and validated in saves. Start move
  count (31 + pass) checked by hand.
- The point board became generic (`createPointBoard`: river on/off, pass button); original
  octagonal pieces sized by rank.
- Search found by the bench: Easy lost one game on points by passing back while behind → the
  search now scores a pass after a pass as a points win/loss. Seeded: Easy vs Random 8–0, Medium
  vs Easy 8–0, Hard vs Medium 4–0, Expert vs Hard 4–0.
- Played in the browser (1280×800): setups line, palace move, pass button.
- Verified (actually run): `npm run verify` → 555 unit tests, build, 90 Playwright tests.

## 2026-11-06 — Session 1: #023 Xiangqi COMPLETE

- Shared engine `src/games/shared/xiangqi/`: mutable 9×10 position (palace, river, horse legs,
  elephant eyes, cannon screens, flying generals) — perft 44 / 1 920 / 79 666 / 3 290 240 matches
  the published values after fixing my own palace bound bug (generals could step off the board:
  depth 1 gave 47); immutable layer with stalemate-loses, threefold repetition with perpetual-check
  loss, 120-ply no-capture and no-attackers draws; search with contempt.
- Board drawn as lines through intersections with river and palace diagonals; original round
  pieces with characters and Latin letters.
- Seeded bench: Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs Medium 4–0, Expert vs Hard 4–0.
- Played in the browser (mobile): cannon h2–e2, board fits 375 px.
- Verified (actually run): `npm run verify` → 534 unit tests, build, 88 Playwright tests.

## 2026-11-06 — Session 1: #022 Animal Shogi 3×4 COMPLETE

- Catalog entry "Dōbutsu Shōgi" shipped under the generic title "Animal Shogi 3×4" with original
  animal tiles (movement dots), since the product name is a trademark.
- Thin module on the shared shogi family (`ANIMAL`: royal capture, try rule, compulsory hen
  promotion, threefold repetition). Portrait board sized by the available height on phones.
- The bench exposed an engine weakness: Expert vs Hard was 0–0–6 (both repeated into draws).
  Added draw contempt to `ShogiSearchAgent` (also used by #021) → Easy vs Random 10–0, Medium vs
  Easy 10–0, Hard vs Medium 6–0, Expert vs Hard 6–0.
- Verified (actually run): `npm run verify` → 514 unit tests, build, 86 Playwright tests.

## 2026-11-06 — Session 1: #021 Shogi COMPLETE

- Shared shogi family `src/games/shared/shogi/`: piece tables with oriented vectors and reverse
  attack masks, mutable position with drops (nifu, dead drops, uchifuzume), compulsory/optional
  promotion, Zobrist keys; perft 30 / 900 / 25 470 / 719 731 matches the published values (depth 4
  in ~0.4 s). Immutable game layer with Western notation, checkmate/no-moves, fourfold repetition
  with perpetual-check loss, 512-ply limit; replay validation with a prefix cache. Also covers the
  3×4 animal variant (royal capture, try rule) for #022.
- `ShogiSearchAgent` (alpha-beta, quiescence, TT, killers, ID; pawn-drop-mate filtered in search).
  Seeded bench: Easy vs Random 5–0–1, Medium vs Easy 6–0, Hard vs Medium 4–0, Expert vs Hard 4–0.
- Original pieces: wooden wedges with kanji (red when promoted) plus a small Latin letter; board
  with hands as trays, promotion dialog, drops by tapping the hand.
- Played in the browser (1280×800): 7g7f 3c3d Bx2b+ (dialog), Sx2b, B*5e from the hand.
- Verified (actually run): `npm run verify` → 514 unit tests (incl. the drafted #022 module), build,
  84 Playwright tests.

## 2026-11-06 — Session 1: #020 Gardner Minichess COMPLETE (chess family done)

- Thin module on the shared chess family (`GARDNER`, 5×5): the board, codec (3 752 actions) and
  tensor follow the variable size; deeper levels (Medium 3, Hard 6 plies).
- Seeded bench with the module's presets: Easy vs Random 6–0–2, Medium vs Easy 8–0, Hard vs Medium
  2–0–4 (drawish small-board endings), Expert vs Hard 6–0.
- Verified (actually run): `npm run verify` → 488 unit tests (incl. the started shogi engine's
  13), build, 82 Playwright tests.

## 2026-11-06 — Session 1: #019 Three-Check Chess COMPLETE

- Thin module on the shared chess family (`THREE_CHECK`): counters in the status line next to the
  check indicator, counters validated by the save replay, only bare kings are dead.
- Seeded bench: Easy vs Random 8–0, Medium vs Easy 8–0, Hard vs Medium 4–0, Expert vs Hard 4–0.
- Verified (actually run): `npm run verify` → 475 unit tests, build, 80 Playwright tests.

## 2026-11-06 — Session 1: #018 King of the Hill Chess COMPLETE

- Thin module on the shared chess family (`KING_OF_THE_HILL`): hill squares marked on the board and
  listed in the status line; dead-position draws disabled for this goal (a bare king can still
  reach the hill), so flag falls always lose.
- Seeded bench: Easy vs Random 8–0, Medium vs Easy 8–0, Hard vs Medium 2–0–2 (two repetitions),
  Expert vs Hard 4–0 (games end on the hill).
- Verified (actually run): `npm run verify` → 475 unit tests (incl. drafted #019/#020), build, 78
  Playwright tests.

## 2026-11-06 — Session 1: #017 Antichess COMPLETE

- Thin module on the shared chess family (`ANTICHESS`): compulsory captures, non-royal king,
  king promotion, win by losing everything or being blocked, opposite-colored-bishops dead draw
  (new `bishopsNeverMeet`), status line with pieces left and "You must capture".
- Found a real engine flaw through the bench: Easy only scored 4–3–1 against Random because the
  quiescence search allowed "stand pat" while a capture was compulsory. Added a dedicated antichess
  quiescence (forced capture chains, no stand pat) → Easy vs Random 8–0, Medium vs Easy 8–0, Hard
  vs Medium 3–1, Expert vs Hard 4–0. Standard-chess tactics checks unchanged.
- Shared changes riding along (used by #018/#019): hill-square marking on the board, check
  indicator shown together with the Three-Check counters.
- Verified (actually run): `npm run verify` → 462 unit tests (incl. drafted #018/#019 modules),
  build, 76 Playwright tests.

## 2026-11-06 — Session 1: #016 Chess960 COMPLETE

- Thin module on the shared chess family: random start per round via the definition's `seed`,
  `restart` keeps it, start number in the status line (`chess960Number`), castling by moving the
  king onto its rook (tested from the UI with a setup where O-O is legal on move one).
- Engine: saves/deserialized states must start from a position the variant allows
  (`isAllowedStart`; also tightens #015). Dead-position rule made variant-aware (King of the Hill
  never dead, Three-Check only K v K, Antichess opposite-colored bishops) ahead of #017–#019.
- Seeded bench (starts 0–7): Easy vs Random 8–0, Medium vs Easy 8–0, Hard vs Medium 4–0, Expert vs
  Hard 4–0.
- Played in the browser (mobile): position #215 drawn, bishops on opposite colors, king between
  the rooks.
- Verified (actually run): `npm run verify` → 434 unit tests (incl. the drafted #017 module's),
  build, 74 Playwright tests.

## 2026-11-06 — Session 1: #015 Chess COMPLETE

- Shared chess family `src/games/shared/chess/`: mailbox `Position` with Zobrist keys, legal move
  generation, make/unmake and perft (start position to depth 4, Kiwipete, positions 3–6 and three
  Chess960 positions match the published counts); FEN with Shredder castling letters; immutable
  game layer with SAN, every automatic draw rule and the five variant goals (#015–#020); replay
  validation with a prefix cache so validating a game's consecutive states stays linear.
- `ChessSearchAgent` (negamax alpha-beta, quiescence, TT, MVV-LVA + killers, iterative deepening,
  PSTs, endgame king activity, mop-up, repetition awareness from the real history). Fixed my own
  sign error in the variant-win terminal (it made King of the Hill avoid the hill) before shipping.
- Shell: optional clocks (time controls, increment, flag fall → draw when the opponent cannot
  mate), resignation and agreed draws with confirmation, `perspective` for boards, `restart` hook;
  timed rounds have no undo. 2 new match-flow tests; older games unchanged.
- Original piece set (`ChessPieces.tsx`) and board: click or drag, castling on the rook, promotion
  picker, last move/check/hint highlights, captured pieces with material balance, SAN move list
  localized (R D T A C in Spanish), side layout on wide screens.
- Seeded bench (colors alternated): Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 6–0,
  Expert vs Hard 6–0.
- Played in the browser: drag e2–e4 vs CPU on 3+2 (clock charged + increment), Black perspective,
  mobile 375 px, desktop 1280×720 (board fits beside the scoreboard). No console errors.
- Found a flaky pre-existing test: Reversi 6×6 "Hard beats Medium" used a 250 ms wall-clock budget
  and failed 3–3 under parallel load. Replaced it with a deterministic stand-in (depth 6 + exact
  last 14 empties; the real Hard reaches depth 8–9 and solves 14+ empties in 800 ms) → 6–0.
- Verified (actually run): `npm run verify` → 405 unit tests, build, 72 Playwright tests.

## 2026-11-06 — Session 1: #014 Spanish Checkers COMPLETE

- `SPANISH` variant on the shared draughts family (other parity, flying kings, forward-only men,
  quantity-then-quality capture law); king-capture achievement replay cross-checked on random games.
- Seeded: Easy vs Random 10–0, Medium vs Easy 9–0–1, Hard vs Medium 8–0 (avg 549 ms).
- Verified (actually run): `npm run verify` → 363 unit tests, build, 70 Playwright tests.

## 2026-11-06 — Session 1: #013 International Draughts COMPLETE

- FMJD rules on the shared draughts family (`INTERNATIONAL` variant); achievement replay moved to
  `src/games/shared/draughts/feats.ts` (used by #012 and #013), cross-checked on random games.
- Seeded: Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 7–0–1 (avg 622 ms).
- Verified (actually run): `npm run verify` → 352 unit tests, build, 68 Playwright tests.

## 2026-11-06 — Session 1: #012 English Checkers COMPLETE

- Shared draughts family `src/games/shared/draughts/` (parameterized engine with English,
  International and Spanish variants; environment/evaluation; alpha-beta presets; board with
  step-by-step multi-jump entry and captured-piece preview; shell definition builder). 14
  hand-built rule tests across the three variants; the position helper rejects pieces on
  non-playable squares (it caught several of my own fixture mistakes).
- Shell: `actionSound` now receives the previous state (needed to detect crowning).
- Seeded results (English): Easy vs Random 10–0, Medium vs Easy 9–1–0, Hard vs Medium 7–1–0.
- Verified (actually run): `npm run verify` → 341 unit tests, build, 66 Playwright tests.

## 2026-11-06 — Session 1: #011 Reversi 6×6 COMPLETE

- Thin module on the shared Reversi family; levels tuned for 6×6 (Hard: exact endgame in the last
  18 of 32 empties). Measured the strong White (second-player) advantage of 6×6; the strength test
  compares Hard as White vs Medium as Black (majority), since "never loses" was not true.
- Verified (actually run): `npm run verify` → 314 unit tests, build, 64 Playwright tests.

## 2026-11-06 — Session 1: #010 Reversi 8×8 COMPLETE

- Shared Reversi family `src/games/shared/reversi/` (engine with explicit pass action and
  end-when-nobody-can-move, `ReversiSearchAgent` with corner-aware weights, mobility, iterative
  deepening and exact endgame; felt board with flip animation, legal-move dots and Pass bar).
- Seeded results: Easy vs Random 19–0–1, Medium vs Easy 20–0, Hard vs Medium 16–0 (avg 520 ms).
  Exact endgame move matches brute force on 12 random 6×6 endgames. Found and fixed: the endgame
  timeout fallback ran without a time limit.
- Screenshot review fix: the board frame overlapped coordinate labels on phones.
- Verified (actually run): `npm run verify` → 304 unit tests, build, 62 Playwright tests.

## 2026-11-06 — Session 1: #009 Pente COMPLETE

- Dedicated capture engine (custodial pairs in 8 directions, multi-captures, safe moves into a
  bracket, five-or-more and five-pairs wins, center opening + tournament rule).
- AI on the generic `AlphaBetaAgent` with capture-aware candidate pruning. Measurement found a
  horizon bug (3/4-ply lost to 2-ply because leaf evaluation ignored tempo and immediate fours);
  fixed with tempo weighting and explicit four/double-four detection. Seeded (with 8% randomness
  for variety): Easy vs Random 10–0, Medium vs Easy 15–1, Hard (5 plies/10 candidates) vs Medium 20–4.
- Shell: optional `statusInfo` live line (capture counter).
- Replaced a meaningless assertion I had written (type check of a boolean) with a real
  double-capture history test.
- Verified (actually run): `npm run verify` → 284 unit tests, build, 60 Playwright tests.

## 2026-11-06 — Session 1: #008 Renju COMPLETE

- RIF forbidden-move detector (`src/games/renju/forbidden.ts`): exact five, overline, fours
  (same-line 4-4, straight four), recursive real-three (3-3) with fake-three handling, fast path.
  Hand-verified pattern tests (9). Forbidden points are illegal for Black, marked with a red ✕,
  disabled and announced as "forbidden for Black"; the AI applies the check at every search node.
- Documented simplification: tournament opening protocol (swap / two fifth moves) not implemented;
  RIF center first stone enforced.
- Bug found and fixed (affected #007): the shell's "alternate who starts" let White move first in
  round 2 of stone games. New `MatchConfig.fixedFirstSeat` (Black always opens; menu hides the
  toggle) with a regression test.
- Verified (actually run): `npm run verify` → 267 unit tests, build, 56 Playwright tests.

## 2026-11-06 — Session 1: #007 Gomoku COMPLETE

- Freestyle 15×15 on the m,n,k engine. New shared pieces: `src/games/shared/goban/` (intersection
  board with coordinates, star points, shaded stones, tap-to-preview/tap-again-to-place on touch;
  stone-game definition builder) and `src/games/shared/five/agent.ts` (candidate generation near
  stones, window attack/defense scores, alpha-beta with root iterative deepening).
- Measurement caught a flaw: 3-ply search lost to the greedy level because the evaluation ignored
  tempo; fixed (side to move's windows weighted ×1.5). Final seeded results: Easy vs Random 20–0,
  Medium vs Easy 20–0, Hard vs Medium 9–0–3, Expert vs Hard 10–0 (avg 154 ms, ≤ 830 ms).
- Shell: optional wide layout (board left, scores/controls right ≥ 960 px) for large boards.
- Verified (actually run): `npm run verify` → 244 unit tests, build, 54 Playwright tests
  (mobile uses real double taps). Screenshots reviewed.

## 2026-11-06 — Session 1: #006 Connect Five Gravity COMPLETE

- 9×7 gravity board, five in a row (six+ also wins), on the shared gravity family. Levels tuned by
  measurement: Easy vs Random 29–0–1, Medium (4 plies) vs Easy 18–1–1, Hard (600 ms, ≈ depth 12)
  vs Medium 12–0. 6 achievements (incl. six-run, diagonal).
- Fix found in screenshot review (shared with #005): winning-disc rings were drawn under the board
  frame and invisible; they now render above it.
- Verified (actually run): `npm run verify` → 228 unit tests, build, 50 Playwright tests.

## 2026-11-06 — Session 1: #005 Four in a Row (Connect Four) COMPLETE

- Git history rewritten on request to remove the Co-Authored-By trailers (trees unchanged; force
  push with lease); CLAUDE.md now forbids attribution trailers.
- New shared gravity family `src/games/shared/gravity/` (engine, `GravitySearchAgent`, environment,
  SVG board with masked holes and falling discs, shell definition builder) for #005 and #006.
- #005: 7×6, four in a row; Easy / Medium / Hard (iterative-deepening negamax, Zobrist TT,
  600 ms, ≈ depth 13 from the empty board); 6 achievements; red/yellow discs with a shape cue on
  yellow and a blue/orange colorblind palette.
- Verified (actually run): `npm run verify` → 210 unit tests, 46 Playwright tests. Search agent's
  move always achieves the exact game value on 40 random late positions (checked against plain
  negamax); seeded strength: Easy vs Random 40–0, Medium vs Easy 29–0–1, Hard vs Medium 16–0.
- Found in screenshot review and fixed: scoreboard disc icons rendered black (CSS variables were
  scoped to the board).

## 2026-11-06 — Session 1: #004 Misère Tic-Tac-Toe COMPLETE

- Built on the m,n,k family (misère flag already supported by engine, solver, heuristic, board).
  Shell gained an optional `describeResult` line ("X completed three in a row.").
- Perfect = exact misère solver; Easy/Medium = alpha-beta with the sign-flipped line heuristic.
  6 achievements incl. "The Squeeze" (opponent's last move was forced into a line).
- Verified (actually run): `npm run verify` → lint, typecheck, 181 unit tests, build, 40 Playwright
  tests. #004-specific: reachable-position enumeration (5,478 / 958 terminals, loser owns the line),
  Perfect opens in the center (the only non-losing opening), Perfect never loses against every
  reply sequence as X and as O, Perfect vs Perfect draws, Perfect 0 losses vs Medium (100 games).
- Platform fix found by screenshot review: achievement toasts covered the bottom game controls on
  phones; they now appear under the header on narrow screens.

## 2026-11-06 — Session 1: #003 Ultimate Tic-Tac-Toe COMPLETE

- Platform refactor (own commit): generic two-player match shell
  `src/games/shared/two-player/` (`TwoPlayerGame`, `TwoPlayerRules`, match flow, strings, sounds).
  Boards plug in as components; the m,n,k games now wrap it. Intended for all two-player board
  games (#004–#070) — new games supply rules, board, agents, strings and achievements only.
- #003: dedicated engine (sending rule, free choice, local wins close boards, drawn boards count
  for nobody, global line wins, draw when all boards are closed), 9×9 board with playable-board
  glow, captured/drawn overlays and global win line, keypad entry in the forced board,
  capture chime, spoken move/next-board announcements, 6 achievements, EN/ES.
- AI chosen by measurement (seeded `npm run evaluate`): Easy vs Random 34–4–2; Medium vs Easy
  26–4–0; Hard = MCTS 20k sims/600 ms: 13–2–1 vs Medium, 6–4–2 vs alpha-beta (depth ≤ 10, 400 ms).
- Verified (actually run): `npm run verify` → lint, typecheck, 161 unit tests, build,
  36 Playwright tests (desktop + mobile). Screenshots reviewed (capture + free choice on desktop,
  vs Easy on mobile).

## 2026-11-06 — Session 1: #002 Tic-Tac-Toe 4×4 COMPLETE

- Refactored the m,n,k family so #001, #002 (and later #004) share one implementation:
  `src/games/shared/mnk/` now holds the engine, exact solver, agents, environment factory, match
  flow, full game UI (`MnkGame`), board, strings and sounds. #001 became a thin definition; all its
  tests (unit + e2e) still pass unchanged apart from generic test ids (`mnk-status`, `mnk-menu`).
- New exact solver (`solver.ts`): bitboards, 8-fold symmetry TT with byte lookup tables,
  dead-position detection, immediate-win / forced-block pruning, misère support. Empty 4×4 board:
  3.4M nodes / ~0.65 s vs 44M nodes / ~27 s for plain memoized negamax (measured).
- Proven by test: 4×4 four-in-a-row is a draw and every position with ≤ 3 marks is a draw
  (3,360 three-mark positions) → the Perfect agent skips search while ≤ 2 marks are down.
- #002: same modes/features as #001 on a 4×4 board; Easy / Medium (heuristic alpha-beta) /
  Perfect (solver, trap-setting tie-breaks); 6 achievements; EN/ES rules.
- Verified (actually run): `npm run verify` → lint clean, 132 unit tests, build, 30 Playwright
  tests (desktop + mobile). Solver agrees with plain negamax on all 3×3 positions (normal and
  misère) and 150 random late 4×4 positions. Seeded evaluations (`npm run evaluate`):
  Medium vs Easy 10 W / 89 D / 1 L; Perfect vs Medium 11 W / 89 D / 0 L (max decision 79 ms);
  Perfect never lost in any batch. Screenshots reviewed (mobile result screen, desktop hint).
- Found during verification: the naive e2e strategy loses to Perfect (expected) — the test now
  waits for either the human's turn or the end of the round.

## 2026-11-06 — Session 1: #001 Tic-Tac-Toe COMPLETE

- Shared m,n,k engine `src/games/shared/mnk/` (rules + accessible animated `MnkBoard`), built to
  be reused by #002 (4×4) and #004 (Misère).
- #001 Tic-Tac-Toe: vs Computer (Easy/Medium/Perfect), Two Players (names), Watch AI (agent per
  mark, speed, pause/step, auto-continue, deep-linked from AI Lab); alternate-starter option;
  scoreboard; undo (takes back the CPU reply too); hint (perfect move); restart; keyboard
  (arrows/WASD, Enter, keypad digits, U/H/R/N); synthesized sounds; win-line and celebration
  animations (off under reduced motion); colorblind palette; EN/ES; save/resume after every move;
  per-difficulty statistics; 6 achievements; AI bundle (random/easy/medium/perfect).
- Verified (actually run):
  - `npx vitest run` → 97 passed. TTT-specific: exhaustive enumeration (5,478 positions; 958
    terminals = 626 X / 316 O / 16 draws), Perfect never loses as X or O against every possible
    reply sequence, Perfect vs Perfect always draws, adapter contract (200 playouts × 2 configs),
    match flow, save validation, jsdom UI (2P win, CPU reply + undo, keyboard, resume, watch).
  - `npx playwright test` → 24 passed (desktop + Pixel 7): platform pages, routing/refresh,
    settings persistence, favorites persistence, AI Lab worker evaluation, TTT full rounds
    (2P win, vs Perfect to the end, keyboard + rules dialog + resume after reload, layout fit,
    light theme + colorblind + Spanish).
  - Screenshots in `test-results/screenshots/` reviewed by eye (desktop/mobile, dark/light).
  - `npm run evaluate -- tic-tac-toe medium perfect 200 7` → Perfect 114 W / 86 D / 0 L.
  - `python3 training/scripts/random_rollouts.py --game tic-tac-toe --episodes 300 --seed 1` →
    X 184 / O 79 / draws 37 through the real TS engine via the env server.
- Bugs found and fixed during verification: Rules button had no accessible name on mobile;
  favorites e2e test raced the IndexedDB write (now polls storage); `Rules.tsx` vs `rules.ts`
  case clash on macOS (rules dialog files are now `HowToPlay.tsx`); watch-mode UI test was
  seed-dependent (now tracks progress over time).

## 2026-11-06 — Session 1: platform foundation

- Project initialized: React 19, TypeScript 6 (strict), Vite 8, Vitest 5, Playwright 1.65,
  ESLint 10 + typescript-eslint, Prettier. Lockfile committed.
- Platform shell: hash router, home (featured/continue/recent/favorites/progress/categories),
  library (search, category/player filters, sort), game page (lazy loading, rules dialog,
  favorite, sound, fullscreen, error boundary), profile (multi-profile, stats, achievements,
  reset), settings (theme, language EN/ES, sound/volume, motion, colorblind), roadmap dashboard
  (live data from `src/data/roadmap.ts`), AI Lab (worker-based agent evaluation, history).
- Core infrastructure: seeded serializable RNG, grid helpers, i18n, versioned persistence
  (LocalStorage + IndexedDB with fallback), profile store, Web Audio synth, keyboard/pointer input,
  fixed-step loop, level progression, replay records, achievements types.
- AI: environment contract, bundle/agent presets, Random/Epsilon/Alpha-Beta/MCTS agents,
  match runner, reproducible evaluation reports, adapter contract test suite, JSON-lines env
  server, CLI evaluator, Python bridge (`training/`).
- CI/CD: `.github/workflows/deploy.yml` (lint, format, typecheck, tests, build, Playwright,
  Pages deploy).
- Tests run: `npx vitest run` → 47 passed (core, agents on a toy Nim environment, roadmap).
