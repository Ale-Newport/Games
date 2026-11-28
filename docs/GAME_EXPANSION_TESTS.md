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

## #233 Order of Magnitude

| Suite                                        | Result                                                      |
| -------------------------------------------- | ----------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract)   | 23 passed (incl. a 3,000-case feasible-range property test) |
| `tests/ui.test.tsx` (jsdom)                  | 2 passed                                                    |
| `tests/e2e/games/order-of-magnitude.spec.ts` | 4 passed (2 tests × desktop/mobile)                         |
| `npm run evaluate` (200 sessions, seed 7)    | Informed 387.9 · Bisector 354.8 · Random 46.8               |

Manual play (dev server): daily on desktop and a 375×812 viewport (buttons, typed number,
auto-lock on an exact third guess). Defects fixed: the feedback arrow wrapped onto its own line;
85 × 0.7 rounded to 59 (float epsilon added); Easy had only 28 engineering questions (threshold
lowered from 60 to 45 sitelinks); the key hint wrongly said Shift ×10; Nile/Amazon lengths wrong
in the first build (data rule fixed, see the data doc).

## Full gate after #233 (2026-11-27)

`npm run verify`: lint ✔, typecheck ✔, Vitest 556 files / 4,468 tests ✔, build ✔, Playwright
811/812 — Size Sense's pointer test failed once on mobile under load. Cause (a real bug): the
pointer-move handlers of Size Sense's stage and Graph Forecast's chart read the
dragging/drawing flag from React state, so moves arriving before the re-render were ignored and
a fast drag on a slow device could do nothing. Fixed with a ref read by the handlers in both
games. Re-run: the three new games' specs 24/24 (two repeats); full Playwright **812 passed**.

## #234 Rough Guess

| Suite                                      | Result                                             |
| ------------------------------------------ | -------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 21 passed                                          |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                           |
| `tests/e2e/games/rough-guess.spec.ts`      | 4 passed (2 tests × desktop/mobile)                |
| `npm run evaluate` (100 sessions, seed 7)  | Calibrated 325.6 · Random 75.3 · Play it safe 74.1 |

