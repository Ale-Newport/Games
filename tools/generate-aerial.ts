/**
 * Builds `src/games/aerial-eye/places.json` for Aerial Eye (#242) from the Wikidata download
 * (tools/fetch-aerial.ts, data CC0): every place has an aerial-view photo on Wikimedia Commons.
 *
 * Rules: the place's category comes from its classes, in priority order (an airport city is an
 * airport only if the item is the airport); only photographs (JPEG / PNG, no maps, plans or
 * locator images); one coordinate; names fall back to the language-neutral label; within each
 * category the best-known places are kept (by sitelinks), with names unique in the category.
 * Images and colours are added by tools/fetch-aerial-images.ts.
 *
 *   npx tsx tools/generate-aerial.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const rows = (
  JSON.parse(readFileSync(join(root, '.cache', 'wikidata', 'aerial.json'), 'utf8')) as {
    results: { bindings: Record<string, { value: string } | undefined>[] };
  }
).results.bindings;
const out = join(root, 'src', 'games', 'aerial-eye', 'places.json');

/** Category → class labels, in priority order; and how many places to keep. */
const CATEGORIES: [string, RegExp, number][] = [
  ['airport', /\b(airport|aerodrome)\b/i, 40],
  ['circuit', /racing track|race track|racecourse|motor racing circuit/i, 30],
  [
    'city',
    /big city|national capital|megacity|metropolis|global city|largest city|capital city|city of Japan|city in the United States|port city|state capital/i,
    60,
  ],
  ['ancient', /archaeological site|ancient city|ruins\b|amphitheatre/i, 30],
  ['stadium', /\bstadium\b|football venue|sports venue|arena\b/i, 30],
  ['castle', /\b(castle|palace|château|fortress|citadel)\b/i, 40],
  ['volcano', /volcano|stratovolcano|caldera/i, 30],
  ['mountain', /^(mountain|mountain range|massif|summit)$/i, 30],
  ['island', /\bisland\b|archipelago|atoll/i, 40],
  ['lake', /^(lake|reservoir|crater lake|glacial lake)$/i, 30],
  ['river', /^(river|stream)$/i, 30],
];
/** Left out: places of worship and contested holy sites, micronations. */
const EXCLUDE = new Set([
  'Western Wall',
  'Mount of Olives',
  'Apostolic Palace',
  'Temple Mount',
  'Principality of Sealand',
]);
/** Countries that no longer exist (Wikidata's P17 sometimes names one). */
const HISTORICAL =
  /Judaea|Byzantine|Roman Empire|Ancient|Kingdom of|Empire|Ottoman|Soviet|Yugoslavia/i;

interface Item {
  qid: string;
  classes: Set<string>;
  file: string;
  fame: number;
  en: string;
  es: string;
  lat: number;
  lon: number;
  country: [string, string];
}
const items = new Map<string, Item>();
for (const r of rows) {
  const qid = r.item!.value.split('/').pop()!;
  const file = decodeURIComponent(r.img!.value.split('/').pop()!).replace(/_/g, ' ');
  let it = items.get(qid);
  if (!it) {
    const m = /point\(([-\d.eE]+) ([-\d.eE]+)\)/i.exec(r.coord!.value);
    if (!m) continue;
    it = {
      qid,
      classes: new Set(),
      file,
      fame: Number(r.sl!.value),
      en: r.en?.value ?? r.mul?.value ?? '',
      es: r.es?.value ?? r.en?.value ?? r.mul?.value ?? '',
      lat: Number(m[2]),
      lon: Number(m[1]),
      country: [r.cen?.value ?? '', r.ces?.value ?? ''],
    };
    items.set(qid, it);
  }
  if (r.classEn) it.classes.add(r.classEn.value);
  if (!it.country[0] && r.cen) it.country = [r.cen.value, r.ces?.value ?? r.cen.value];
}

const PHOTO = /\.(jpe?g|png)$/i;
const NOT_PHOTO = /\b(map|karte|carte|mapa|plan|locator|location|diagram|logo|svg)\b/i;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const picked: Record<string, Item[]> = {};
const dropped: Record<string, number> = {};
const drop = (why: string) => (dropped[why] = (dropped[why] ?? 0) + 1);
for (const it of items.values()) {
  if (!PHOTO.test(it.file) || NOT_PHOTO.test(it.file)) {
    drop('not a photograph');
    continue;
  }
  if (EXCLUDE.has(it.en)) {
    drop('left out');
    continue;
  }
  if (!it.en || /^Q\d+$/.test(it.en) || !it.country[0] || HISTORICAL.test(it.country[0])) {
    drop('no name or country');
    continue;
  }
  const classes = [...it.classes];
  const cat = CATEGORIES.find(([, re]) => classes.some((c) => re.test(c)));
  if (!cat) {
    drop('no category');
    continue;
  }
  (picked[cat[0]] ??= []).push(it);
}

type Out = [
  qid: string,
  category: string,
  en: string,
  es: string,
  lat: number,
  lon: number,
  countryEn: string,
  countryEs: string,
  fame: number,
  file: string,
];
const result: Out[] = [];
for (const [cat, , keep] of CATEGORIES) {
  const list = (picked[cat] ?? []).sort((a, b) => b.fame - a.fame || a.qid.localeCompare(b.qid));
  const names = new Set<string>();
  let n = 0;
  for (const it of list) {
    if (n >= keep) break;
    const key = it.en.toLowerCase();
    if (names.has(key)) {
      drop('same name in category');
      continue;
    }
    names.add(key);
    result.push([
      it.qid,
      cat,
      cap(it.en),
      cap(it.es),
      +it.lat.toFixed(4),
      +it.lon.toFixed(4),
      it.country[0],
      it.country[1],
      it.fame,
      it.file,
    ]);
    n++;
  }
}
writeFileSync(out, JSON.stringify(result));
const per: Record<string, number> = {};
for (const r of result) per[r[1]] = (per[r[1]] ?? 0) + 1;
console.log(result.length, 'places', per);
console.log('dropped', dropped);
