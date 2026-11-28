# Game Expansion Data Sources

Every dataset is prepackaged in the repository (no game depends on a live API) and recorded with
its license in `docs/asset-licenses.md`.

| Dataset                                | Games                              | Source / license                    | Build                                                                                                                                        |
| -------------------------------------- | ---------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| World Development Indicators, 44 codes | #231, #236 (and planned #243–#245) | World Bank Open Data API, CC BY 4.0 | `npx tsx tools/fetch-worldbank.ts` → `.cache/worldbank/` (gitignored), `npx tsx tools/generate-stats.ts` → `src/games/shared/stats/wdi.json` |

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

## Prices, elements, cities (`src/games/rough-guess/data.json`, #234)

- World Bank Commodity Price Data (Pink Sheet), CMO-Historical-Data-Monthly.xlsx (CC BY 4.0,
  updated 3 Nov 2026), downloaded to `.cache/worldbank/pinksheet/` from thedocs.worldbank.org
  (URL in `tools/fetch-rough.ts`); annual averages of complete years for 30 commodities.
- Wikidata (CC0): element melting/boiling points, densities, atomic masses (unit-converted,
  agreement-checked; gas densities and helium's melting point dropped as ill-defined); city
  coordinates for computed great-circle distances.

## Product prices and photos (`src/games/price-check/`, #237)

- Wikidata P2284 in 14 currencies (CC0), 2026-11-28; class allow-list; earliest dated price;
  agreement and plausibility checks; an article required outside books and games. 1,149 items.
- Wikimedia Commons thumbnails (277) via the Commons API with `extmetadata` (author, licence,
  file page), shrunk with `sips`; credits shipped in `credits.json`.
- No second-hand marketplace prices: no open, verifiable source exists (documented in the game).

## Dated events (`src/games/year-guess/`, #239)

- Wikidata (CC0), 2026-11-28, through QLever's public Wikidata endpoint (dump of 10 Aug 2026 with
  live updates) because WDQS was in an outage, rate-limited to one query a minute
  (`tools/fetch-years.ts --wdqs` still targets it). 13 kinds, one query each
  (`tools/year-queries.ts`), fame thresholds by sitelinks. 5,367 events.
- BC years arrive in the RDF export's astronomical numbering (year 0 = 1 BC) and are converted;
  earliest year for releases and openings; conflicting dates, labels showing the year and
  descriptions with digits or centuries are dropped; discoveries exclude astronomy, places and
  elements known since antiquity.

## Candidate sources for upcoming games (not yet downloaded)

Each will be checked for license, CORS (not needed: data is prepackaged) and reliability before
use: Our World in Data (CC BY 4.0) for long-run series, Wikidata (CC0) for event dates, landmark
facts and object dimensions, Natural Earth (public domain; already shipped as `world-50m.json`),
public-domain or CC aerial imagery (USGS/NASA) for #242.
