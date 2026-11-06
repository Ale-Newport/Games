# Progress Journal

Newest entries first. Record only verified facts (tests actually run, games actually played).

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
