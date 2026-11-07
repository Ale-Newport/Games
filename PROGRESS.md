# Progress Journal

Newest entries first. Record only verified facts (tests actually run, games actually played).

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
