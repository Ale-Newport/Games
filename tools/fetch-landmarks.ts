/**
 * Downloads names, coordinates, fame and descriptions of the One-Star Landmarks (#240) places —
 * exactly those with a written review — into `.cache/wikidata/landmarks-items.json` (gitignored;
 * data CC0). Then `npx tsx tools/generate-landmarks.ts`.
 *
 *   npx tsx tools/fetch-landmarks.ts [--wdqs]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REVIEWS } from '../src/games/one-star-landmarks/reviews';
import { QLEVER, sparql, WDQS } from './wikidata';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
mkdirSync(cache, { recursive: true });
const endpoint = process.argv.includes('--wdqs') ? WDQS : QLEVER;

const query = `SELECT ?item ?sl ?en ?es ?mul ?den ?coord ?rank WHERE {
  VALUES ?item { ${Object.keys(REVIEWS)
    .map((q) => `wd:${q}`)
    .join(' ')} }
  ?item wikibase:sitelinks ?sl .
  ?item p:P625 ?st . ?st ps:P625 ?coord ; wikibase:rank ?rank .
  OPTIONAL { ?item rdfs:label ?en . FILTER(lang(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?es . FILTER(lang(?es) = "es") }
  OPTIONAL { ?item rdfs:label ?mul . FILTER(lang(?mul) = "mul") }
  OPTIONAL { ?item schema:description ?den . FILTER(lang(?den) = "en") }
}`;
const data = (await sparql(query, endpoint)) as { results: { bindings: unknown[] } };
writeFileSync(join(cache, 'landmarks-items.json'), JSON.stringify(data));
console.log(data.results.bindings.length, 'rows');
