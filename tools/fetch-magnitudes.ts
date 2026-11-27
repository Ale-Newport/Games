/**
 * Downloads the Wikidata quantities for Order of Magnitude (#233) into `.cache/wikidata/`
 * (gitignored; data CC0). Then `npx tsx tools/generate-magnitudes.ts`.
 *
 *   npx tsx tools/fetch-magnitudes.ts [--force]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAGNITUDE_QUERIES } from './magnitude-queries';
import { sparql } from './wikidata';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
const force = process.argv.includes('--force');
mkdirSync(cache, { recursive: true });

for (const q of MAGNITUDE_QUERIES) {
  const file = join(cache, `mag-${q.id}.json`);
  if (existsSync(file) && !force) continue;
  const data = (await sparql(q.query)) as { results: { bindings: unknown[] } };
  writeFileSync(file, JSON.stringify(data));
  console.log(q.id, data.results.bindings.length, 'rows');
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('done');
