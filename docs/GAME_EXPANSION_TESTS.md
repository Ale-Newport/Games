# Game Expansion Tests

All results below were actually run; command output is summarized, not invented.

## Baseline (before any change, commit `18ea1be`, 2026-11-27)

| Check                 | Result                                   |
| --------------------- | ---------------------------------------- |
| `npm run lint`        | clean                                    |
| `npm run typecheck`   | clean                                    |
| `npx vitest run`      | 549 files, 4,384 tests passed            |
| `npm run build`       | OK                                       |
| `npx playwright test` | 800 passed (desktop + Pixel 7), 14.2 min |

## Regression guard

`tests/platform/baseline.test.ts` (part of `npm test`): the 230 baseline games stay registered
and COMPLETE with the same number, category and `#/game/<id>` route; each keeps its entry module,
preview art and AI bundle; none of the 3,757 files under `src/games/` at the baseline commit is
missing. Routes and gameplay of every baseline game are still exercised by their own Playwright
specs (one or more per game) in the full e2e run.

## #231 Graph Forecast

| Suite                                      | Result                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 29 passed                                                                           |
| `tests/ui.test.tsx` (jsdom)                | 2 passed: full daily via keyboard; resume + end endless run                         |
| `tests/e2e/games/graph-forecast.spec.ts`   | 4 passed (2 tests × desktop/mobile): pointer-drawn daily, keyboard endless + reload |
| `npm run evaluate` (200 sessions, seed 7)  | Forecaster 244.9 · Recent trend 228.1 · Random 220.2 · Flat 212.0 (out of 500)      |

Manual play in the browser (dev server, 2026-11-27): a full daily (pointer and keyboard), an
endless Hard/Economy run on a 375×812 mobile viewport with touch-style drawing, light theme,
results, record panel. Defects found and fixed: legend swatches all white (CSS specificity);
Space after ↑ overwrote the first year; fast key presses lost values (stale state between
renders — now read through refs); chart text ~5 px on phones (chart now sized in real pixels);
dark-on-dark visible line, score box and stat tiles in the light theme.

## Full gate after #231 (2026-11-27)

`npm run verify`: lint ✔, typecheck ✔, Vitest 552 files / 4,419 tests ✔, build ✔, Playwright
803 passed / 1 failed. The failure was a pre-existing game's spec (#200 Wanderer Rescue, “watch
the AI clear the first level”): the level plays in real time in 27–29 s against the default 30 s
test budget, so it failed under load (3 of 4 isolated runs with the dev server running; 4 of 4
passed with it stopped). Fixed test-only with `test.setTimeout(60_000)`; rerun of that spec, the
Graph Forecast spec and the platform spec: 21 passed. No game code outside #231 was changed.