Manual play (dev server): desktop and 375×812 — handle drags, band drag, keyboard handles, a
miss and the reveal. Defects fixed: question headers overflowed on phones (fixed in #232, #233
and #234 CSS); Celsius ticks fell on round kelvin values (now round °C, spaced by pixels); 0 °C
printed as 1e-14 (rounding); a lint finding in the prior computation.

## Full gate after #234 (2026-11-27)

`npm run verify`: lint ✔, typecheck ✔, Vitest 558 files / 4,491 tests ✔, build ✔, Playwright
**816 passed** (desktop + Pixel 7).

## #235 Closest Call

| Suite                                      | Result                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 20 passed                                               |
| `tests/ui.test.tsx` (jsdom, fake timers)   | 2 passed                                                |
| `tests/e2e/games/closest-call.spec.ts`     | 4 passed (2 tests × desktop/mobile)                     |
| `npm run evaluate` (60 games, seed 7)      | Hard 48–6 Normal · Normal 48–9 Easy · Easy 42–17 Random |

Manual play (dev server): a daily game and custom line-ups. Defects fixed: every arrow drew
black (seat colour not set on the target's groups); computer contestants tied each other exactly
— candidates were scored unrounded but answered rounded to 4 figures, so “the mean” rounded onto
the previous answer (now scored as answered; a test checks four distinct answers); answers were
shown with 3 figures, hiding 1 % differences (now 4); the evaluation tool needs ±1 returns
(points moved to `scores`).

## Full gate after #235 (2026-11-28)

`npm run verify`: lint ✔, typecheck ✔, Vitest 560 files / 4,513 tests ✔, build ✔, Playwright
**820 passed**.

## #236 Plot the Point

| Suite                                      | Result                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| `tests/engine.test.ts` (incl. AI contract) | 21 passed                                              |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                               |
| `tests/e2e/games/plot-the-point.spec.ts`   | 4 passed (2 tests × desktop/mobile)                    |
| `npm run evaluate` (100 sessions, seed 7)  | Similar countries 263.1 · Centroid 134.5 · Random 51.3 |

Manual play (dev server): a daily chart placed by clicks (fertility × infant mortality, log y)
and the reveal; the 375×812 layout. Defects fixed: NaN scores from zero values on log axes
(filtered in `countriesFor`); the x-axis title and landmark labels overflowed on phones (title
removed — the card names both axes — and right-side labels flipped left); the e2e tap landed
off the chart after a chip click scrolled the page (re-measured).

## Full gate after #236 (2026-11-28)

`npm run verify`: lint ✔, typecheck ✔, Vitest 562 files / 4,536 tests ✔, build ✔, Playwright
823/824 — Size Sense's mobile pointer test missed once under load: the test scrolled the stage to
the top edge, under the sticky site header, so the drag could hit the header. The test now centres
the stage and waits for the auto-zoom to settle (12/12 over three parallel repeats). Full
Playwright re-run: **824 passed**.

## #237 Price Check

| Suite                                      | Result                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 22 passed                                            |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                             |
| `tests/e2e/games/price-check.spec.ts`      | 4 passed (2 tests × desktop/mobile)                  |
| `npm run evaluate` (200 sessions, seed 7)  | Similar products 219.3 · Typical 191.9 · Random 75.3 |

Manual play (dev server): daily items with photos and illustrations, the reveal with credit and
today's money. Defects/decisions: a self-promotional software entry appeared (fixed with the
article requirement outside books and games); two candidate “era” agents did worse than the
category median and were replaced by the similar-products agent; Node-only APIs in a src test
broke the app typecheck (switched to `import.meta.glob`).

## #238 Clue Ladder

| Suite                                      | Result                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| `tests/engine.test.ts` (incl. AI contract) | 23 passed                                              |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                               |
| `tests/e2e/games/clue-ladder.spec.ts`      | 4 passed (2 tests × desktop/mobile)                    |
| `npm run evaluate` (200 sessions, seed 7)  | Clue reasoner 263.7 · Always climb 218.2 · Random 60.9 |

Manual play (dev server, Spanish, desktop then mobile): Burj Khalifa climbed to rung 2 (bracket
fact, exact guess kept for 75), resume after a reload, next question on a 375 px viewport.
Defects found and fixed: after a keyboard guess the guess box unmounted and focus fell to the
page, so K / C did nothing (focus now moves to Keep, and back to the guess box after a climb);
rung multipliers were not localized (×0.75 → ×0,75); element names in the results list started
lowercase; locked rungs took two rows on phones.

## Full gate after #237 (2026-11-28)

`npm run verify`: lint ✔, typecheck ✔, Vitest 564 files / 4,560 tests ✔, build ✔, Playwright
826 passed / 2 failed — Closest Call's daily spec (desktop + mobile), a date-dependent test bug:
the test retyped the shown answer, and today's daily has a figure shown compactly (“US$46.34B”)
that retypes as an off-scale “46.34”, which the game correctly rejected. The test now clears the
field and locks in the dial's value when the game shows the alert; the spec re-run passed 4/4.
The next full gate re-runs everything.

## #239 Year Guess

| Suite                                      | Result                                            |
| ------------------------------------------ | ------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 23 passed                                         |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                          |
| `tests/e2e/games/year-guess.spec.ts`       | 4 passed (2 tests × desktop/mobile)               |
| `npm run evaluate` (200 sessions, seed 7)  | Clue words 94.5 · Typical year 43.6 · Random 12.5 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): Leonardo's Portrait of a
Musician typed as 1485 (exact), the First World War set with a tap and the −10 / −1 buttons
(1914, exact), the Battle of the Boyne typed as 1700 (1690, 10 off → 60), resume after a reload,
the recap timeline. Defects found and fixed: BC years were one off (the RDF export numbers years
astronomically — now converted, with spot tests); disaster names carried their year (now removed
from the name instead of dropping the event); Spanish names fell back to Indonesian “mul” labels;
discoveries were mostly asteroids and galaxies, then “discovered” inhabited places; the first tick
label was clipped; years before 1000 were bare numbers (now “AD 820” / “820 d. C.”); recap labels
overlapped the stars; the e2e spec expected +10 past the 2025 end of the timeline.

## Full gate after #238 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,585 unit tests** (566 files), build and
**832 Playwright tests** (desktop + mobile) — all passed, exit code 0, no retries.

## #240 One-Star Landmarks

| Suite                                        | Result                                                 |
| -------------------------------------------- | ------------------------------------------------------ |
| `tests/engine.test.ts` (incl. AI contract)   | 21 passed                                              |
| `tests/ui.test.tsx` (jsdom)                  | 2 passed                                               |
| `tests/e2e/games/one-star-landmarks.spec.ts` | 4 passed (2 tests × desktop/mobile)                    |
| `npm run evaluate` (200 sessions, seed 7)    | Review reader 364.5 · Triangulator 350.3 · Random 15.0 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): the Parthenon after a wrong
“Coliseo” (1,051 km east, 95 % close, second line, Europe map; found on guess 2 for 75), resume
after a reload, Christ the Redeemer typed and tapped on a phone (100). Defects found and fixed:
review facts corrected before release (the Statue of Liberty's torch is lit — it is the access
that closed; the Sagrada Família has more than nine towers; Disney did not draw the mouse
himself; Uyuni is just under 4,000 m; El Calafate is named after a shrub); the Gateway Arch review
used a word of its name; the map test needed to wait for the lazily loaded shapes; the closeness
label was unreadable over the green bar; the reveal had no card around it.

