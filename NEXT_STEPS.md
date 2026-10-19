# Next Steps

## Status

- Platform foundation: done (see PROGRESS.md).
- **#001 Tic-Tac-Toe 3×3 — COMPLETE** (2026-11-06).
- **#002 Tic-Tac-Toe 4×4 — COMPLETE** (2026-11-06).
- **Current game: #003 Ultimate Tic-Tac-Toe** — TODO (start at Stage A).

## Resume instructions

1. Read `CLAUDE.md`, then this file, then the latest `PROGRESS.md` entry.
2. `npm ci`; `npx playwright install chromium` (Playwright 1.65 needs chromium-headless-shell v1254).
3. `npm run verify` should be green before you start.
4. Follow CLAUDE.md Stages A–G for the current game.

## Plan for #003 Ultimate Tic-Tac-Toe

- Ruleset to document: 9 local 3×3 boards in a 3×3 global board. A move in cell c of a local board
  sends the opponent to local board c. If that board is won or full, the opponent may play in any
  open board (free choice). A local board is won by three in a row (it then counts for that player
  on the global board); a full local board with no line is drawn and counts for nobody. The game
  is won by three local boards in a row; if no open boards remain, it is a draw. (Decide and
  document whether drawn boards can count for both — the common competitive ruleset says no.)
- This is NOT an m,n,k game: write a new engine `src/games/ultimate-tic-tac-toe/engine.ts`
  (bitboards per local board recommended for AI speed). Reuse `lineThrough`/grid helpers and the
  `MnkBoard` visual language where sensible, but build a dedicated 9×9 board component that shows
  the active board(s), won-board overlays (big X/O), and legal-target highlighting.
- AI: tree is far too large for exact solving. Use `MctsAgent` (already generic) and/or
  `AlphaBetaAgent` with a heuristic (local-board wins, global two-in-a-rows, sending penalties).
  Measure latency in the browser; keep decisions ≤ ~300 ms or move search to a worker.
- Reuse the match-flow ideas from `src/games/shared/mnk/match.ts`, but the state type differs;
  consider generalizing `MnkGame`'s menu/scoreboard pieces into `src/components/` or
  `src/games/shared/turn-based/` only if it clearly reduces duplication.
- Tests: send/free-choice rules, local and global wins, drawn local boards, draw detection,
  contract suite, UI, e2e.

## Known follow-ups (platform)

- Visual regression baselines (`toHaveScreenshot`) are not set up; screenshots are captured to
  `test-results/screenshots/` and reviewed manually because font rendering differs between macOS
  and the Linux CI runner.
- GitHub Pages must be enabled once in the repository settings (Source: GitHub Actions) — see README.
