/**
 * Builds `src/games/shared/stats/wdi.json` — the time series shipped with the statistics games —
 * from the World Bank downloads in `.cache/worldbank/` (run tools/fetch-worldbank.ts first).
 *
 * For every indicator × country (plus a few regional and income aggregates) it keeps the most
 * recent run of consecutive years with reported values (no interpolation, no invented points),
 * if that run is at least MIN_YEARS long and actually moves. Values are rounded to the
 * indicator's significant digits.
 *
 *   npx tsx tools/generate-stats.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { INDICATORS } from '../src/games/shared/stats/indicators';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'worldbank');
const out = join(root, 'src', 'games', 'shared', 'stats', 'wdi.json');
const MIN_YEARS = 20;

/** Aggregates worth guessing about (regions, income groups, the world). */
const AGGREGATES = [
  'WLD',
  'EAS',
  'ECS',
  'LCN',
  'MEA',
  'NAC',
  'SAS',
  'SSF',
  'EUU',
  'ARB',
  'HIC',
  'UMC',
  'LMC',
  'LIC',
  'OED',
  'LDC',
];

interface WbCountry {
  id: string;
  iso2Code: string;
  name: string;
  region: { value: string };
}
interface WbPoint {
  countryiso3code: string;
  date: string;
  value: number | null;
}

const read = <T>(f: string) => JSON.parse(readFileSync(join(cache, f), 'utf8')) as [unknown, T];
const en = read<WbCountry[]>('countries-en.json')[1];
const es = new Map(read<WbCountry[]>('countries-es.json')[1].map((c) => [c.id, c.name.trim()]));

const entities: [string, string, string, string, 0 | 1][] = [];
const entityIndex = new Map<string, number>();
for (const c of en) {
  const isAgg = c.region.value === 'Aggregates';
  if (isAgg && !AGGREGATES.includes(c.id)) continue;
  entityIndex.set(c.id, entities.length);
  entities.push([c.id, c.iso2Code, c.name.trim(), es.get(c.id) ?? c.name.trim(), isAgg ? 1 : 0]);
}

function round(v: number, digits: number): number {
  if (v === 0) return 0;
  const p = Math.pow(10, digits - Math.ceil(Math.log10(Math.abs(v))));
  const r = Math.round(v * p) / p;
  // Avoid binary noise like 0.30000000000000004 in the JSON.
  return Number(r.toPrecision(digits));
}

const series: [number, number, number, number[]][] = [];
const perIndicator: Record<string, number> = {};
let latestYear = 0;
for (const [ii, ind] of INDICATORS.entries()) {
  const points = read<WbPoint[]>(`${ind.code}.json`)[1];
  const byEntity = new Map<string, Map<number, number>>();
  for (const p of points) {
    if (p.value === null || !entityIndex.has(p.countryiso3code)) continue;
    let m = byEntity.get(p.countryiso3code);
    if (!m) byEntity.set(p.countryiso3code, (m = new Map()));
    m.set(Number(p.date), p.value);
  }
  let kept = 0;
  for (const [iso3, years] of byEntity) {
    const last = Math.max(...years.keys());
    let first = last;
    while (years.has(first - 1)) first--;
    if (last - first + 1 < MIN_YEARS) continue;
    const values: number[] = [];
    for (let y = first; y <= last; y++) values.push(round(years.get(y)!, ind.digits));
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    if (!ind.signed && lo < 0) continue;
    const span = hi - lo;
    const scale = Math.max(Math.abs(hi), Math.abs(lo));
    // A line that barely moves is not a guessing challenge.
    if (scale === 0 || span / scale < 0.06) continue;
    if (ind.format === 'pct' && span < 1) continue;
    // Constant stretches (carried-forward estimates) longer than a third of the series.
    let flat = 0;
    for (let k = 1; k < values.length; k++) if (values[k] === values[k - 1]) flat++;
    if (flat > values.length / 3) continue;
    series.push([ii, entityIndex.get(iso3)!, first, values]);
    latestYear = Math.max(latestYear, last);
    kept++;
  }
  perIndicator[ind.code] = kept;
}

const meta = read<{ lastupdated: string }>('SP.POP.TOTL.json')[0] as { lastupdated: string };
const data = {
  source: 'World Bank, World Development Indicators (CC BY 4.0)',
  updated: meta.lastupdated,
  indicators: INDICATORS.map((i) => i.code),
  entities,
  series,
};
writeFileSync(out, JSON.stringify(data));
console.log(perIndicator);
console.log(
  `${series.length} series, ${entities.length} entities, latest year ${latestYear}, ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`,
);
