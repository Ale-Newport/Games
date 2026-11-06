# Next Steps

## Status

- Platform foundation: done (see PROGRESS.md).
- **#001 Tic-Tac-Toe 3×3 — COMPLETE** (2026-11-06).
- **#002 Tic-Tac-Toe 4×4 — COMPLETE** (2026-11-06).
- **#003 Ultimate Tic-Tac-Toe — COMPLETE** (2026-11-06).
- **Current game: #004 Misère Tic-Tac-Toe** — TODO (start at Stage A).

## Resume instructions

1. Read `CLAUDE.md`, then this file, then the latest `PROGRESS.md` entry.
2. `npm ci`; `npx playwright install chromium` (Playwright 1.65 needs chromium-headless-shell v1254).
3. `npm run verify` should be green before you start.
4. Follow CLAUDE.md Stages A–G for the current game.

## Plan for #004 Misère Tic-Tac-Toe

- Reuse the m,n,k family: `{ rows: 3, cols: 3, k: 3, misere: true }`. Engine, solver, environment,
  match flow, board and `MnkGame` already support misère (completing a line loses; the board shows
  the line in the loser's color — `MnkBoard` adapter handles `reason: 'misere-line'`).
- Solver facts (already tested in `src/games/shared/mnk/tests/solver.test.ts`): misère 3×3 is a
  draw, and the center is the only first move that keeps the draw for X.
- Perfect agent: `MnkSolverAgent` with misère rules (no opening book needed — the tree is tiny).
  Easy/Medium: alpha-beta with `lineHeuristic` (sign already flipped for misère) + ε.
- UI text must explain the inverted goal clearly (title, subtitle, status "X completed a line —
  O wins"). Consider a status string for misère losses; the shell's generic texts say "{name} wins".
- Achievements idea: survive Perfect (draw), win vs Medium, force the opponent to complete a line
  on the last empty cell, win as O, hot-seat.

## Plan for #005 Connect Four (Four in a Row)

- Needs gravity: add `gravity?: boolean` to `MnkRules` (actions = columns, piece lands on the lowest
  empty cell) or a dedicated engine; a disc-drop board component (new `Board` for the shell).
- AI: alpha-beta with bitboards and a threat heuristic; Connect Four is solved (first player wins)
  but exact solving in-browser needs a strong solver — document the chosen difficulty agents.

## Known follow-ups (platform)

- Computer opponents run on the main thread (UTTT Hard ≤ 600 ms per move). Moving agent decisions
  to a Web Worker (async agent API in the shell) would keep the UI fully responsive on slow phones.

- Visual regression baselines (`toHaveScreenshot`) are not set up; screenshots are captured to
  `test-results/screenshots/` and reviewed manually because font rendering differs between macOS
  and the Linux CI runner.
- GitHub Pages must be enabled once in the repository settings (Source: GitHub Actions) — see README.
