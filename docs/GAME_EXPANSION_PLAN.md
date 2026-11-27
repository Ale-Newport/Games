# Game Expansion Plan (games 231–264)

Expansion of the 230-game catalog with guessing/estimation games and modern strategy board
games. It is additive: no existing game, route, save format or deployment setting changes.

## Baseline (recorded 2026-11-27, commit `18ea1be`)

- 230 playable games, all COMPLETE in `src/data/roadmap.ts` and registered in
  `src/games/registry.ts` + `src/ai/adapters/registry.ts`. Routes are hash routes
  `#/game/<id>` (GitHub Pages cannot rewrite paths), base `/Games/`.
- Manifest of the baseline: `tests/platform/baseline-games.json`; every file under `src/games/`
  at that commit: `tests/platform/baseline-files.txt`. `tests/platform/baseline.test.ts` fails if
  any baseline game stops being registered, changes number/category, loses its entry module,
  preview art or AI bundle, or if any baseline file is deleted.
- Baseline checks run before any change: `npm run lint` ✔, `npm run typecheck` ✔, `vitest`
  549 files / 4,384 tests ✔, `npm run build` ✔ (Playwright baseline: see
  GAME_EXPANSION_TESTS.md).
- Stack: React 19 + TypeScript (strict) + Vite, CSS modules over the tokens in
  `src/styles/tokens.css`, Vitest + Playwright, GitHub Actions → GitHub Pages
  (`.github/workflows/ci.yml`, `deploy` job). No backend.

## Requested games already in the catalog (not duplicated)

| Request    | Existing game                        | Decision                                                                                                                    |
| ---------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 14 Wordle  | #120 Word Guess (`word-guess`)       | Already complete: letter feedback with duplicate handling, hard mode, daily + random, EN/ES lists (12,607 accepted), stats. |
| 17 Worldle | #209 Country Shape (`country-shape`) | Already complete: real outlines, distance/direction/proximity, daily + practice, capital and flag bonus rounds.             |

So 34 games are new: #231–#246 (16 guessing games) and #247–#264 (18 board games).

## Naming and originality

Project rule (CLAUDE.md §6) and our own policy: generic names, original art, text, maps, cards
and factions. Mechanics of a genre are reproduced faithfully; the names, characters, artwork,
card texts, faction designs and map layouts of the commercial games are **not**. Each board game
README states which published game's ruleset its mechanics follow and every deliberate change.
Catalog names keep the established "Generic Name (X-style)" pattern.

## New categories

- `estimation` — _Guessing & Daily Challenges_ (#231–#246)
- `tabletop` — _Strategy Board Games_ (#247–#264)

Both are listed after the existing seven in the home page and library filters.

## Order of work

Strictly one game at a time, in catalog order. Guessing games first: they share the real-data
infrastructure (`src/games/shared/stats/`: World Bank WDI time series) that #231, #236, #243,
#244 and #245 build on. Board games follow, each a multi-session effort.

| #   | id                   | Name                                       | Base mechanics                                  |
| --- | -------------------- | ------------------------------------------ | ----------------------------------------------- |
| 231 | `graph-forecast`     | Graph Forecast (Extraplot-style)           | Draw the hidden end of a real time series       |
| 232 | `size-sense`         | Size Sense (Size It Up-style)              | Resize an object against a reference            |
| 233 | `order-of-magnitude` | Order of Magnitude (Magnitudle-style)      | Narrow a quantity by powers of ten              |
| 234 | `rough-guess`        | Rough Guess (Roughly-style)                | Proximity-scored numeric estimates              |
| 235 | `closest-call`       | Closest Call (Bullseye-style)              | Rounds of closest-to-the-value estimates        |
| 236 | `plot-the-point`     | Plot the Point (Factual-style)             | Place data points on a real chart               |
| 237 | `price-check`        | Price Check (Asking Price-style)           | Guess prices from listings                      |
| 238 | `clue-ladder`        | Clue Ladder (Tenfold-style)                | Numeric guess with progressive clues            |
| 239 | `year-guess`         | Year Guess (Time Clocker-style)            | Year of historical events                       |
| 240 | `one-star-landmarks` | One-Star Landmarks (One Star-style)        | Identify places from grumpy (original) reviews  |
| 241 | `fact-match`         | Fact Match (Decoydle-style)                | Match numbers to facts, eliminate decoys        |
| 242 | `aerial-eye`         | Aerial Eye (Analyst Eye-style)             | Identify features in aerial imagery             |
| 243 | `number-line`        | Number Line (Spanzo-style)                 | Place a value between reference values          |
| 244 | `trend-draw`         | Trend Draw (Trendle-style)                 | Draw a whole series from its first point        |
| 245 | `gap-graph`          | Gap Graph (Daily Graph-style)              | Fill hidden gaps in line and bar charts         |
| 246 | `equation-guess`     | Equation Guess (Nerdle-style)              | Guess an equation, arithmetic validation        |
| 247 | `hex-isles`          | Hex Isles (Catan-style)                    | Hex resource production, building, trading      |
| 248 | `world-conquest`     | World Conquest (Risk-style)                | Territory conquest with dice combat             |
| 249 | `land-baron`         | Land Baron (Monopoly-style)                | Property trading, rents, auctions, mortgages    |
| 250 | `tile-realm`         | Tile Realm (Carcassonne-style)             | Tile laying, followers, feature scoring         |
| 251 | `fading-empires`     | Fading Empires (Small World-style)         | Race/power combos, conquest, decline            |
| 252 | `global-front`       | Global Front (Axis & Allies-style)         | Grand strategy, production, multi-domain combat |
| 253 | `star-council`       | Star Council (Twilight Imperium-style)     | Galactic 4X with politics and objectives        |
| 254 | `planet-shapers`     | Planet Shapers (Terraforming Mars-style)   | Global parameters, projects, production engine  |
| 255 | `farmstead`          | Farmstead (Agricola-style)                 | Worker placement, feeding, farm scoring         |
| 256 | `iron-fields`        | Iron Fields (Scythe-style)                 | Asymmetric engine building, mechs, stars        |
| 257 | `trade-league`       | Trade League (Concordia-style)             | Card-driven trade network, card-based scoring   |
| 258 | `ages-of-nations`    | Ages of Nations (Through the Ages-style)   | Civilization card engine, military, culture     |
| 259 | `wonder-draft`       | Wonder Draft (7 Wonders-style)             | Simultaneous drafting across three ages         |
| 260 | `rise-of-cultures`   | Rise of Cultures (Clash of Cultures-style) | Civilization map game, advances, influence      |
| 261 | `rail-routes`        | Rail Routes (Ticket to Ride-style)         | Set collection, route claiming, tickets         |
| 262 | `reef-dominion`      | Reef Dominion (Root-style)                 | Asymmetric factions on a clearing map           |
| 263 | `guild-ascendancy`   | Guild Ascendancy (Dune: Imperium-style)    | Deck building + worker placement, conflicts     |
| 264 | `stellar-expanse`    | Stellar Expanse (Eclipse-style)            | Space 4X, ship blueprints, dice combat          |

## Definition of done

`docs/game-standards.md` (the project's definition) plus the expansion checklist in the
mission: every core and special mechanic, real content, AI opponents with real strategy, save
and resume, unit + full-game + Playwright tests, desktop and mobile visual review, docs, and a
dedicated `feat(games): complete #NNN <Name>` commit.
