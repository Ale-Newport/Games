/**
 * Builds `src/games/size-sense/objects.json` from the Wikidata downloads (tools/fetch-sizes.ts).
 *
 * Verification rules, per object and dimension:
 * - only statements without an “applies to part” qualifier (or qualified “mean”, which then wins),
 *   in a known length unit;
 * - if any statement has preferred rank, only preferred ones count;
 * - the counted values must agree within 5 % (max ≤ 1.05 × min) — otherwise the object is
 *   dropped as ambiguous (e.g. roof vs. tip heights recorded without qualifiers);
 * - the value must fall inside a plausible range for its family (catches unit slips);
 * - the object needs an English label that is not just an id.
 *
 *   npx tsx tools/generate-sizes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SIZE_QUERIES } from './size-queries';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'wikidata');
const out = join(root, 'src', 'games', 'size-sense', 'objects.json');

/** Wikidata item “mean”, used as the “applies to part” of mean radii. */
const MEAN = 'Q2796622';

const UNITS: Record<string, number> = {
  Q11573: 1, // metre
  Q3710: 0.3048, // foot
  Q828224: 1000, // kilometre
  Q174728: 0.01, // centimetre
  Q174789: 0.001, // millimetre
  Q218593: 0.0254, // inch
  Q253276: 1609.344, // mile
  Q482798: 0.9144, // yard
  Q48440: 6.957e8, // solar radius (IAU nominal)
};

/** Family of each query: shape drawn, and plausible range in metres for the measured figure. */
const FAMILY: Record<string, { family: string; min: number; max: number }> = {
  skyscrapers: { family: 'skyscraper', min: 60, max: 1000 },
  towers: { family: 'tower', min: 20, max: 700 },
  lighthouses: { family: 'lighthouse', min: 5, max: 150 },
  statues: { family: 'statue', min: 2, max: 250 },
  pyramids: { family: 'pyramid', min: 5, max: 200 },
  dams: { family: 'dam', min: 10, max: 350 },
  'ferris-wheels': { family: 'wheel', min: 15, max: 260 },
  'roller-coasters': { family: 'coaster', min: 10, max: 160 },
  // ≥ 25 m: keeps launch vehicles, drops the orbiters listed under the same classes.
  rockets: { family: 'rocket', min: 25, max: 130 },
  trees: { family: 'tree', min: 5, max: 130 },
  bridges: { family: 'bridge', min: 50, max: 60_000 },
  'ships-carriers': { family: 'ship', min: 100, max: 400 },
  'ships-battleships': { family: 'ship', min: 60, max: 300 },
  'ships-liners': { family: 'ship', min: 50, max: 400 },
  'ships-sailing-ships': { family: 'sailship', min: 15, max: 150 },
  'ships-cruise-ships': { family: 'ship', min: 50, max: 400 },
  'ships-corvettes': { family: 'ship', min: 30, max: 150 },
  'ships-frigates': { family: 'ship', min: 30, max: 200 },
  'ships-destroyers': { family: 'ship', min: 50, max: 220 },
  'ships-submarines': { family: 'submarine', min: 10, max: 200 },
  'ships-container-ships': { family: 'ship', min: 80, max: 450 },
  aircraft: { family: 'plane', min: 5, max: 90 },
  'aircraft-wings': { family: 'wings', min: 5, max: 120 },
  cars: { family: 'car', min: 2, max: 8 },
  locomotives: { family: 'train', min: 5, max: 40 },
  coins: { family: 'coin', min: 0.01, max: 0.06 },
  'solar-system': { family: 'planet', min: 1e5, max: 2e8 },
  stars: { family: 'star', min: 1e6, max: 5e12 },
};

interface Row {
  item: { value: string };
  en?: { value: string };
  es?: { value: string };
  amount: { value: string };
  unit: { value: string };
  rank: { value: string };
  part?: { value: string };
  sl: { value: string };
}

type Obj = [
  qid: string,
  family: string,
  dim: string,
  metres: number,
  en: string,
  es: string,
  sitelinks: number,
];
const objects: Obj[] = [];
const stats: Record<string, { rows: number; kept: number; ambiguous: number; range: number }> = {};
const seen = new Set<string>();

for (const q of SIZE_QUERIES) {
  const fam = FAMILY[q.id];
  if (!fam) throw new Error(`No family for ${q.id}`);
  const data = JSON.parse(readFileSync(join(cache, `size-${q.id}.json`), 'utf8')) as {
    results: { bindings: Row[] };
  };
  const st = (stats[q.id] = {
    rows: data.results.bindings.length,
    kept: 0,
    ambiguous: 0,
    range: 0,
  });
  const byItem = new Map<string, { rows: Row[] }>();
  for (const r of data.results.bindings) {
    const id = r.item.value.split('/').pop()!;
    let e = byItem.get(id);
    if (!e) byItem.set(id, (e = { rows: [] }));
    e.rows.push(r);
  }
  const dim = q.dimension === 'radius' ? 'diameter' : q.dimension;
  for (const [qid, { rows }] of byItem) {
    const key = `${qid}:${dim}`;
    if (seen.has(key)) continue;
    const en = rows.find((r) => r.en)?.en?.value.trim();
    if (!en || /^Q\d+$/.test(en)) continue;
    const es = rows.find((r) => r.es)?.es?.value.trim() || en;
    // One value per distinct statement (labels multiply rows).
    const statements = new Map<string, { m: number; preferred: boolean }>();
    // A “mean” qualifier (planets: mean vs equatorial vs polar radius) wins; other parts are dropped.
    const hasMean = rows.some((r) => r.part?.value.endsWith(`/${MEAN}`));
    for (const r of rows) {
      if (hasMean ? !r.part?.value.endsWith(`/${MEAN}`) : r.part) continue;
      const factor = UNITS[r.unit.value.split('/').pop()!];
      if (!factor) continue;
      let m = Number(r.amount.value) * factor;
      if (q.dimension === 'radius') m *= 2;
      statements.set(`${r.amount.value}|${r.unit.value}|${r.rank.value}`, {
        m,
        preferred: r.rank.value.endsWith('PreferredRank'),
      });
    }
    let values = [...statements.values()];
    if (values.some((v) => v.preferred)) values = values.filter((v) => v.preferred);
    const ms = values
      .map((v) => v.m)
      .filter((m) => m > 0)
      .sort((a, b) => a - b);
    if (!ms.length) continue;
    if (ms[ms.length - 1]! > ms[0]! * 1.05) {
      st.ambiguous++;
      continue;
    }
    const m = ms[Math.floor(ms.length / 2)]!;
    if (m < fam.min || m > fam.max) {
      st.range++;
      continue;
    }
    seen.add(key);
    objects.push([
      qid,
      fam.family,
      dim,
      Number(m.toPrecision(4)),
      en,
      es,
      Number(rows[0]!.sl.value),
    ]);
    st.kept++;
  }
}

objects.sort((a, b) => a[0].localeCompare(b[0]) || a[2].localeCompare(b[2]));
writeFileSync(out, JSON.stringify({ source: 'Wikidata (CC0), query service', objects }) + '\n');
console.table(stats);
const fams: Record<string, number> = {};
for (const o of objects) fams[o[1]] = (fams[o[1]] ?? 0) + 1;
console.log(fams, objects.length, 'objects');
