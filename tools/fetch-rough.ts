/**
 * Downloads the extra Wikidata facts for Rough Guess (#234) into `.cache/wikidata/` (CC0):
 * coordinates of major cities (for great-circle distances) and properties of the chemical
 * elements. The World Bank Pink Sheet (commodity prices, CC BY 4.0) is fetched separately:
 *   curl -L -o .cache/worldbank/pinksheet/CMO-Historical-Data-Monthly.xlsx \
 *     https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx
 *
 *   npx tsx tools/fetch-rough.ts [--force]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sparql } from './wikidata';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
const force = process.argv.includes('--force');
mkdirSync(cache, { recursive: true });

const QUERIES: Record<string, string> = {
  'rough-cities': `SELECT ?item ?en ?es ?coord ?country ?sl WHERE {
  ?item wdt:P31 ?class .
  VALUES ?class { wd:Q515 wd:Q1549591 wd:Q1637706 wd:Q200250 wd:Q5119 }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= 120)
  ?item p:P625 ?st . ?st ps:P625 ?coord ; wikibase:rank ?rank . FILTER(?rank != wikibase:DeprecatedRank)
  OPTIONAL { ?item wdt:P17 ?country }
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
}`,
  // One query per element property (melting/boiling point, density, atomic mass).
  ...Object.fromEntries(
    ['P2101', 'P2102', 'P2054', 'P2067'].map((p) => [
      `rough-el-${p}`,
      `SELECT ?item ?en ?es ?z ?amount ?unit ?rank ?part WHERE {
  ?item p:${p} ?st .
  ?st psv:${p} [ wikibase:quantityAmount ?amount ; wikibase:quantityUnit ?unit ] ; wikibase:rank ?rank .
  ?item wdt:P31 wd:Q11344 ; wdt:P1086 ?z .
  OPTIONAL { ?st pq:P518 ?part }
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
}`,
    ]),
  ),
};

for (const [name, query] of Object.entries(QUERIES)) {
  const file = join(cache, `${name}.json`);
  if (existsSync(file) && !force) continue;
  const data = (await sparql(query)) as { results: { bindings: unknown[] } };
  writeFileSync(file, JSON.stringify(data));
  console.log(name, data.results.bindings.length, 'rows');
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('done');
