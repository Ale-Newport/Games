# Next Steps

## Status

- Platform foundation: done (see PROGRESS.md).
- **#001 Tic-Tac-Toe 3×3 — COMPLETE** (2026-11-06).
- **#002 Tic-Tac-Toe 4×4 — COMPLETE** (2026-11-06).
- **#003 Ultimate Tic-Tac-Toe — COMPLETE** (2026-11-06).
- **#004 Misère Tic-Tac-Toe — COMPLETE** (2026-11-06).
- **#005 Four in a Row — COMPLETE** (2026-11-06).
- **#006 Connect Five Gravity — COMPLETE** (2026-11-06).
- **#007 Gomoku — COMPLETE** (2026-11-06).
- **#008 Renju — COMPLETE** (2026-11-06).
- **#009 Pente — COMPLETE** (2026-11-06).
- **#010 Reversi 8×8 — COMPLETE** (2026-11-06).
- **#011 Reversi 6×6 — COMPLETE** (2026-11-06).
- **#012 English Checkers — COMPLETE** (2026-11-06).
- **#013 International Draughts — COMPLETE** (2026-11-06).
- **#014 Spanish Checkers — COMPLETE** (2026-11-06).
- **#015 Chess — COMPLETE** (2026-11-06).
- **#016 Chess960 — COMPLETE** (2026-11-06).
- **Current game: #017 Antichess** (`antichess`) — TODO (module drafted in the working tree).

## Resume instructions

1. Read `CLAUDE.md`, then this file, then the latest `PROGRESS.md` entry.
2. `npm ci`; `npx playwright install chromium` (Playwright 1.65 needs chromium-headless-shell v1254).
3. `npm run verify` should be green before you start.
4. Follow CLAUDE.md Stages A–G for the current game.

## How to build the next two-player board game

Use `src/games/shared/two-player/` (see `src/games/ultimate-tic-tac-toe/` as the template for a game
with its own engine, and `src/games/tic-tac-toe-4x4/` for an m,n,k game):

1. `engine.ts` (pure rules, `isValidState` by history replay) + `rules-meta.ts`.
2. `rules.ts`: a `TwoPlayerRules<S, A>` binding (create/apply/isLegal/undo/toMove/plies/
   moverOfPly/outcome/validate) + achievement predicates.
3. `ai.ts` presets, `ai-adapter.ts` (`GameEnvironment` + `AiBundle`), heuristics in their own file.
4. A `Board` component taking `BoardProps<S, A>` (own cursor + arrow keys via `useKeyboard`).
5. `Game.tsx`: a `TwoPlayerGameDefinition` (match config, strings, Board, describeAction,
   optional actionSound/describeResult/SeatIcon/badge, onRoundEnd achievements).
6. `HowToPlay.tsx` (export `Rules`), `i18n.ts`, `manifest.ts`, `assets/preview.svg`, `README.md`,
   `GAME_SPEC.md`, `tests/` (engine, adapter contract, AI ordering, UI) and
   `tests/e2e/games/<id>.spec.ts`.
7. Register in `src/games/registry.ts` and `src/ai/adapters/registry.ts`; mark COMPLETE in
   `src/data/roadmap.ts`; `npm run roadmap`; `npm run verify`.

Gotcha: Prettier reflows long lines — when scripting edits to existing files, re-read them first or
use exact-match edits, and check that the edit applied.

## Plan for #016–#020 (chess family)

The shared family is done (`src/games/shared/chess/`, see `src/games/chess/README.md`). Each
variant is a thin module like `src/games/chess/` with its own `VARIANT`, levels (`chessPresets`),
strings, rules page, achievements, preview (same generator approach: render `PieceGlyph` paths into
an SVG) and tests:

- #016 Chess960: `CHESS960` variant; pass `seed: () => random 0–959` to `createChessDefinition`
  (`restart` keeps the same start); show the start number; castling by king-onto-rook is already
  supported by the board; perft for 960 is in `tests/perft.test.ts`.
- #017 Antichess: `ANTICHESS` (captures compulsory, king promotion allowed, win with no pieces or
  moves); evaluation is negated material; check SAN/UI have no check markers.
- #018 King of the Hill: `KING_OF_THE_HILL`; highlight d4/e4/d5/e5 on the board.
- #019 Three-Check: `THREE_CHECK`; `statusInfo` already shows the check counts.
- #020 Gardner Minichess: `GARDNER` 5×5 (no double push/castling); the board handles W×H.

## Known follow-ups (platform)

- Computer opponents run on the main thread (UTTT Hard ≤ 600 ms per move). Moving agent decisions
  to a Web Worker (async agent API in the shell) would keep the UI fully responsive on slow phones.

- Visual regression baselines (`toHaveScreenshot`) are not set up; screenshots are captured to
  `test-results/screenshots/` and reviewed manually because font rendering differs between macOS
  and the Linux CI runner.
- GitHub Pages must be enabled once in the repository settings (Source: GitHub Actions) — see README.