## Full gate after #239 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,610 unit tests** (568 files), build and
**836 Playwright tests** (desktop + mobile) — all passed, exit code 0.

## #241 Fact Match

| Suite                                      | Result                                    |
| ------------------------------------------ | ----------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 21 passed                                 |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                  |
| `tests/e2e/games/fact-match.spec.ts`       | 4 passed (2 tests × desktop/mobile)       |
| `npm run evaluate` (200 sessions, seed 7)  | Expert 190.4 · Ranker 124.4 · Random 50.9 |

Manual play (dev server, Spanish, keyboard; then a 375 px viewport): a chicken-price board
(1979–2025) — three locked on check 1, the crosses then narrowed 2023 and 2025 down to one
number each, 72 points; the decoys were 1970 and 2014. Defects found and fixed: the board took a
focus ring when clicked; element names showed in lower case; the contract playouts needed a
higher step budget for random play (≈ 30 moves per check).

## Full gate after #240 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,633 unit tests** (570 files), build and
**840 Playwright tests** (desktop + mobile) — all passed, exit code 0.

## #242 Aerial Eye

| Suite                                      | Result                                                |
| ------------------------------------------ | ----------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 19 passed                                             |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                              |
| `tests/e2e/games/aerial-eye.spec.ts`       | 4 passed (2 tests × desktop/mobile)                   |
| `npm run evaluate` (300 sessions, seed 7)  | Colour reader 161.9 · Best known 141.4 · Random 140.5 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): a circuit photo — Nürburgring
struck, the photo zoomed out to ×1.5, Fuji Speedway by key 6 for 50, with the map of Japan and the
GSI photo credit; a river round on the phone. A contact sheet of 16 random photos was checked by
eye (all real aerial views). Defects found and fixed: ×2.6 was too blurry on 380 px photos (now
×2.2 / ×1.5 / 1); after a miss the struck button was disabled and focus fell to the page, so keys
1–6 stopped (the board now keeps focus — `autoFocus` does nothing on a `div`, so an effect focuses
it); the first image set was 16 MB (re-encoded to 12 MB); cities had been filed as historic sites
and the Colosseum as a stadium (category priority fixed).

## Full gate after #241 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,656 unit tests**, build and **844 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## Daily-independence fix (#231–#242)

Found while testing #243: each game's UI passed the player's history of seen items to `next()`,
and the engines used it in daily mode too, so after round 1 two players' dailies could differ. All
twelve engines now ignore the history in daily mode. Every game's daily test now asserts, at each
step, that avoiding exactly the next round's item does not change it; reverting the fix in one
engine makes its test fail (checked on Aerial Eye).

## #243 Number Line

| Suite                                      | Result                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 22 passed                                                      |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                                       |
| `tests/e2e/games/number-line.spec.ts`      | 4 passed (2 tests × desktop/mobile)                            |
| `npm run evaluate` (100 sessions, seed 7)  | Similar countries 304.5 · Middle reference 209.6 · Random 90.3 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): remittances 2008 (log line,
0.01–100 %): DR Congo, Burkina Faso and Portugal placed by tap and keys, 25 points; urban
population 2014 on the phone. Defects found and fixed: a skewed share on a linear line bunched
every country at one end (now percentile span and log lines for skewed positive data); the true
values hid behind pins (stars moved onto the axis); an arrow key on a focused pin also moved the
selected pin through the board's handler (handled keys are now ignored); the references could come
out of order; the daily history bug above.

## Full gate after #242 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,677 unit tests**, build and **848 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## Full gate after #243 and the daily fix (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,701 unit tests**, build and **852 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #244 Trend Draw

| Suite                                      | Result                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 21 passed                                                         |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                                          |
| `tests/e2e/games/trend-draw.spec.ts`       | 4 passed (2 tests × desktop/mobile); #231's spec re-run: 4 passed |
| `npm run evaluate` (200 sessions, seed 7)  | Similar countries 168.3 · World 152.8 · Random 151.3 · Flat 110.4 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): Malaysia's GDP per person
2006–2025 drawn freehand — 66 points against the similar-countries curve's 33 — and France's imports
on the phone. Defects found and fixed: world totals (Italy's population against the world's)
squashed the country's line against the axis (totals left out, and charts where the country sits in
the bottom 15 % rejected); the single visible point was a zero-length line, then a dot clipped in
half (now a full marker outside the clip); the world guide looked like the computer's dashed line
(now dotted, light blue); the hint said “dashed”.

## Full gate after #244 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,724 unit tests**, build and **856 Playwright
tests** (desktop + mobile) — all passed, exit code 0.
