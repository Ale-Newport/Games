# #245 Gap Graph

A chart-completion game over real data (generic name; original design — the brief's “Daily
Graph” entry asks to fill hidden parts of charts). Two kinds of chart alternate: a country's line
with three years missing, and eight countries' bars with three bars missing. Distinct from #231
(continuing a series), #243 (placing countries on one axis) and #244 (drawing a whole series): here
the surrounding data is visible and the player reads the shape around each gap — and for lines the
trick is that the hidden years always include the one that broke the trend.

| File               | Role                                                                    |
| ------------------ | ----------------------------------------------------------------------- |
| `engine.ts`        | Pure rules: line and bar charts, gaps, axis, scoring, sessions          |
| `GapChart.tsx`     | The chart (line or bars), gap handles (drag or keyboard slider), reveal |
| `GapGraphGame.tsx` | Menu, record, chart, gap list, reveal, results                          |
| `ai-adapter.ts`    | `GameEnvironment` and agents (random, straight lines, analyst)          |

## Specification

### Data

The shared World Bank World Development Indicators set (`src/games/shared/stats/wdi.json`, CC BY
4.0), countries only. Difficulty limits volatility (Easy smooth indicators, Normal moderate, Hard
all) and which countries appear (Easy the 40 most populous, Normal 90, Hard all).

### Ruleset (`gap-graph-3`)

- **Line**: a run of 12–20 consecutive years of one country's series. The three hidden years are
  inner years at least two apart, and always include the year whose value strays most from the
  straight line between its neighbours.
- **Bars**: one indicator in a year from 2000 on, eight random reporting countries; three bars
  hidden. Charts whose positive values span more than ×50 are skipped (no common readable scale).
- The y axis has nice bounds around the values with 5 % padding (from zero for bars of
  non-negative data and for non-negative lines touching it; capped at a measure's maximum).
- Each gap scores 100 · e^(−d / 0.1), d = error as a share of the axis height; guesses are clamped
  to the axis. A chart scores the rounded average of its three gaps.

### Modes, interface, controls

Daily (five Normal charts — line, bars, line, bars, line — one per topic; 500 max; share grid) and
Endless (topic × difficulty, kinds alternating; the last 200 charts avoided; End run). Each gap is a
handle: drag it (anywhere in its column) or, focused, ↑ ↓ 1 % (Shift 5 %), Home, End; Enter locks.
The reveal shows the real values (green) with the miss dashed, and per gap “you / actual /
points”. On narrow screens bar labels are rotated and long names shortened.

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-chart), daily totals, seen charts, difficulty,
topic and the record (charts, average, gaps ≥ 90, daily streak). Achievements: Mind the Gap,
Seamless (all three ≥ 90), Gap Filler (30 gaps ≥ 90), Data Detective (400+ daily), Daily Charts
(7-day streak).

### AI interface

Action i·101 + k sets gap i to k % of the axis height; 303 locks (legal once every gap is set).
Observation: the chart (kind, indicator, country or year, countries, axis, gap positions), the
visible values (null at the gaps) and the guesses. Agents: Random; Straight lines (linear
interpolation between the nearest visible years; the mean of the visible bars); Analyst (straight
lines for years; for a hidden bar, the five countries most like it on the _other_ indicators that
year — the hidden bars' own values are never read, which a test checks). `npm run evaluate --
gap-graph <a> <a> 100 7`, mean total out of 500: Random 90.3, Straight lines 249.0, **Analyst
287.6**.

### Tests

`tests/engine.test.ts`: 300 random charts (lines: lengths, inner gaps two apart, the biggest bend
hidden; bars: eight distinct countries, readable span; values on the axis); scoring; the daily
(alternating kinds, deterministic, history-independent, share grid); clamping, locking, endless,
validation, finishing; straight-line interpolation; the analyst never reads hidden bars; agent
ordering; lock legality and levels; adapter contract. `tests/ui.test.tsx`: the daily by keyboard
with scores equal to the engine's; resume of a half-filled chart, End run.
`tests/e2e/games/gap-graph.spec.ts`: a full daily dragging every gap (desktop + mobile), and keyboard
gaps with resume.

### Simplifications

None known.
