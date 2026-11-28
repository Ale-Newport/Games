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

## #245 Gap Graph

| Suite                                      | Result                                             |
| ------------------------------------------ | -------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 19 passed                                          |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                           |
| `tests/e2e/games/gap-graph.spec.ts`        | 4 passed (2 tests × desktop/mobile)                |
| `npm run evaluate` (100 sessions, seed 7)  | Analyst 287.6 · Straight lines 249.0 · Random 90.3 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): Nepal's GDP per person
1972–1984 with 1977, 1981 and 1983 hidden (58, 5, 3 → 22), then population bars for eight countries
in 2020 on the phone. Defects found and fixed: long country names were cut off under rotated bar
labels on phones (shortened there, full names in the list); the real bar hid under the guessed bar
on the reveal (now drawn on top).

## Full gate after #245 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4745 unit tests**, build and **860 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #246 Equation Guess

| Suite                                      | Result                                         |
| ------------------------------------------ | ---------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 28 passed                                      |
| `tests/ui.test.tsx` (jsdom)                | 2 passed                                       |
| `tests/e2e/games/equation-guess.spec.ts`   | 4 passed (2 tests × desktop/mobile)            |
| `npm run evaluate` (100 sessions, seed 7)  | Solver 208.35 · Consistent 195.45 · Random 0.0 |

Manual play (dev server, Spanish; desktop, then a 375 px viewport): the daily Mini refused
`12+3=1` as not true, then `9+8=17` and `9×5=45` (two 5s guessed, one in the answer: only one
coloured) led to `9×6=54` in three tries (70); the Classic board and keypad fit the phone. The e2e
test solves the daily by reading the tile colours back from the page. Defects found and fixed: the
random agent scored exactly 100 because its RNG mirrored the answer pick (the environment seed is
now mixed); the results list used an undefined `--text-base` token, so equations shrank to the
inherited tiny pixel font (now `--text-md`; the same typo fixed in Year Guess's recap headings).

## Full gate after #246 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,775 unit tests**, build and **864 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #247 Hex Isles

| Suite                                      | Result                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 31 passed                                                   |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (a whole 4-player game through the table; hotseat) |
| `tests/e2e/games/hex-isles.spec.ts`        | 4 passed (2 tests × desktop/mobile)                         |
| Self-play, 100 games, seats rotated        | Strategist 64 / 100 from one seat vs three settlers         |
| `npm run evaluate` (60 games, seed 7)      | Strategist 46–14 Settler · Random 0–60 Settler              |

Manual play (dev server, Spanish; desktop, then a 375 px viewport) against strategists: setup by
mouse and by keyboard (Tab to an edge, Enter), a 7 on the first roll (storm moved by clicking a hex,
automatic steal), an offer of 1 iron for 1 coral accepted by Green, a path built, offers from the
computer declined. Defects found and fixed: plurals (“1 cartas”); the storm cloud hid the number
token (now replaces the terrain glyph); trade headings in the display font and resource steppers
without names; thin edge hit areas; “ofrece a Tú” / “Tú ha rechazado” (you-forms added); a
computer repeating an offer just refused (now asks someone else); the evaluator seating three
agents in a four-seat default (default is now three players).

## Full gate after #247 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,808 unit tests**, build and **868 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #248 World Conquest

| Suite                                      | Result                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 26 passed                                                         |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (a whole 3-player game through the table; hotseat)       |
| `tests/e2e/games/world-conquest.spec.ts`   | 4 passed (2 tests × desktop/mobile)                               |
| Self-play, seats rotated                   | Marshal 67 / 120 vs two generals; 41 / 60 vs one; 18 / 50 vs four |
| `npm run evaluate` (100 games, seed 7)     | Marshal 79–21 General · Random 0–100 General                      |

Manual play (dev server, Spanish; desktop, then a 375 px viewport) against generals: setup with
“place for me”, all four reinforcements on one territory in one click, Cinder Road taken across a
sea lane (5 4 4 against 4) with an advance of 6 chosen on the slider, Tidegate taken with “attack
until it falls”, the card earned at the end of the turn, computer turns. Defects found and fixed:
owner colours washed out by the landmass tones; army numbers too small; the attack-until buttons
overflowing the panel (now short chips with defenders); the map too small to tap on phones (now
640 px wide in a sideways-scrolling frame); the cards panel saying “Your cards” for other seats.

## Full gate after #248 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,836 unit tests**, build and **872 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #249 Land Baron

| Suite                                      | Result                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 27 passed                                                                        |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (a whole timed 3-player game through the table; auction, trade, resume) |
| `tests/e2e/games/land-baron.spec.ts`       | 4 passed (2 tests × desktop/mobile)                                              |
| Self-play, seats rotated (untimed)         | Baron 42 / 60 vs two speculators; speculator 10 / 10 vs random                   |

Manual play (dev server, Spanish; desktop, then a 375 px viewport) against barons: a roll onto
Twine Street, the auction (opening bid, raises against two computers, passing), several turns,
space details with the mortgage button, a trade (East Ferry + ¤50 for Barrel Steps) accepted by
Gold, offers from the computer refused. Defects found and fixed: the currency sign missing from
the pixel font (money now in the body font); “de Tú” in auction prompts and “Tú compró” in the
log (you-forms for every line); the trade cash limited to steps of 10 (now a number field);
“1 properties”.

## Full gate after #249 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,865 unit tests**, build and **876 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #250 Tile Realm

| Suite                                      | Result                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 25 passed                                                   |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (a whole game through the table; keyboard, resume) |
| `tests/e2e/games/tile-realm.spec.ts`       | 4 passed (2 tests × desktop/mobile)                         |
| Self-play, seats rotated                   | Master 10/10 vs apprentice; 25/30 vs two; 12/20 vs three    |

Manual play (dev server, Spanish; desktop, then a 375 px viewport) against masters: a road tile
placed east of the start (turned to fit), a warden on the road, ten more turns by hint and confirm
with towns, roads and a meadow scored or claimed. Defects found and fixed: Enter on a chosen warden
circle toggled it off instead of confirming; the board shrank to the frame (a global SVG max-width)
and the layout overflowed on phones; wardens too small; tiles too small at the first zoom.

## Full gate after #250 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,892 unit tests**, build and **880 Playwright
tests** (desktop + mobile) — all passed, exit code 0. Two earlier runs that day failed in the unit
stage only on timeouts of older, heavy tests (Renju agents, Rough Guess questions, Theme Strands
contract playouts) while the machine's load average was 90–140 from other processes (iCloud
file provider); those files passed on their own, and the full gate passed once the load dropped.

