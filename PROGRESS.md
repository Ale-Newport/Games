# Progress Journal

Newest entries first. Record only verified facts (tests actually run, games actually played).

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
