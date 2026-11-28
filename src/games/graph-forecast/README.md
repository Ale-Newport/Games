# #231 Graph Forecast

The graph-extrapolation guessing game popularised by Extraplot (generic name; original look,
code and texts; real public data). A real statistical time series is shown with its last years
hidden and the player **draws** how it continues; the drawing is scored against the real values.

| File                            | Role                                                                 |
| ------------------------------- | -------------------------------------------------------------------- |
| `engine.ts`                     | Pure rules: challenges, drawing → forecast, scoring, sessions, share |
| `ai-adapter.ts`                 | `GameEnvironment` (actions = forecasting methods) and agents         |
| `GraphForecastGame.tsx`         | Menu, record, play, reveal, results; saves and statistics            |
| `ForecastChart.tsx`             | The SVG chart: freehand pointer drawing, keyboard editing, reveal    |
| `../shared/stats/indicators.ts` | The 44 World Development Indicators: topic, titles, units, format    |
| `../shared/stats/stats.ts`      | Data access, value formatting, axis ticks; lazy `loadStats()`        |
| `../shared/stats/forecast.ts`   | Eight forecasting methods, backtesting and the weighted blend        |
| `../shared/stats/wdi.json`      | The shipped series (generated; see “Data”)                           |
| `tools/fetch-worldbank.ts`      | Downloads the indicators from the World Bank API into `.cache/`      |
| `tools/generate-stats.ts`       | Builds `wdi.json` from the cache                                     |

## Specification

### Data

- Source: World Bank, World Development Indicators, via `api.worldbank.org/v2` (CC BY 4.0),
  downloaded 2026-11-27 (World Bank last update 2026-11-11). Every round links to the official
  indicator page for the country.
- 44 indicators in six topics (economy, people, health, environment & energy, technology,
  society), for 217 countries and territories and 12 regions or income groups.
- For each indicator × country the generator keeps the **most recent run of consecutive years
  with a published value** (no interpolation, nothing invented), if it is at least 20 years long,
  moves by at least 6 % of its magnitude (1 point for percentages) and is not mostly a repeated
  carried-forward value. Values are rounded to 3–4 significant digits. Result: **7,615 series**.
- Spot checks in the tests: world population ≈ 3.0 bn in 1960, ≈ 6.1 bn in 2000, > 8 bn in 2023;
  Japan's life expectancy < 70 in 1960 and > 80 in 2010.
- Refresh: `npx tsx tools/fetch-worldbank.ts --force && npx tsx tools/generate-stats.ts`.
  (Regenerating changes which graphs a past daily number shows.)

### Ruleset (`graph-forecast-wdi`)

- **Challenge**: a series, a window of it and a hidden tail.

  | Difficulty | Window      | Hidden          | Indicators allowed                      |
  | ---------- | ----------- | --------------- | --------------------------------------- |
  | Easy       | 20–30 years | last 20 % (≥ 4) | smooth ones only (demography, health…)  |
  | Normal     | 20–40 years | last 30 % (≥ 4) | all but the volatile ones               |
  | Hard       | 25–60 years | last 40 % (≥ 4) | all, including GDP growth and inflation |

  Half of the windows end at the latest year; the rest end at a random year. Windows where the
  line moves less than 3 % are redrawn. The y axis covers the whole window (hidden part
  included) plus a random 12–57 % margin on each side, rounded to nice ticks, never below 0 for
  non-negative measures and never above 100 for shares — so the real extremes are not betrayed by
  the frame.

- **Drawing**: strokes are recorded in data coordinates; every hidden year a stroke crosses takes
  the stroke's interpolated value (later strokes overwrite), and the year nearest the pointer
  takes its value. Years before the first drawn one are joined to the last visible point and gaps
  are joined linearly; the forecast is complete only when the **last year** has a value. Values
  are clamped to the axis.
- **Score** per graph: `round(100 · exp(−e / 0.1))`, where `e` is the mean absolute distance
  between forecast and reality divided by the chart height (1 % → 90, 5 % → 61, 10 % → 37,
  25 % → 8).
