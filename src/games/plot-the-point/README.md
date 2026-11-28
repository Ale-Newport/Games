# #236 Plot the Point

A data-placement guessing game (generic name; original design — no public rules for a game
called “Factual” could be found, so the game follows the brief: players position data points on a
graph from their estimates, with correct coordinate systems, visual feedback, real datasets and
accuracy scores).

| File               | Role                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| `engine.ts`        | Pure rules: indicator pairs, chart picking, layout and axes, scoring, sessions |
| `neighbours.ts`    | The computer's placements (similar countries) and the centroid baseline        |
| `ScatterChart.tsx` | The scatter chart: reference dots, draggable markers, keyboard, reveal         |
| `PlotGame.tsx`     | Menu, record, play, reveal, results; saves                                     |
| `ai-adapter.ts`    | `GameEnvironment` (grid placements) and agents                                 |

Data: the World Development Indicators already shipped in `../shared/stats/wdi.json` (World Bank,
CC BY 4.0; see #231).

## Specification

### Charts (`plot-the-point-wdi`)

- 18 indicator pairs chosen to make meaningful scatter plots (GDP per person × life expectancy,
  fertility, urbanisation, internet use, CO₂; fertility × infant mortality, ageing; population ×
  tourists; GDP × air passengers; health spending × life expectancy; renewables × CO₂; women in
  the labour force × fertility; agriculture × urbanisation; energy use × CO₂; birth × death rate;
  electricity access × infant mortality; cereal yield × agriculture; exports × imports). Money,
  counts, emissions, energy, yields and trade shares use log axes.
- A chart = pair + year + mystery countries. Years: those with ≥ 60 countries reporting both
  values (positive on log axes) — 24 to 66 years per pair. Every such country is drawn.
- Mystery countries by difficulty: Easy 3 with population ≥ 30 M, Normal 4 with ≥ 8 M, Hard 5 of
  any size. No pair twice in a row; seen charts avoided in endless runs.
- Axes: the data's extent padded 6 % (in log units on log axes); nice ticks (1-2-5 × 10ᵏ on log
  axes); the six most populous visible countries are labelled, every dot names itself on hover.

### Scoring

The plot is treated as a unit square in the coordinates the player sees (log or linear). Each
mystery country scores `round(100 · e^(−d / 0.15))` for a distance d between marker and truth (on
the spot 100, 0.15 → 37, 0.3 → 14); the chart scores the mean.

### The computer

For each mystery country it ranks the visible countries by similarity on every _other_ indicator
that year (standardised; log for money and counts; at least three shared indicators) and
places the country at the mean position of the five most similar. It never reads the two
plotted values of the mystery country (a test tampers with them and checks the placement does not
move). Over 150 Normal charts: 52.4 points per country, against 24.9 for the centre of the crowd.

### Modes, interface, controls

Daily (five Normal charts, seeded by date) and Endless (difficulty; End run). The card names both
axes (and whether they are logarithmic) and the year. Mystery countries appear as numbered chips
in the platform's player colours; tap a chip, then tap or drag on the chart; the next unplaced
chip is selected automatically; markers can be dragged again. Keyboard (chart focused): arrows move
the selected marker 2 % (Shift 10 %), Tab next country, Enter submits. The reveal pops the true
positions in, draws dashed gap lines from the markers, shows the computer's diamonds and points per
country. Phone layout: square chart, labels kept inside the plot.

### Saves, statistics, achievements

Versioned slot with the session (resumable), daily totals, seen charts, difficulty and record
(charts, average, best, wins over the computer). Achievements: On the Map, Pinpoint (≥ 95 on a
country), Data Cartographer (≥ 85 on a chart), Better Than Neighbours (beat the computer 10
times), Daily Analyst (7-day streak).

### AI interface

Mystery countries are placed one by one: action a = cell (a mod 25, a div 25) of a 25 × 25 grid;
the last placement scores the chart. The observation holds the axes, year, visible countries'
positions, the mystery countries' ids and the placements so far — never their positions. Agents:
Random, Middle of the crowd, Similar countries. `npm run evaluate -- plot-the-point <a> <a> 100
7`, mean total out of 500: Random 51.3, Middle of the crowd 134.5, **Similar countries 263.1**.

### Tests

`tests/engine.test.ts` (pairs and years, positivity and plot bounds on 120 charts, difficulty
rules, truth = real values, scoring curve, estimator vs centroid, estimator never reads the
plotted values, daily determinism, invalid placements, validation, grid mapping, adapter
contract); `tests/ui.test.tsx`; `tests/e2e/games/plot-the-point.spec.ts` (taps and a drag on the
chart, keyboard placement, resume; desktop + Pixel 7).
