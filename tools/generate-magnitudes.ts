/**
 * Builds `src/games/order-of-magnitude/questions.json` for Order of Magnitude (#233) from:
 * - Wikidata (CC0, `.cache/wikidata/mag-*.json` from tools/fetch-magnitudes.ts): city populations,
 *   river lengths, mountain elevations, lake / island / country areas;
 * - the World Bank series already shipped in `shared/stats/wdi.json` (CC BY 4.0): each country's
 *   latest population, GDP, air passengers and tourist arrivals;
 * - the validated Size Sense measurements (`size-sense/objects.json`): heights and lengths of
 *   structures and ships, diameters of planets and stars.
 *
 * Wikidata rules: statements qualified with “applies to part” are dropped (rivers keep “drainage
 * system”, the usual total length); a preferred-rank
 * statement wins; populations otherwise take the latest dated statement (its year is shown);
 * other measures must agree within 5 %; every value must be plausible for its kind.
 *
 *   npx tsx tools/generate-magnitudes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAGNITUDE_QUERIES } from './magnitude-queries';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'wikidata');
const out = join(root, 'src', 'games', 'order-of-magnitude', 'questions.json');

/** [id, kind, value, English subject, Spanish subject, fame, year (0 = none)] */
type Q = [string, string, number, string, string, number, number];
const questions: Q[] = [];

const LENGTH: Record<string, number> = {
  Q11573: 1,
  Q828224: 1000,
  Q3710: 0.3048,
  Q253276: 1609.344,
};
const AREA_KM2: Record<string, number> = {
  Q712226: 1, // square kilometre
  Q25343: 1e-6, // square metre
  Q35852: 0.01, // hectare
  Q232291: 2.589988, // square mile
  Q81292: 0.004046856, // acre
};
const ONE = 'Q199'; // the number 1 (unitless counts)

interface Row {
  item: { value: string };
  en?: { value: string };
  es?: { value: string };
  amount: { value: string };
  unit: { value: string };
  rank: { value: string };
  time?: { value: string };
  part?: { value: string };
  sl: { value: string };
}

const KIND: Record<
  string,
  {
    kind: string;
    min: number;
    max: number;
    convert: (r: Row) => number | null;
    /** “applies to part” values accepted as whole-object figures. */
    parts?: string[];
  }
> = {
  cities: {
    kind: 'city-pop',
    min: 50_000,
    max: 45_000_000,
    convert: (r) => (r.unit.value.endsWith(`/${ONE}`) ? Number(r.amount.value) : null),
  },
  rivers: {
    kind: 'river-length',
    // Lengths qualified “drainage system” are the commonly quoted totals (Nile 6,650 km).
    parts: ['Q285451'],
    min: 50,
    max: 7_100,
    convert: (r) => {
      const f = LENGTH[r.unit.value.split('/').pop()!];
      return f ? (Number(r.amount.value) * f) / 1000 : null;
    },
  },
  mountains: {
    kind: 'mountain-elev',
    min: 300,
    max: 8_849,
    convert: (r) => {
      const f = LENGTH[r.unit.value.split('/').pop()!];
      return f ? Number(r.amount.value) * f : null;
    },
  },
  lakes: {
    kind: 'lake-area',
    min: 1,
    max: 400_000,
    convert: (r) => {
      const f = AREA_KM2[r.unit.value.split('/').pop()!];
      return f ? Number(r.amount.value) * f : null;
    },
  },
  islands: {
    kind: 'island-area',
    min: 1,
    max: 2_200_000,
    convert: (r) => {
      const f = AREA_KM2[r.unit.value.split('/').pop()!];
      return f ? Number(r.amount.value) * f : null;
    },
  },
  countries: {
    kind: 'country-area',
    min: 0.4,
    max: 18_000_000,
    convert: (r) => {
      const f = AREA_KM2[r.unit.value.split('/').pop()!];
      return f ? Number(r.amount.value) * f : null;
    },
  },
};

const sig = (v: number, d = 4) => Number(v.toPrecision(d));
const stats: Record<string, { items: number; kept: number; ambiguous: number; range: number }> = {};

