/**
 * Downloads the World Bank World Development Indicators used by the statistics games into
 * `.cache/worldbank/` (gitignored). Data: World Bank Open Data, CC BY 4.0.
 * Run once, then `npx tsx tools/generate-stats.ts` builds the shipped dataset from the cache.
 *
 *   npx tsx tools/fetch-worldbank.ts [--force]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { INDICATORS } from '../src/games/shared/stats/indicators';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'worldbank');
const force = process.argv.includes('--force');
mkdirSync(cache, { recursive: true });

async function get(url: string): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'stats-games-builder' } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      if (attempt >= 4) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function save(name: string, url: string) {
  const file = join(cache, name);
  if (existsSync(file) && !force) return;
  const data = await get(url);
  writeFileSync(file, JSON.stringify(data));
  console.log('saved', name);
}

const base = 'https://api.worldbank.org/v2';
await save('countries-en.json', `${base}/en/country?format=json&per_page=400`);
await save('countries-es.json', `${base}/es/country?format=json&per_page=400`);
for (const ind of INDICATORS) {
  await save(
    `${ind.code}.json`,
    `${base}/country/all/indicator/${ind.code}?format=json&per_page=20000&date=1960:2025`,
  );
}
console.log('done');
