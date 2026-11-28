/**
 * Downloads the dated Wikidata statements for Year Guess (#239) into `.cache/wikidata/`
 * (gitignored; data CC0). Then `npx tsx tools/generate-years.ts`.
 *
 *   npx tsx tools/fetch-years.ts [--force] [kind…]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { QLEVER, sparql, WDQS } from './wikidata';
import { YEAR_QUERIES, yearQuery } from './year-queries';

const cache = join(import.meta.dirname, '..', '.cache', 'wikidata');
const force = process.argv.includes('--force');
// QLever by default (fast, no rate limit to speak of); `--wdqs` uses the Wikidata Query Service.
const endpoint = process.argv.includes('--wdqs') ? WDQS : QLEVER;
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
mkdirSync(cache, { recursive: true });

for (const q of YEAR_QUERIES) {
  if (only.length && !only.includes(q.id)) continue;
  const file = join(cache, `year-${q.id}.json`);
  if (existsSync(file) && !force) continue;
  try {
    const data = (await sparql(yearQuery(q), endpoint)) as { results: { bindings: unknown[] } };
    writeFileSync(file, JSON.stringify(data));
    console.log(q.id, data.results.bindings.length, 'rows');
  } catch (e) {
    console.log(q.id, 'FAILED', String(e));
  }
  // WDQS: one query a minute keeps clear of its rate limit.
  await new Promise((r) => setTimeout(r, endpoint === WDQS ? 65_000 : 1000));
}
console.log('done');
