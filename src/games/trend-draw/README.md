# #244 Trend Draw

A drawing game over real data (generic name; original design — the brief's “Trendle” entry is a
trend-guessing game; here the player draws a whole series). One World Bank indicator for one
country is shown over 15–40 years, but only its first point is visible — with the world's own
curve for the same years dotted across the chart as a guide. The player draws the country's whole
line. Distinct from #231 Graph Forecast, which shows most of a series and asks for its
continuation: here there is no history to extend, only a starting level and a reference to read
against.

| File                | Role                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `engine.ts`         | Pure rules: pools, charts, world guide, scoring, reference curves, sessions      |
| `TrendDrawGame.tsx` | Menu, record, chart (the #231 chart with a guide), reveal, results               |
| `ai-adapter.ts`     | `GameEnvironment` and agents (random, flat, follow the world, similar countries) |

## Specification

### Data

The shared World Bank World Development Indicators set (`src/games/shared/stats/wdi.json`, CC BY
4.0): country series (no aggregates) whose indicator has a World series (40 of 44). World totals
(population, total GDP, air passengers, tourist arrivals) are left out — a sum over all countries
is no guide for one of them.

### Ruleset (`trend-draw-world`)

- Levels: Easy 15–20 years of smooth indicators; Normal 20–30 years; Hard 25–40 years, volatile
  indicators too. Half the windows end at the latest year both series share.
- The y axis covers the country's and the world's values in the window, padded 6–18 % at random on
  each side (never below zero for quantities that cannot be negative, never above a measure's
  maximum); a chart where the country's line would sit in the bottom 15 % is rejected.
- Only the first year is shown. The player draws every later year (strokes fill the years they
  cross; skipped years join linearly from the first point; values are clamped to the axis).
- Score: 100 · e^(−m / 0.1), m = mean |drawn − real| as a share of the axis height (1 % → 90, 5 % →
  61, 10 % → 37).
- The reveal shows the real line and the computer's “similar countries” curve with its score.

### Modes, interface, controls

Daily (five Normal charts, one per topic; 500 max; share grid) and Endless (topic × difficulty;
the last 300 series avoided; End run). Drawing uses #231's chart: freehand with any number of
strokes, or the keyboard (← → pick a year, ↑ ↓ set it, Shift faster, Space copies and moves on,
Enter submits); Clear starts over.

### Saves, statistics, achievements

Versioned slot with the session (resumable), daily totals, seen series, difficulty, topic and the
record (charts, average, charts where you beat the similar-countries curve, daily streak).
Achievements: First Stroke, Steady Hand (90+), Better Than the Peers (10 wins over the computer
curve), Trend Setter (350+ daily), Daily Sketch (7-day streak).

### AI interface

The action picks the curve drawn for the current chart: flat (the first value), world (the world's
changes — ratios for money and counts, differences otherwise — applied to the first value), peers
(the average path of the eight countries whose first-year value on this indicator is closest,
applied the same way) or blend (world and peers averaged). No curve ever reads the country's later
values (a test changes them and checks every curve is unchanged). Observation: indicator, country,
first year and value, the world curve, the number of years to draw and the axis. Agents: Random
(any of the four), Flat line, Follow the world, Similar countries. `npm run evaluate -- trend-draw
<a> <a> 200 7`, mean total out of 500: Flat 110.4, Random 151.3, Follow the world 152.8, **Similar
countries 168.3**.

### Tests

`tests/engine.test.ts`: pools (countries only); 300 random charts (window lengths, world coverage,
axis around both curves, no totals, readable country line); scoring; drawing helpers; reference
curves never read hidden years; peers > world > flat; the daily (topics, deterministic, history-
independent, share grid); endless charts (topic, no repeats, clamping, validation, finishing);
observations; agents; adapter contract. `tests/ui.test.tsx`: the daily by keyboard with the guide
and start point, the incomplete-line warning; resume and End run.
`tests/e2e/games/trend-draw.spec.ts`: a full daily drawn freehand (desktop + mobile), and Clear,
keyboard drawing and resume.

### Simplifications

None known.
