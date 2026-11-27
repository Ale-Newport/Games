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

## #232 Size Sense

| Suite                                      | Result                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 22 passed                                                   |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                                    |
| `tests/e2e/games/size-sense.spec.ts`       | 4 passed (2 tests × desktop/mobile)                         |
| `npm run evaluate` (200 sessions, seed 7)  | Typical size 287.6 · Same as reference 194.0 · Random 116.0 |

Manual play (dev server): daily on desktop (vertical, horizontal and disc stages), endless space
on a 375×812 viewport with the keyboard. Defects found and fixed: the real size hidden behind a
larger guess (now drawn on top of a translucent guess); a category chosen just before Start was
ignored (stale state); coins had no reference on their axis (added a 120 mm CD); length rows
were top-heavy with the size above the name (centred, name first); a ref read during render
(lint).

## Full gate after #232 (2026-11-27)

`npm run verify`: lint ✔, typecheck ✔, Vitest 554 files / 4,443 tests ✔, build ✔, Playwright
806 passed / 2 failed — both the new Size Sense resume test (desktop + mobile): under full load
the page reloaded before the asynchronous IndexedDB save finished, so it resumed one step
earlier. Fixed in the tests with `waitForStored(page, sessionAt(1))` (new helper in
`tests/e2e/helpers.ts`, also applied to Graph Forecast's resume test). Re-run: those specs 24/24
over three repeats; full Playwright suite **808 passed**; format and lint clean.
