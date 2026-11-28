# Game Expansion Progress

Counts (updated 2026-11-27):

- Baseline games (verified: registered, COMPLETE, own e2e spec each): **230**
- Requested: 36 — of which 2 already existed (#120 Word Guess = Wordle, #209 Country Shape =
  Worldle), so **34 new games** are planned (#231–#264)
- New games completed: **7**
- Total playable games: **237**

Only games that are COMPLETE by `docs/game-standards.md` count. Nothing below “done” is
playable in production (unregistered games are not shown in the library).

| #   | Game                                 | Research | Engine | Content | Graphics | AI   | Tests | Integrated | Status   |
| --- | ------------------------------------ | -------- | ------ | ------- | -------- | ---- | ----- | ---------- | -------- |
| 231 | Graph Forecast (Extraplot-style)     | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 232 | Size Sense (Size It Up-style)        | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 233 | Order of Magnitude (Magnitudle)      | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 234 | Rough Guess (Roughly-style)          | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 235 | Closest Call (Bullseye-style)        | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 236 | Plot the Point (Factual-style)       | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 237 | Price Check (Asking Price-style)     | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 238 | Clue Ladder (Tenfold-style)          | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 239 | Year Guess (Time Clocker-style)      | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 240 | One-Star Landmarks (One Star-style)  | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 241 | Fact Match (Decoydle-style)          | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 242 | Aerial Eye (Analyst Eye-style)       | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 243 | Number Line (Spanzo-style)           | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 244 | Trend Draw (Trendle-style)           | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 245 | Gap Graph (Daily Graph-style)        | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 246 | Equation Guess (Nerdle-style)        | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 247 | Hex Isles (Catan-style)              | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 248 | World Conquest (Risk-style)          | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 249 | Land Baron (Monopoly-style)          | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 250 | Tile Realm (Carcassonne-style)       | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 251 | Fading Empires (Small World-style)   | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 252 | Global Front (Axis & Allies-style)   | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 253 | Star Council (Twilight Imperium)     | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 254 | Planet Shapers (Terraforming Mars)   | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 255 | Farmstead (Agricola-style)           | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 256 | Iron Fields (Scythe-style)           | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 257 | Trade League (Concordia-style)       | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 258 | Ages of Nations (Through the Ages)   | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 259 | Wonder Draft (7 Wonders-style)       | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 260 | Rise of Cultures (Clash of Cultures) | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 261 | Rail Routes (Ticket to Ride-style)   | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 262 | Reef Dominion (Root-style)           | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 263 | Guild Ascendancy (Dune: Imperium)    | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 264 | Stellar Expanse (Eclipse-style)      | —        | —      | —       | —        | —    | —     | —          | TODO     |

## Log

- 2026-11-27 — Baseline recorded (230 games; lint, typecheck, 4,384 unit tests, build, 800/800
  Playwright). Regression guard `tests/platform/baseline.test.ts`. New categories `estimation` and
  `tabletop`; catalog entries #231–#264 (TODO, not playable). Shared real-data module
  `src/games/shared/stats/` (World Bank WDI, 7,615 series, CC BY 4.0) and forecasting library.
  **#231 Graph Forecast COMPLETE.**
- 2026-11-27 — **#232 Size Sense COMPLETE**: 5,716 Wikidata measurements (21 families,
  consistency + plausibility validated), 25 original silhouettes, true-scale auto-zooming stage,
  daily + endless, metric/imperial, AI env (Typical size 287.6 / 500).
- 2026-11-27 — **#233 Order of Magnitude COMPLETE**: 5,101 verified quantities (Wikidata +
  World Bank + #232 sizes), scientific-notation answers, banded higher/lower feedback, magnitude
  ruler with feasible range, three tries, AI env (Informed 387.9 / 500).
- 2026-11-27 — **#234 Rough Guess COMPLETE**: range answers on log scales with calibration;
  World Bank Pink Sheet prices (1,948 commodity-years), 118 elements, 137,550 city pairs and the
  #233 bank; calibrated AI 325.6 / 1000.
- 2026-11-28 — **#235 Closest Call COMPLETE**: 2–4 contestant estimation contest (people and/or
  computer players), turn order with visible answers, ring target, closest bonus, 8 rounds of rising
  difficulty; computer contestants with honest beliefs and expected-points play (Hard > Normal >
  Easy > Random in duels).
- 2026-11-28 — **#236 Plot the Point COMPLETE**: real World Bank scatter charts (18 pairs, any
  year with ≥ 60 countries) with mystery countries to drag into place; similar-countries AI
  (263.1 / 500 vs 134.5 centroid).
- 2026-11-28 — **#237 Price Check COMPLETE**: 1,149 verified dated prices (Wikidata, 14
  currencies), 277 credited Commons photos + original illustrations, closest / don't-go-over
  rules, today's-money context; similar-products AI 219.3 / 600.
- 2026-11-28 — **#238 Clue Ladder COMPLETE**: five-rung ladders over the #233/#234 bank
  (related facts, digit count, leading digit, narrow window), higher/lower feedback bands and a
  keep-or-climb choice; clue-reasoner AI 263.7 / 500 vs 218.2 always-climb.
- 2026-11-28 — **#239 Year Guess COMPLETE**: 5,367 dated Wikidata events in 13 kinds on a timeline
  compressed with age (3000 BC–2025, no year 0), tolerance growing with age, daily one-per-era with
  a recap; clue-words AI 94.5 / 500 vs 43.6 typical year. Data via QLever during a WDQS outage.
- 2026-11-28 — **#240 One-Star Landmarks COMPLETE**: 137 famous places, each with an original
  three-line one-star review in English and Spanish; distance / direction hints, a map, five
  guesses; review-reader AI 364.5 / 500 vs 350.3 triangulator.
- 2026-11-28 — **#241 Fact Match COMPLETE**: boards of five same-family facts and seven true
  numbers (two decoys from the family), three checks with locks and crosses; expert AI 190.4 /
  300 vs 124.4 ranker.
- 2026-11-28 — **#242 Aerial Eye COMPLETE**: 365 freely licensed aerial photographs (Wikidata
  aerial views, Commons, credited) in 11 kinds; zoom-out on misses, six options; colour-reader
  AI 161.9 / 500 vs 140.5 random.
- 2026-11-28 — **Fix across #231–#242**: the dailies took the player's history of seen items into
  account from round 2 on, so the “same for everyone” daily could differ between players. Every
  engine now ignores that history in daily mode; each game's daily test asserts it.
- 2026-11-28 — **#243 Number Line COMPLETE**: World Bank indicators on a number line (log or
  linear, 2nd–98th percentile span) with three references; place three mystery countries;
  similar-countries AI 304.5 / 500 vs 209.6 middle reference.
- 2026-11-28 — **#244 Trend Draw COMPLETE**: draw a country's whole World Bank series from its first
  point, with the world's curve as a guide (reusing #231's chart); similar-countries AI 168.3 / 500
  vs 152.8 follow-the-world, 110.4 flat.

- 2026-11-28 — **#245 Gap Graph COMPLETE**: World Bank lines (three missing years, always including
  the biggest break from trend) and bars (three missing of eight countries) in turn; analyst AI
  287.6 / 500 vs 249.0 straight lines.

- 2026-11-28 — **#246 Equation Guess COMPLETE**: find a hidden true equation of 6 or 8 characters
  (Mini, Classic, Hard) from green / yellow / grey marks; every guess must be true; answer pools
  enumerated exhaustively (206 + 16,239). Completes the guessing category (#231–#246).
