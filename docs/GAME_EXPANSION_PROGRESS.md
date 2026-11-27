# Game Expansion Progress

Counts (updated 2026-11-27):

- Baseline games (verified: registered, COMPLETE, own e2e spec each): **230**
- Requested: 36 — of which 2 already existed (#120 Word Guess = Wordle, #209 Country Shape =
  Worldle), so **34 new games** are planned (#231–#264)
- New games completed: **4**
- Total playable games: **234**

Only games that are COMPLETE by `docs/game-standards.md` count. Nothing below “done” is
playable in production (unregistered games are not shown in the library).

| #   | Game                                 | Research | Engine | Content | Graphics | AI   | Tests | Integrated | Status   |
| --- | ------------------------------------ | -------- | ------ | ------- | -------- | ---- | ----- | ---------- | -------- |
| 231 | Graph Forecast (Extraplot-style)     | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 232 | Size Sense (Size It Up-style)        | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 233 | Order of Magnitude (Magnitudle)      | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 234 | Rough Guess (Roughly-style)          | done     | done   | done    | done     | done | done  | done       | COMPLETE |
| 235 | Closest Call (Bullseye-style)        | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 236 | Plot the Point (Factual-style)       | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 237 | Price Check (Asking Price-style)     | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 238 | Clue Ladder (Tenfold-style)          | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 239 | Year Guess (Time Clocker-style)      | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 240 | One-Star Landmarks (One Star-style)  | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 241 | Fact Match (Decoydle-style)          | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 242 | Aerial Eye (Analyst Eye-style)       | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 243 | Number Line (Spanzo-style)           | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 244 | Trend Draw (Trendle-style)           | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 245 | Gap Graph (Daily Graph-style)        | —        | —      | —       | —        | —    | —     | —          | TODO     |
| 246 | Equation Guess (Nerdle-style)        | —        | —      | —       | —        | —    | —     | —          | TODO     |
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
