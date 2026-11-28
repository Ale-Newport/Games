# #243 Number Line

A placement game over real data (generic name; original design — no public game called “Spanzo”
could be found). One World Bank indicator in one year is drawn as a number line with three
reference countries already placed; the player drags three mystery countries to where they
belong. Distinct from #236 Plot the Point (two indicators, a scatter chart): here one axis, with
anchors to reason from.

| File                 | Role                                                                       |
| -------------------- | -------------------------------------------------------------------------- |
| `engine.ts`          | Pure rules: the line (span, log / linear), boards, scoring, sessions       |
| `Line.tsx`           | The line: ticks, references, draggable pins (keyboard sliders), reveal     |
| `NumberLineGame.tsx` | Menu, record, board, mystery countries, reveal, results                    |
| `ai-adapter.ts`      | `GameEnvironment` and agents (random, middle reference, similar countries) |

## Specification

### Data

The shared World Bank World Development Indicators set (`src/games/shared/stats/wdi.json`, CC BY
4.0; 44 indicators, countries only — aggregates excluded). An indicator-year makes a board when
60+ countries report it; mystery countries for Easy come from the 60 most populous countries, for
Normal from the 120 most populous, for Hard from all.

### Ruleset (`number-line-3x3`)

- The line covers the 2nd to 98th percentile of the year's values, with nice bounds; it is
  logarithmic (powers of ten, plus 2× and 5× ticks on short lines) when the values are positive
  and span more than ×30 (×10 for money and counts), linear otherwise (capped at the measure's
  maximum, e.g. 100 %).
- References: the best-known countries near the 10th, 50th and 90th percentiles, shown in order.
- Mystery countries: three countries on the line (not clamped at an end), at least 3 % of the line
  apart.
- Score per country: 100 · e^(−d / 0.1), d = distance from the true position as a share of the
  line (2 % → 82, 5 % → 61, 10 % → 37). A board scores the rounded average of its three.

### Modes, interface, controls

Daily (five boards, one per topic: economy, people, health, environment, technology; 500 max; share
grid) and Endless (topic × difficulty; the last 20 indicators avoided; End run). Choose a country
(button or 1–3), then tap the line or drag its pin; the board's arrow keys move the selected pin
(placing it in the middle first), each pin is also a keyboard slider (← → 0.5 %, Shift 5 %, Home,
End); Enter locks. The reveal shows each true value as a star on the axis joined to its pin, the
points, your value and the actual one, and the World Bank source with its update date.

### Saves, statistics, achievements

Versioned slot with the session (resumable mid-board), daily totals, seen indicators, difficulty,
topic and the record (lines, average, placements ≥ 90, daily streak). Achievements: On the Line,
Three in Place (all three ≥ 90), Sharpshooter (25 placements ≥ 90), Statistician (400+ daily),
Daily Data (7-day streak).

### AI interface

Action i·201 + k places country i at k / 200; 603 locks (legal once all three are placed).
Observation: indicator, year, line, references with positions, mystery countries, placements —
never their values. Agents: Random; Middle reference (everything on the middle reference); Similar
countries (for each mystery country, the five countries most like it on the _other_ indicators
that year, standardised; their positions on this line averaged — the board's own indicator is
never read for the mystery countries, which a test checks). `npm run evaluate -- number-line <a>
<a> 100 7`, mean total out of 500: Random 90.3, Middle reference 209.6, **Similar countries 304.5**.

### Tests

`tests/engine.test.ts`: the line (positions both ways, log and linear choice, percentile span),
scoring; hundreds of indicator-years; 200 random boards (six distinct countries, all on the line,
references in order, targets 3 % apart); Easy pools; placing, locking and the average; the daily
(five topics, deterministic, independent of the player's history, share grid); endless boards,
validation, finishing; the neighbour estimate never reads the hidden values; agent ordering; lock
legality and bins; adapter contract. `tests/ui.test.tsx`: the daily by keyboard with pin sliders,
scores equal to the engine's; choosing by button, resume, End run.
`tests/e2e/games/number-line.spec.ts`: a full daily by taps with a drag (desktop + mobile), and
keyboard placing with resume.

### Simplifications

None known. A country outside the 2nd–98th percentile is never a reference or a mystery; it can
still exist in the data.
