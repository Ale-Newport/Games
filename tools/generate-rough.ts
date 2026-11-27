/**
 * Builds `src/games/rough-guess/data.json` for Rough Guess (#234):
 * - commodity prices: annual averages of the World Bank Pink Sheet monthly nominal prices
 *   (CC BY 4.0), only for years with all twelve months reported (parsed by a Python helper
 *   because the source is an .xlsx file);
 * - chemical elements (Wikidata, CC0): melting and boiling points (kelvin), density (g/cm³) and
 *   atomic mass (Da); every statement converted, preferred rank first, values agreeing within
 *   2 % (temperatures) or 5 % (others);
 * - major cities (Wikidata, CC0) with coordinates, for great-circle distances computed in the
 *   engine; cities whose coordinate statements disagree by more than 20 km are dropped.
 *
 *   npx tsx tools/fetch-rough.ts && npx tsx tools/generate-rough.ts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache');
const out = join(root, 'src', 'games', 'rough-guess', 'data.json');

/* ---------- commodity prices ---------- */

/** Pink Sheet column → [key, English, Spanish, unit key, fame]. */
const COMMODITIES: [string, string, string, string, string, number][] = [
  ['Crude oil, Brent', 'brent', 'Brent crude oil', 'Petróleo Brent', 'bbl', 90],
  ['Crude oil, WTI', 'wti', 'WTI crude oil', 'Petróleo WTI', 'bbl', 70],
  ['Natural gas, US', 'gas-us', 'Natural gas (US)', 'Gas natural (EE. UU.)', 'mmbtu', 50],
  ['Coal, Australian', 'coal', 'Australian coal', 'Carbón australiano', 'mt', 40],
  ['Cocoa', 'cocoa', 'Cocoa', 'Cacao', 'kg', 60],
  ['Coffee, Arabica', 'arabica', 'Arabica coffee', 'Café arábica', 'kg', 70],
  ['Coffee, Robusta', 'robusta', 'Robusta coffee', 'Café robusta', 'kg', 40],
  [
    'Tea, avg 3 auctions',
    'tea',
    'Tea (average of 3 auctions)',
    'Té (media de 3 subastas)',
    'kg',
    50,
  ],
  ['Palm oil', 'palm-oil', 'Palm oil', 'Aceite de palma', 'mt', 40],
  ['Soybeans', 'soybeans', 'Soybeans', 'Soja', 'mt', 50],
  ['Maize', 'maize', 'Maize (corn)', 'Maíz', 'mt', 60],
  ['Rice, Thai 5% ', 'rice', 'Thai rice (5 % broken)', 'Arroz tailandés (5 % partido)', 'mt', 60],
  [
    'Wheat, US HRW',
    'wheat',
    'Wheat (US hard red winter)',
    'Trigo (duro rojo de invierno, EE. UU.)',
    'mt',
    60,
  ],
  ['Banana, US', 'banana', 'Bananas (US import)', 'Plátanos (importación EE. UU.)', 'kg', 60],
  ['Orange', 'orange', 'Oranges', 'Naranjas', 'kg', 50],
  ['Beef **', 'beef', 'Beef', 'Carne de vacuno', 'kg', 60],
  ['Chicken **', 'chicken', 'Chicken', 'Pollo', 'kg', 50],
  ['Sugar, world', 'sugar', 'Sugar (world market)', 'Azúcar (mercado mundial)', 'kg', 60],
  ['Cotton, A Index', 'cotton', 'Cotton', 'Algodón', 'kg', 50],
  ['Rubber, RSS3', 'rubber', 'Natural rubber', 'Caucho natural', 'kg', 40],
  ['Urea ', 'urea', 'Urea (fertiliser)', 'Urea (fertilizante)', 'mt', 30],
  ['Aluminum', 'aluminium', 'Aluminium', 'Aluminio', 'mt', 60],
  ['Copper', 'copper', 'Copper', 'Cobre', 'mt', 70],
  ['Lead', 'lead', 'Lead', 'Plomo', 'mt', 40],
  ['Tin', 'tin', 'Tin', 'Estaño', 'mt', 40],
  ['Nickel', 'nickel', 'Nickel', 'Níquel', 'mt', 50],
  ['Zinc', 'zinc', 'Zinc', 'Cinc', 'mt', 50],
  ['Gold', 'gold', 'Gold', 'Oro', 'troy-oz', 100],
  ['Platinum', 'platinum', 'Platinum', 'Platino', 'troy-oz', 60],
  ['Silver', 'silver', 'Silver', 'Plata', 'troy-oz', 80],
];

const xlsx = join(cache, 'worldbank', 'pinksheet', 'CMO-Historical-Data-Monthly.xlsx');
const pyOut = execFileSync(
  'python3',
  [
    '-I',
    '-c',
    `
import sys, json, openpyxl
wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
rows = list(wb['Monthly Prices'].iter_rows(values_only=True))
updated = rows[3][0]
names = rows[4]
out = {}
for r in rows[6:]:
    if not r[0] or 'M' not in str(r[0]): continue
    year = int(str(r[0])[:4])
    for i, n in enumerate(names):
        if not n or not isinstance(r[i], (int, float)): continue
        out.setdefault(n, {}).setdefault(year, []).append(r[i])
print(json.dumps({'updated': updated, 'series': out}))
`,
    xlsx,
  ],
  { maxBuffer: 64 * 1024 * 1024 },
).toString();
const pink = JSON.parse(pyOut) as {
  updated: string;
  series: Record<string, Record<string, number[]>>;
};
const prices: [number, number, number][] = [];
COMMODITIES.forEach(([column], ci) => {
  const years = pink.series[column];
  if (!years) throw new Error(`Missing Pink Sheet column ${column}`);
  for (const [y, months] of Object.entries(years)) {
    if (months.length !== 12) continue;
    const avg = months.reduce((a, b) => a + b, 0) / 12;
    if (avg > 0) prices.push([ci, Number(y), Number(avg.toPrecision(3))]);
  }
});

