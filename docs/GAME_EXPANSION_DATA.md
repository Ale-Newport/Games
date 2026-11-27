# Game Expansion Data Sources

Every dataset is prepackaged in the repository (no game depends on a live API) and recorded with
its license in `docs/asset-licenses.md`.

| Dataset                                | Games                              | Source / license                    | Build                                                                                                                                        |
| -------------------------------------- | ---------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| World Development Indicators, 44 codes | #231 (and planned #236, #243–#245) | World Bank Open Data API, CC BY 4.0 | `npx tsx tools/fetch-worldbank.ts` → `.cache/worldbank/` (gitignored), `npx tsx tools/generate-stats.ts` → `src/games/shared/stats/wdi.json` |

## World Development Indicators (`src/games/shared/stats/`)

- Downloaded 2026-11-27 from `https://api.worldbank.org/v2/country/all/indicator/<code>`
  (World Bank data last updated 2026-11-11). 46 indicators requested; 2 yielded no usable series
  (international migrant stock is published every five years; high-tech exports had no 20-year
  consecutive run) and were dropped, leaving 44.
- Kept per indicator × country/region: the most recent run of consecutive years with a value,
  ≥ 20 years, moving ≥ 6 % (≥ 1 point for percentages), not mostly repeated values. Rounded to
  3–4 significant digits. No interpolation, no imputation.
- 7,615 series; 217 countries/territories and 12 aggregates (World, regions, income groups).
  2.0 MB JSON, 665 KB gzipped, loaded lazily in its own chunk only by the games that use it.
- Validation: `src/games/graph-forecast/tests/engine.test.ts` checks structure, ranges, every
  indicator present, and spot values against published figures (world population 1960/2000/2023,
  Japan life expectancy 1960/2010).
- Indicator metadata (topic, bilingual short titles, units, format, volatility class, bounds):
  `src/games/shared/stats/indicators.ts`.

## Object dimensions (`src/games/size-sense/objects.json`, #232)

- Wikidata Query Service (CC0), 2026-11-27; queries in `tools/size-queries.ts` (one per family;
  the generic “ship” class and a subclass walk over “coin” timed out, so ships are fetched per
  type and coins by direct class). `tools/fetch-sizes.ts` honours HTTP 429 `Retry-After`.
- Validation (`tools/generate-sizes.ts`): no part-qualified statements (except “mean”, which wins),
  preferred rank wins, values agree within 5 %, plausible range per family, known units only.
- 5,716 objects; 525 with ≥ 30 sitelinks, 2,587 with ≥ 15. 425 KB JSON, 126 KB gzipped, lazy.
- Spot checks in tests: Burj Khalifa, Golden Gate Bridge, Jupiter, Earth, Moon (within 1 %).

## Quantities (`src/games/order-of-magnitude/questions.json`, #233)

- Wikidata (CC0), 2026-11-27, `tools/magnitude-queries.ts`: city populations (P1082, latest
  statement dated ≥ 1990), river lengths (P2043, “drainage system” totals accepted), mountain
  elevations (P2044), lake / island / country areas (P2046). Raw responses can contain control
  characters, stripped by `tools/wikidata.ts` before parsing.
- World Bank WDI latest values (population, GDP, air passengers, tourist arrivals) and the #232
  measurements (buildings, bridges, ships, planets, stars).
- Found during validation: the Nile carries an unqualified 2,850 km statement (the Danube's
  length) next to its preferred, part-qualified 6,650 km — hence the rule above.
- 5,101 questions; 354 KB JSON, lazy-loaded.

## Candidate sources for upcoming games (not yet downloaded)

Each will be checked for license, CORS (not needed: data is prepackaged) and reliability before
use: Our World in Data (CC BY 4.0) for long-run series, Wikidata (CC0) for event dates, landmark
facts and object dimensions, Natural Earth (public domain; already shipped as `world-50m.json`),
public-domain or CC aerial imagery (USGS/NASA) for #242.
