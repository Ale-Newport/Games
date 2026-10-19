# Next Steps

## Status

- Platform foundation: done (see PROGRESS.md).
- **#001 Tic-Tac-Toe 3×3 — COMPLETE** (2026-11-06).
- **Current game: #002 Tic-Tac-Toe 4×4** — TODO (start at Stage A).

## Resume instructions

1. Read `CLAUDE.md`, then this file, then the latest `PROGRESS.md` entry.
2. `npm ci`; `npx playwright install chromium` (Playwright 1.65 needs chromium-headless-shell v1254).
3. `npm run verify` should be green before you start.
4. Follow CLAUDE.md Stages A–G for the current game.

## Plan for #002 Tic-Tac-Toe 4×4 (four in a row)

- Reuse `src/games/shared/mnk/engine.ts` with `{ rows: 4, cols: 4, k: 4 }` and `MnkBoard`.
  Follow `src/games/tic-tac-toe/` as the template (rules binding, match.ts, ai.ts, ai-adapter.ts,
  Game.tsx, HowToPlay.tsx, i18n.ts, audio.ts, manifest.ts, rules-meta.ts, tests/).
- Consider extracting the parts of `tic-tac-toe/match.ts` and `Game.tsx` that are identical for
  #002/#004 into `src/games/shared/mnk/` (match flow, menu, scoreboard) — only if it removes real
  duplication; keep game-specific modes/achievements in each game.
- AI: the 4×4 tree is much larger than 3×3. Full-depth alpha-beta from the empty board may be too
  slow in the browser; plan an evaluation heuristic (open lines weighted by marks) with iterative
  deepening under a time budget for Medium/Hard, and verify "Hard never loses" empirically plus
  exact checks from mid-game positions. Measure node counts/latency before deciding; document in
  GAME_SPEC.md. 4×4 k=4 is a known draw with perfect play — confirm with an offline exhaustive
  search in a test (with transposition table) if it runs in reasonable time.
- Achievements and statistics analogous to #001 but specific to 4×4.
- e2e spec `tests/e2e/games/tic-tac-toe-4x4.spec.ts`.

## Known follow-ups (platform)

- Visual regression baselines (`toHaveScreenshot`) are not set up; screenshots are captured to
  `test-results/screenshots/` and reviewed manually because font rendering differs between macOS
  and the Linux CI runner.
- GitHub Pages must be enabled once in the repository settings (Source: GitHub Actions) — see README.
