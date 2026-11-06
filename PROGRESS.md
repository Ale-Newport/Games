# Progress Journal

Newest entries first. Record only verified facts (tests actually run, games actually played).

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