## #251 Fading Empires

| Suite                                      | Result                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 26 passed                                               |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (a whole game through the table; resume)       |
| `tests/e2e/games/fading-empires.spec.ts`   | 4 passed (2 tests × desktop/mobile)                     |
| Self-play, seats rotated                   | Warlord 66.5/80 vs raider; 64/90 vs two; ~half vs three |

Manual play (dev server, Spanish; desktop, then a 375 px viewport) against warlords: a pairing
picked past one skipped (a coin left on it), Stonewater taken on the edge for 1 thanks to
Seafaring, three more regions, bands redeployed (one, then all at once), the turn ended for 4
coins, computer turns. Defects found and fixed: Spanish pairing names in the wrong order
(“Ricos Excavadores”; now “Excavadores · Ricos”), the empire line wrapping, owners’ colours lost
on yellow farmland.

## Full gate after #251 (2026-11-28)

`E2E_PORT=4391 npm run verify`: lint, typecheck, **4,920 unit tests**, build and **884 Playwright
tests** (desktop + mobile) — all passed, exit code 0.

## #252 Global Front

| Suite                                      | Result                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 26 passed                                            |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (two full rounds through the table; resume) |
| `tests/e2e/games/global-front.spec.ts`     | 4 passed (2 tests × desktop/mobile)                  |
| Self-play, sides alternating               | General 27 / 30 vs colonel                           |