- **Computer forecaster** (shown after each graph, never sees hidden data): eight methods — flat
  line, average drift, 5-, 10- and all-year linear trends, damped trend (φ = 0.85), log-linear
  growth, reversion to the 15-year mean — each backtested on the visible years (the last
  `min(h, n/3)` points held out from up to three origins), then blended with weights
  `1 / (error / chart height + 0.01)`.

  Average graph score over 1,500 graphs per difficulty (seeded, measured while choosing the
  method): flat line 53.0 / 41.7 / 37.2 (Easy / Normal / Hard), best single method 61.5 / 47.3 /
  42.2 (damped trend), best-backtest pick 59.7 / 46.4 / 41.7, **weighted blend 62.0 / 49.1 /
  44.6** — so the blend became the opponent.

### Modes

- **Daily**: five Normal graphs from all topics, seeded by the date (number 1 = 1 January 2026),
  identical for everyone; one play per day; share line `Graph Forecast #N — total/500` plus a
  colored square per graph (≥ 90 green, ≥ 70 yellow, ≥ 40 orange, else red); daily streak.
- **Endless**: any difficulty and topic (or all), no limit; the last 1,500 series seen are avoided
  while the pool allows; “End run” records the result. `?deal=N` fixes the seed.
- Hundreds of thousands of distinct challenges: 4,644 (Easy) to 7,213 (Normal) playable series,
  each with many possible windows (the tests draw 2,000 Normal challenges and get > 1,900
  distinct ones).

### Interface

Series card (flag or region icon, indicator, country, years, hidden years, unit), the chart
(hatched hidden zone, dashed cut line, nice axis ticks with compact units, year ticks sized to the
width), the drawn line with dots per year, Clear / Submit / End run. The reveal animates the real
line, shades the gap between both lines, adds the computer's dashed forecast, counts the score up,
grades it (Bullseye … Way off), shows both final-year values and the source link. Results list
every graph with its score. The menu shows the record: graphs, average, best, daily streak, wins
over the computer and a score histogram.

The chart measures its container (ResizeObserver) and draws in real pixels, so labels stay
readable on a 360 px phone; the plot keeps the platform's dark “screen” in both themes;
colorblind mode switches the real line to the Okabe–Ito blue; reduced motion disables the reveal
and count-up animations.

### Controls

Mouse or touch: draw (any number of strokes; `touch-action: none` on the chart). Keyboard (chart
focused): `←`/`→` year, `↑`/`↓` ±1 % of the chart height (`Shift` ×5), `Space` keeps the year
(copying the previous one if empty) and moves on, `Home`/`End`, `Enter` submits.

### Saves, statistics, achievements

One versioned save slot: the session in progress (resumable), daily totals, recently seen series,
difficulty and topic, and the record. Results: mode `daily` or `endless:<difficulty>` with the
session total. Achievements: Crystal Ball (first forecast), Sharp Eye (≥ 95), Against the Odds
(≥ 90 on Hard), Analyst of the Day (≥ 400 daily), Human Intuition (beat the computer 10 times),
Polymath (≥ 80 in every topic), Weekly Briefing (7-day streak).

### AI interface

`GameEnvironment<Session, Choice, Observation, { difficulty, topic, rounds }>` (default five
Normal graphs). Each action is a forecasting method or `blend`; the observation holds only the
visible values, the number of hidden years and the axis. Agents: Random method, Flat line, Recent
trend (5-year), Forecaster (the blend). `npm run evaluate -- graph-forecast <a> <a> 200 7`, mean
session total out of 500: Random 220.2, Flat 212.0, Recent trend 228.1, **Forecaster 244.9**.

### Tests

`tests/engine.test.ts` (dataset integrity and spot checks, pools, challenge rules, determinism and
variety, avoidance, drawing, completion, clamping, scoring curve, forecaster never peeking and
beating a flat line, daily and endless sessions, validation, adapter contract with an
observation check); `tests/ui.test.tsx` (a full daily with the keyboard, warning on incomplete
lines, results and record, resume after reload, end of an endless run);
`tests/e2e/games/graph-forecast.spec.ts` (a full daily drawn with real pointer strokes, the record
after reload, keyboard endless run resumed after reload; desktop and Pixel 7).

### Deliberate choices

- Data is World Bank only (no Our World in Data long-run series yet), so windows start in 1960 at
  the earliest.
- The daily challenge depends on the shipped dataset; regenerating the data changes old days.

## Shared with #244 Trend Draw

`ForecastChart` takes an optional `guide` (a dashed-dotted reference curve, e.g. the world's) and
marks a single visible point with a dot; both are off for this game, whose behaviour is unchanged.
