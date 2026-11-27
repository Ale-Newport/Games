# #234 Rough Guess

A range-estimation game (generic name; original design — no public rules for a game called
“Roughly” could be found, so the mechanic follows the brief: real-world quantities, diverse
categories, proximity scoring, unlimited play). The player answers every question with a range,
“roughly between X and Y”, and is rewarded for ranges that are both right and narrow — a
calibration game, distinct from #233's single-number powers of ten and #235's closest call.

| File                      | Role                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| `engine.ts`               | Pure rules: question keys, pools, scales, range scoring, sessions         |
| `RangeScale.tsx`          | Two-handled log-scale range picker (pointer, band drag, keyboard sliders) |
| `RoughGuessGame.tsx`      | Menu, record, play, reveal, results with a calibration verdict            |
| `format.ts`               | Values with units (prices, km, °C, g/cm³, u, and #233's units)            |
| `ai-adapter.ts`           | `GameEnvironment` and agents (random, play it safe, calibrated)           |
| `data.json`               | Prices, elements and cities (generated)                                   |
| `tools/fetch-rough.ts`    | Wikidata downloads (cities, elements); the Pink Sheet URL                 |
| `tools/generate-rough.ts` | Validation and build of `data.json`                                       |

## Specification

### Questions

| Kind             | Data                                                                                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commodity price  | World Bank Pink Sheet (CC BY 4.0, updated 3 Nov 2026): annual average of monthly nominal US$ prices for 30 commodities, years with all 12 months only — 1,948 commodity-years                                                                |
| Distance         | Great-circle distance (mean Earth radius 6,371.0088 km) between two of 525 cities with ≥ 120 Wikipedia sitelinks, from Wikidata coordinates (dropped when its coordinate statements differ by > 20 km); always two countries — 137,550 pairs |
| Chemical element | Wikidata: melting and boiling point (K, shown in °C), density (g/cm³, not for gases at 25 °C), atomic mass (Da); values must agree within 2 % (temperatures), 5 % or 1 %                                                                     |
| World facts      | The #233 bank: city and country populations, GDP, rivers, mountains, country / island / lake areas, building heights, planet and moon diameters                                                                                              |

Spot checks in the tests: gold 2024 ≈ US$2,390/oz, Brent 2008 ≈ US$97.6/bbl, iron melts at
1,811 K, mercury boils at 630 K, carbon 12.01 Da, London–Paris ≈ 344 km, New York–Tokyo
≈ 10,850 km.

Difficulty (fame): Easy — commodities with fame ≥ 60, the first 30 elements and familiar metals,
#233 items with ≥ 60 sitelinks, cities with ≥ 220 sitelinks (74); Normal — ≥ 30 / ≥ 170 (190
cities); Hard — everything.

### Ruleset (`rough-guess-range`)

- Each question has a log scale: the extent of its kind's values (per commodity for prices;
  10–20,016 km for distances) widened ×5 each way, so the scale never gives the answer away.
- The answer is a range [lo, hi] on that scale, at least ×1.01 wide.
- Score: if lo ≤ answer ≤ hi, `max(10, round(100 × (1 − log₁₀(hi/lo) / 2)))` (×2 → 85, ×10 →
  50, ×100 or wider → 10); otherwise 0.
- Calibration: hits / questions; the results say “too bold” below 60 %, “very safe” above 92 %.
- Kinds rotate (kind first, then item; never the same kind twice in a row).

### Modes, interface, controls

Daily (ten Normal questions seeded by date, 1,000 max, share line with ⬛ for misses and the hit
count) and Endless (difficulty × topic: prices, distances, science, world facts; the last 2,500
questions avoided). The scale shows nice ticks (round °C for temperatures, spaced ≥ 64 px), the
band, two handles and, after locking in, the answer star with the band turning green or red.
The readout shows the range, its width and the points it would earn. Pointer: drag either handle,
or the band to slide both. Keyboard: each handle is a `role="slider"`: ← → / ↑ ↓ (Shift ×5),
Home, End.

### Saves, statistics, achievements

Versioned slot with the session (resumable), daily totals, seen questions, difficulty, topic,
and the record (questions, average, hit rate, typical width). Achievements: In the Ballpark,
Pinpoint (≥ 90 on a hit), Commodity Trader (≥ 80 on a price), Clean Sheet (10/10 daily), Well
Calibrated (80–95 % hit rate after 50), Roughly Daily (7-day streak).

### AI interface

Action = 9k + w: centre = scale start + 0.125·k orders, width ∈ {0.05, 0.1, 0.2, 0.3, 0.5,
0.75, 1, 1.5, 2} orders; legal if the range stays on the scale. Observation: the question (key,
kind, subject, year, scale) and the running totals. Agents: Random; Play it safe (widest range);
Calibrated (centres on the mean log value of the question's family — its own value left out —
and picks the range maximising the expected score under a normal error with that family's
spread). `npm run evaluate -- rough-guess <a> <a> 100 7`, mean total out of 1,000: Random 75.3,
Play it safe 74.1, **Calibrated 325.6**.

### Tests

`tests/engine.test.ts` (data integrity and spot checks, key resolution, pools and topics, every
answer on its scale over 2,000 draws, scoring, daily determinism, invalid ranges, hits and misses,
validation, agent ordering, adapter contract); `tests/ui.test.tsx`; and
`tests/e2e/games/rough-guess.spec.ts` (desktop + Pixel 7).