for (const q of MAGNITUDE_QUERIES) {
  const spec = KIND[q.id]!;
  const rows = (
    JSON.parse(readFileSync(join(cache, `mag-${q.id}.json`), 'utf8')) as {
      results: { bindings: Row[] };
    }
  ).results.bindings;
  const byItem = new Map<string, Row[]>();
  for (const r of rows) {
    const id = r.item.value.split('/').pop()!;
    const l = byItem.get(id);
    if (l) l.push(r);
    else byItem.set(id, [r]);
  }
  const st = (stats[q.id] = { items: byItem.size, kept: 0, ambiguous: 0, range: 0 });
  for (const [id, rs] of byItem) {
    const en = rs.find((r) => r.en)?.en?.value.trim();
    if (!en || /^Q\d+$/.test(en)) continue;
    const es = rs.find((r) => r.es)?.es?.value.trim() || en;
    const statements = new Map<string, { v: number; preferred: boolean; year: number }>();
    for (const r of rs) {
      if (r.part && !spec.parts?.includes(r.part.value.split('/').pop()!)) continue;
      const v = spec.convert(r);
      if (v === null || !(v > 0)) continue;
      const year = r.time ? Number(r.time.value.slice(0, r.time.value.startsWith('-') ? 5 : 4)) : 0;
      statements.set(`${r.amount.value}|${r.unit.value}|${r.rank.value}|${year}`, {
        v,
        preferred: r.rank.value.endsWith('PreferredRank'),
        year,
      });
    }
    let list = [...statements.values()];
    if (!list.length) continue;
    if (list.some((s) => s.preferred)) list = list.filter((s) => s.preferred);
    let value: number;
    let year = 0;
    if (spec.kind === 'city-pop') {
      // Populations change: take the latest dated figure (it must be dated, from 1990 on).
      const dated = list.filter((s) => s.year >= 1990).sort((a, b) => b.year - a.year);
      if (!dated.length) continue;
      const latest = dated.filter((s) => s.year === dated[0]!.year).map((s) => s.v);
      if (Math.max(...latest) > Math.min(...latest) * 1.05) {
        st.ambiguous++;
        continue;
      }
      value = latest[0]!;
      year = dated[0]!.year;
    } else {
      const vs = list.map((s) => s.v).sort((a, b) => a - b);
      if (vs[vs.length - 1]! > vs[0]! * 1.05) {
        st.ambiguous++;
        continue;
      }
      value = vs[Math.floor(vs.length / 2)]!;
    }
    if (value < spec.min || value > spec.max) {
      st.range++;
      continue;
    }
    questions.push([id, spec.kind, sig(value), en, es, Number(rs[0]!.sl.value), year]);
    st.kept++;
  }
}

// World Bank: each country's latest value of a few big-number indicators.
const wdi = JSON.parse(
  readFileSync(join(root, 'src', 'games', 'shared', 'stats', 'wdi.json'), 'utf8'),
) as {
  indicators: string[];
  entities: [string, string, string, string, 0 | 1][];
  series: [number, number, number, number[]][];
};
const WB: Record<string, string> = {
  'SP.POP.TOTL': 'country-pop',
  'NY.GDP.MKTP.CD': 'gdp',
  'IS.AIR.PSGR': 'air-passengers',
  'ST.INT.ARVL': 'tourists',
};
const population = new Map<number, number>();
for (const [ind, ent, , values] of wdi.series)
  if (wdi.indicators[ind] === 'SP.POP.TOTL') population.set(ent, values[values.length - 1]!);
const fameOf = (ent: number) => {
  if (wdi.entities[ent]![0] === 'WLD') return 200;
  const p = population.get(ent) ?? 0;
  return p >= 50e6 ? 100 : p >= 10e6 ? 60 : p >= 1e6 ? 30 : 10;
};
let wb = 0;
for (const [ind, ent, start, values] of wdi.series) {
  const kind = WB[wdi.indicators[ind]!];
  const e = wdi.entities[ent]!;
  if (!kind || (e[4] === 1 && e[0] !== 'WLD')) continue;
  const v = values[values.length - 1]!;
  if (!(v > 0)) continue;
  const [en, es] = e[0] === 'WLD' ? ['the world', 'el mundo'] : [e[2], e[3]];
  questions.push([
    `WB:${e[0]}:${kind}`,
    kind,
    sig(v, 3),
    en,
    es,
    fameOf(ent),
    start + values.length - 1,
  ]);
  wb++;
}

// Size Sense measurements (already validated by tools/generate-sizes.ts).
const sizes = JSON.parse(
  readFileSync(join(root, 'src', 'games', 'size-sense', 'objects.json'), 'utf8'),
) as { objects: [string, string, string, number, string, string, number][] };
const SIZE_KIND: Record<string, string> = {
  skyscraper: 'building-height',
  tower: 'building-height',
  bridge: 'bridge-length',
  ship: 'ship-length',
  planet: 'body-diameter',
  star: 'star-diameter',
};
let sz = 0;
for (const [id, family, , metres, en, es, fame] of sizes.objects) {
  const kind = SIZE_KIND[family];
  if (!kind || fame < 15) continue;
  const v = kind === 'body-diameter' || kind === 'star-diameter' ? metres / 1000 : metres;
  questions.push([`${id}:${kind}`, kind, sig(v), en, es, fame, 0]);
  sz++;
}

// One question per id (an item can appear in two classes).
const seen = new Set<string>();
const unique = questions.filter((q) =>
  seen.has(`${q[0]}|${q[1]}`) ? false : (seen.add(`${q[0]}|${q[1]}`), true),
);
unique.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
writeFileSync(
  out,
  JSON.stringify({ source: 'Wikidata (CC0); World Bank WDI (CC BY 4.0)', questions: unique }) +
    '\n',
);
console.table(stats);
const kinds: Record<string, number> = {};
for (const q of unique) kinds[q[1]] = (kinds[q[1]] ?? 0) + 1;
console.log(kinds, { worldBank: wb, sizes: sz }, unique.length, 'questions');