Manual play (dev server, Spanish; desktop, then a 375 px viewport) with the Northern Pact against
generals: Varn bought 16 worth of units, the computer's Kelt turn took Tarsk and sank Varn's fleet,
Ossia bought and attacked Cape Verdan from Thornvale with two infantry and fought several rounds
(dice and hits shown, retreat offered). Defects found and fixed: a transport could leave water held
by enemy warships (now refused, with a test); during tuning the general's capital guard made it
weaker than the colonel (dropped after measurement).

## Full gate after #252

`E2E_PORT=4391 npm run verify` — lint, typecheck, 594 unit test files / 4,948 tests, build, 888
Playwright tests (desktop + mobile): all passed.

## #253 Star Council

| Suite                                      | Result                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 41 passed                                                                         |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (two rounds of three players through the table; council, resume)         |
| `tests/e2e/games/star-council.spec.ts`     | 4 passed (2 tests × desktop/mobile)                                               |
| Self-play, seats rotating                  | Regent 20 / 30 vs envoy; 17–18.5 / 30 as one of three; 9.5–10 / 20 as one of four |

Manual play (dev server, Spanish; desktop 1280 px, then 375 px):

- In the first round of a three-player game as the Oru Syndicate against regents, I took Command,
  activated Maret, brought the carrier with a fighter and three infantry, and claimed Maret.
- I played Command (5 tokens, speaker), activated Orumar and built a carrier, two infantry and a
  fighter for 6 (the planet paid 5, a trade good the rest), and was offered Commerce's secondary.
- From there hints played the seat to the end of round 8: status phases, scoring and the end
  screen. A regent won with 11 points; the hinted seat had 9.

Defects found and fixed:

- moving a carrier could pull a negative number of fighters along (caught by random games);
- the build panel showed “move 0” for infantry and fighters;
- Spanish log lines read “Tú cogió” (now “Sindicato Oru (tú) cogió”);
- a renamed helper crashed the log;
- on phones a forced tap on a hex missed it (the e2e now scrolls it into view).

## Full gate after #253

`E2E_PORT=4391 npm run verify` — lint, typecheck, 596 unit test files / 4,991 tests, build, 892
Playwright tests (desktop + mobile): all passed on the second run. The first run stopped at one
old test (`rough-guess` “every answer lies on its scale”, 20 s timeout) while another application
kept the machine at a load average of about 150; that test passes alone (23/23) and in the rerun.

## #254 Planet Shapers

| Suite                                      | Result                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `tests/engine.test.ts` (incl. AI contract) | 29 passed                                                                              |
| `tests/ui.test.tsx` (jsdom)                | 2 passed (two generations through the table; hand-off, resume)                         |
| `tests/e2e/games/planet-shapers.spec.ts`   | 4 passed (2 tests × desktop/mobile)                                                    |
| Self-play, seats rotating                  | Architect 15 / 20 and 18 / 20 vs cadet; 14 / 24 as one of three; 7 / 16 as one of four |

Manual play (dev server, Spanish; desktop 1280 px, then 375 px):

- I chose Meridian Union and bought three cards (9 credits).
- I played Frost Algae, then the Settlement standard project. The legal spaces were highlighted
  and the settlement went on an ore space (+1 ore, +2 credit production, Meridian's 4 credits
  back).
- Hints played the seat to the end: research, placements, conversions, milestones and awards.
  The game ended in generation 10 with the score breakdown shown.
- On a phone, the hand-off screen and the corporation and card panels fit the width.

Defects found and fixed:

- four players needed eight corporation options from six; options are now dealt in seat order;
- games ran to the 14-generation limit, so the tracks were shortened and TR raised;
- the hand-off button overflowed on phones;
- the corporation log read “Tú eligió” (now “Jugador 1 (tú) eligió”).

## Full gate after #254

`E2E_PORT=4391 npm run verify` — lint, typecheck, 598 unit test files / 5,022 tests, build, 896
Playwright tests (desktop + mobile): all passed.
