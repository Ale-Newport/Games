/**
 * Downloads priced items for Price Check (#237) from Wikidata (CC0) into `.cache/wikidata/`:
 * every statement of P2284 (price) in fourteen major currencies, with its rank, point-in-time and
 * “applies to part” qualifiers, the item's class, launch/publication/inception dates, image
 * (Wikimedia Commons file name), English/Spanish labels and descriptions, and sitelinks.
 *
 *   npx tsx tools/fetch-prices.ts [--force]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sparql } from './wikidata';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
const force = process.argv.includes('--force');
mkdirSync(cache, { recursive: true });

const query = (
  currency: string,
) => `SELECT ?item ?en ?es ?den ?des ?amount ?rank ?time ?part ?class ?pub ?inc ?img ?sl WHERE {
  ?item p:P2284 ?st .
  ?st psv:P2284 [ wikibase:quantityAmount ?amount ; wikibase:quantityUnit wd:${currency} ] ; wikibase:rank ?rank .
  FILTER(?rank != wikibase:DeprecatedRank)
  ?item wikibase:sitelinks ?sl .
  OPTIONAL { ?st pq:P585 ?time }
  OPTIONAL { ?st pq:P518 ?part }
  OPTIONAL { ?item wdt:P31 ?class }
  OPTIONAL { ?item wdt:P577 ?pub }
  OPTIONAL { ?item wdt:P571 ?inc }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
  OPTIONAL { ?item schema:description ?den . FILTER(lang(?den) = "en") }
  OPTIONAL { ?item schema:description ?des . FILTER(lang(?des) = "es") }
}`;

for (const [name, currency] of [
  ['usd', 'Q4917'],
  ['eur', 'Q4916'],
  ['gbp', 'Q25224'],
  ['jpy', 'Q8146'],
  ['cad', 'Q1104069'],
  ['aud', 'Q259502'],
  ['chf', 'Q25344'],
  ['sek', 'Q122922'],
  ['inr', 'Q80524'],
  ['cny', 'Q39099'],
  ['krw', 'Q202040'],
  ['rub', 'Q41044'],
  ['pln', 'Q123213'],
  ['czk', 'Q131016'],
] as const) {
  const file = join(cache, `price-${name}.json`);
  if (existsSync(file) && !force) continue;
  const data = (await sparql(query(currency))) as { results: { bindings: unknown[] } };
  writeFileSync(file, JSON.stringify(data));
  console.log(name, data.results.bindings.length, 'rows');
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('done');
