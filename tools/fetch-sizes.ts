/**
 * Downloads object dimensions for Size Sense (#232) from the Wikidata Query Service (data CC0)
 * into `.cache/wikidata/` (gitignored). `npx tsx tools/generate-sizes.ts` then validates and
 * builds the shipped list. Every statement is fetched with its rank and unit so the generator can
 * keep only consistent values.
 *
 *   npx tsx tools/fetch-sizes.ts [--force]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SIZE_QUERIES } from './size-queries';
import { sparql } from './wikidata';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
const force = process.argv.includes('--force');
mkdirSync(cache, { recursive: true });

for (const q of SIZE_QUERIES) {
  const file = join(cache, `size-${q.id}.json`);
  if (existsSync(file) && !force) continue;
  const data = (await sparql(q.query)) as { results: { bindings: unknown[] } };
  writeFileSync(file, JSON.stringify(data));
  console.log(q.id, data.results.bindings.length, 'rows');
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('done');