/* ---------- elements ---------- */

interface Row {
  item: { value: string };
  en?: { value: string };
  es?: { value: string };
  z?: { value: string };
  amount: { value: string };
  unit: { value: string };
  rank: { value: string };
  part?: { value: string };
  coord?: { value: string };
  sl?: { value: string };
  country?: { value: string };
}
const wd = (f: string) =>
  (JSON.parse(readFileSync(join(cache, 'wikidata', f), 'utf8')) as { results: { bindings: Row[] } })
    .results.bindings;
const unitOf = (r: Row) => r.unit.value.split('/').pop()!;
const CONVERT: Record<string, (v: number, unit: string) => number | null> = {
  // temperatures → kelvin
  P2101: (v, u) =>
    u === 'Q11579'
      ? v
      : u === 'Q25267'
        ? v + 273.15
        : u === 'Q42289'
          ? ((v - 32) * 5) / 9 + 273.15
          : null,
  P2102: (v, u) =>
    u === 'Q11579'
      ? v
      : u === 'Q25267'
        ? v + 273.15
        : u === 'Q42289'
          ? ((v - 32) * 5) / 9 + 273.15
          : null,
  // density → g/cm³
  P2054: (v, u) => (u === 'Q13147228' ? v : u === 'Q844211' ? v / 1000 : null),
  // atomic mass → dalton
  P2067: (v, u) => (u === 'Q483261' ? v : null),
};
const TOL: Record<string, number> = { P2101: 1.02, P2102: 1.02, P2054: 1.05, P2067: 1.01 };
const elements = new Map<
  string,
  { en: string; es: string; z: number; props: Record<string, number> }
>();
for (const p of Object.keys(CONVERT)) {
  const byItem = new Map<string, Row[]>();
  for (const r of wd(`rough-el-${p}.json`)) {
    const id = r.item.value.split('/').pop()!;
    byItem.set(id, [...(byItem.get(id) ?? []), r]);
  }
  for (const [id, rows] of byItem) {
    const en = rows.find((r) => r.en)?.en?.value;
    const z = Number(rows[0]!.z?.value);
    if (!en || !(z >= 1 && z <= 118)) continue;
    let vals = rows
      .filter((r) => !r.part)
      .map((r) => ({
        v: CONVERT[p]!(Number(r.amount.value), unitOf(r)),
        pref: r.rank.value.endsWith('PreferredRank'),
      }))
      .filter((x): x is { v: number; pref: boolean } => x.v !== null && x.v > 0);
    if (vals.some((x) => x.pref)) vals = vals.filter((x) => x.pref);
    const vs = vals.map((x) => x.v).sort((a, b) => a - b);
    if (!vs.length || vs[vs.length - 1]! > vs[0]! * TOL[p]!) continue;
    const e = elements.get(id) ?? { en, es: rows.find((r) => r.es)?.es?.value || en, z, props: {} };
    e.props[p] = Number(vs[Math.floor(vs.length / 2)]!.toPrecision(4));
    elements.set(id, e);
  }
}
// Gases at room temperature (boiling point below 298 K) have phase-dependent densities that
// sources report inconsistently, and helium has no melting point at ordinary pressure: skip them.
for (const e of elements.values()) {
  if ((e.props.P2102 ?? 1e9) < 298) delete e.props.P2054;
  if ((e.props.P2101 ?? 1e9) < 14) delete e.props.P2101;
}
const elementRows = [...elements.entries()]
  .sort((a, b) => a[1].z - b[1].z)
  .map(([id, e]) => [
    id,
    e.en,
    e.es,
    e.z,
    e.props.P2101 ?? 0,
    e.props.P2102 ?? 0,
    e.props.P2054 ?? 0,
    e.props.P2067 ?? 0,
  ]);

/* ---------- cities ---------- */

const haversine = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r;
  const dLon = (b[1] - a[1]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
};
const cityRows = new Map<string, Row[]>();
for (const r of wd('rough-cities.json')) {
  const id = r.item.value.split('/').pop()!;
  cityRows.set(id, [...(cityRows.get(id) ?? []), r]);
}
const cities: [string, string, string, number, number, string, number][] = [];
for (const [id, rows] of cityRows) {
  const en = rows.find((r) => r.en)?.en?.value;
  if (!en) continue;
  const pts = [...new Set(rows.map((r) => r.coord!.value))].map((c) => {
    const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(c)!;
    return [Number(m[2]), Number(m[1])] as [number, number];
  });
  if (pts.some((p) => haversine(p, pts[0]!) > 20)) continue;
  const [lat, lon] = pts[0]!;
  const country =
    rows
      .find((r) => r.country)
      ?.country?.value.split('/')
      .pop() ?? '';
  cities.push([
    id,
    en,
    rows.find((r) => r.es)?.es?.value || en,
    Number(lat.toFixed(4)),
    Number(lon.toFixed(4)),
    country,
    Number(rows[0]!.sl!.value),
  ]);
}
cities.sort((a, b) => b[6] - a[6]);

writeFileSync(
  out,
  JSON.stringify({
    source: 'World Bank Pink Sheet (CC BY 4.0); Wikidata (CC0)',
    pinkSheetUpdated: pink.updated,
    commodities: COMMODITIES.map(([, key, en, es, unit, fame]) => [key, en, es, unit, fame]),
    prices,
    elements: elementRows,
    cities,
  }) + '\n',
);
console.log({
  prices: prices.length,
  elements: elementRows.length,
  cities: cities.length,
  pairs: (cities.length * (cities.length - 1)) / 2,
});
