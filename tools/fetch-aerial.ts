/**
 * Downloads the Wikidata items that have an aerial view (P8592) for Aerial Eye (#242) — with
 * class, coordinates, country and labels — into `.cache/wikidata/aerial.json` (gitignored; data
 * CC0). Then `npx tsx tools/generate-aerial.ts` and `npx tsx tools/fetch-aerial-images.ts`.
 *
 *   npx tsx tools/fetch-aerial.ts [--wdqs]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { QLEVER, sparql, WDQS } from './wikidata';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
mkdirSync(cache, { recursive: true });
const endpoint = process.argv.includes('--wdqs') ? WDQS : QLEVER;

const query = `SELECT ?item ?sl ?img ?classEn ?en ?es ?mul ?coord ?cen ?ces WHERE {
  ?item wdt:P8592 ?img .
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= 25)
  ?item wdt:P625 ?coord .
  OPTIONAL { ?item wdt:P31 ?class . ?class rdfs:label ?classEn . FILTER(lang(?classEn) = "en") }
  OPTIONAL { ?item wdt:P17 ?country . ?country rdfs:label ?cen . FILTER(lang(?cen) = "en")
             ?country rdfs:label ?ces . FILTER(lang(?ces) = "es") }
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
  OPTIONAL { ?item rdfs:label ?mul . FILTER(lang(?mul) = "mul") }
}`;
const data = (await sparql(query, endpoint)) as { results: { bindings: unknown[] } };
writeFileSync(join(cache, 'aerial.json'), JSON.stringify(data));
console.log(data.results.bindings.length, 'rows');
