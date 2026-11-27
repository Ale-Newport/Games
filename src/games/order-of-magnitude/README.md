# #233 Order of Magnitude

The daily numeric-estimation game in the style of Magnitudle (generic name; original look, code
and texts; verified public data). Each question asks for a real quantity; answers are given in
scientific notation and judged above all by their order of magnitude.

| File                           | Role                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `engine.ts`                    | Pure rules: questions, notation, feedback, feasible range, scoring, sessions |
| `OrderOfMagnitudeGame.tsx`     | Menu, record, play (dials, slider, typing, history), reveal, results         |
| `Ruler.tsx`                    | The 10⁰–10¹⁶ magnitude ruler with feasible range and markers                 |
| `ai-adapter.ts`                | `GameEnvironment` and agents (random, bisector, informed)                    |
| `questions.json`               | The shipped questions (generated)                                            |
| `tools/magnitude-queries.ts`   | Wikidata queries; `tools/fetch-magnitudes.ts` downloads them                 |
| `tools/generate-magnitudes.ts` | Validates and merges everything into `questions.json`                        |
| `tools/wikidata.ts`            | Shared, rate-limit-aware Wikidata Query Service client                       |

## Specification

### Questions (5,101, 15 kinds, 5 topics)

| Kind (topic)                                   | Source                                          | Count |
| ---------------------------------------------- | ----------------------------------------------- | ----: |
| City population (people)                       | Wikidata P1082, latest dated figure (≥ 1990)    | 1,447 |
| Country population, GDP (people, economy)      | World Bank WDI, each country's latest year      |   427 |
| Air passengers, tourist arrivals (economy)     | World Bank WDI, latest year                     |   282 |
| River length, mountain elevation (geography)   | Wikidata P2043 / P2044                          | 1,066 |
| Lake, island, country area (geography)         | Wikidata P2046                                  |   827 |
| Building height, bridge and ship length (eng.) | Size Sense measurements (Wikidata, validated)   |   923 |
| Planet/moon and star diameter (space)          | Size Sense measurements (twice the mean radius) |   130 |

Wikidata checks (`tools/generate-magnitudes.ts`): statements qualified “applies to part” are
dropped (rivers keep “drainage system”, the usual total length — that is how the Nile gets
6,650 km and not a stray 2,850 km statement); preferred rank wins; city populations take the latest
statement dated 1990 or later (its year is shown); other measures must agree within 5 %; values
must be plausible for the kind. The tests check Nile 6,650 km, Everest 8,848 m, Baikal 31,720
km², Russia 17.1 M km², world population > 8 bn, Jupiter 139,800 km.

Difficulty = minimum fame: Easy ≥ 45 Wikipedia sitelinks (3,011 questions), Normal ≥ 30
(4,195), Hard all (5,101). World Bank figures use population tiers as fame (≥ 50 M → 100,
≥ 10 M → 60, ≥ 1 M → 30, else 10; the world 200).

### Ruleset (`order-of-magnitude-3`)

- Answer: a leading figure 1.0–9.9 (one decimal) × 10⁰…10¹⁵.
- Up to three guesses. Feedback per guess: higher / lower and a band — exact (within 5 %), very
  close (within ×1.26 = 0.1 order), close (within ×2 = 0.3 order), right order (within ×10), or
  N orders off (rounded).
- Locking: the player may lock the last guess at any time after the first; an exact guess or the
  third guess locks automatically.
- Score = accuracy × try factor (1, 0.85, 0.7). Accuracy = 100 within 5 %, else
  `100 × max(0, 1 − |log₁₀(guess/answer)| / 2)` (×2 → 85, ×10 → 50, ×100 → 0).
- The ruler shades the range still consistent with every feedback (`feasible()`; a property test
  over 3,000 random answers checks it always contains the answer).

### Modes, interface, controls

Daily (five Normal questions of different kinds, seeded by date; share line shows each score's
square and the guesses used) and Endless (difficulty × topic; last 2,000 questions avoided; End
run). Card: kind label, subject, generic question, unit and the year of the figure. Answer box:
−/+ dials for the figure and the power of ten, a slider, a type-in field (“3200000”, “3,2e6” in
Spanish), the value in full and in words. History rows colored by band. Reveal: answer, score
count-up, how it was computed, the notation, source link (Wikidata item or World Bank country).
Keys: `↑`/`↓` power of ten, `←`/`→` figure ±0.1 (`Shift` ±1), `Enter` guess, `L` lock.

### Saves, statistics, achievements

Versioned slot: session (resumable mid-question), daily totals, seen questions, difficulty,
topic, record (questions, average, within 5 %, first-try hits). Achievements: Ballpark, First Try,
Well Calibrated (25 within 5 %), Economist (a GDP within 5 %), Power of Ten (≥ 400 daily),
Daily Estimate (7-day streak).

### AI interface

Actions 0–95: M × 10^e with M ∈ {1, 1.5, 2, 3, 5, 7}, e ∈ 0…15; 96 locks in. The observation has
the question (kind, subject, year) and each guess with its feedback — never the answer. Agents:
Random; Bisector (guesses the middle of the feasible range, locks when very close); Informed
(starts from the median of the question's kind, leaving the question out, then bisects).
`npm run evaluate -- order-of-magnitude <a> <a> 200 7`, mean total out of 500: Random 46.8,
Bisector 354.8, **Informed 387.9**.

### Tests

`tests/engine.test.ts` (bank integrity and spot checks, notation, feedback bands, accuracy and
factors, feasible-range property test, number formatting and parsing, pools and topics, daily
determinism, guess/lock rules and illegal moves, endless totals and validation, agent ordering,
adapter contract with an observation check); `tests/ui.test.tsx`; and
`tests/e2e/games/order-of-magnitude.spec.ts` (desktop + Pixel 7).
