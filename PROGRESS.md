# Progress Journal

Newest entries first. Record only verified facts (tests actually run, games actually played).

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
