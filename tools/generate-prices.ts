/**
 * Builds `src/games/price-check/items.json` for Price Check (#237) from the Wikidata downloads
 * (tools/fetch-prices.ts, data CC0).
 *
 * Rules: only items whose class is in an allow-list of product / artwork categories; statements
 * with an “applies to part” qualifier are dropped; preferred rank wins; the price used is the
 * earliest dated one (its own point in time, else the item's publication, else inception date),
 * and statements of that same year must agree within 5 %; the year is required (prices without a
 * date mean nothing); values must be plausible for the category.
 *
 *   npx tsx tools/generate-prices.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'wikidata');
const out = join(root, 'src', 'games', 'price-check', 'items.json');

/** Wikidata class → [category, min, max] (price in the statement's currency). */
const CLASSES: Record<string, [string, number, number]> = {
  Q7889: ['games', 1, 500],
  Q1066707: ['games', 0.5, 200],
  Q96240590: ['games', 5, 1000],
  Q67387549: ['consoles', 20, 2000],
  Q56682555: ['consoles', 20, 2000],
  Q115187350: ['consoles', 20, 2000],
  Q135911675: ['consoles', 5, 500],
  Q10929058: ['tech', 1, 100_000],
  Q136260412: ['tech', 50, 20_000],
  Q122760264: ['tech', 30, 20_000],
  Q122967152: ['tech', 20, 20_000],
  Q55990535: ['tech', 50, 100_000],
  Q135902762: ['tech', 5, 1_000],
  Q128558307: ['tech', 5, 2_000],
  Q62008942: ['tech', 5, 100_000],
  Q136353329: ['tech', 5, 2_000],
  Q19723451: ['gadgets', 20, 5_000],
  Q20741022: ['gadgets', 20, 100_000],
  Q20888659: ['gadgets', 20, 100_000],
  Q109672300: ['gadgets', 20, 100_000],
  Q83178864: ['gadgets', 5, 20_000],
  Q123673668: ['gadgets', 20, 20_000],
  Q3305213: ['art', 1_000, 1e9],
  Q860861: ['art', 1_000, 1e9],
  Q331225: ['art', 1_000, 1e9],
  Q15056995: ['vehicles', 10_000, 1e9],
  Q7397: ['software', 1, 100_000],
  Q166142: ['software', 1, 100_000],
  Q7725634: ['books', 0.05, 500],
  Q3331189: ['books', 0.05, 500],
  Q47461344: ['books', 0.05, 500],
  Q1238720: ['books', 0.05, 500],
};

interface Row {
  item: { value: string };
  en?: { value: string };
  es?: { value: string };
  den?: { value: string };
  des?: { value: string };
  amount: { value: string };
  rank: { value: string };
  time?: { value: string };
  part?: { value: string };
  class?: { value: string };
  pub?: { value: string };
  inc?: { value: string };
  img?: { value: string };
  sl: { value: string };
}

const yearOf = (t?: string) => {
  if (!t) return null;
  const m = /^(-?\d{1,4})-/.exec(t.replace(/^\+/, ''));
  return m ? Number(m[1]) : null;
};

/** [id, category, currency, price, year, en, es, description en, description es, image file, sitelinks] */
type Item = [
  string,
  string,
  string,
  number,
  number,
  string,
  string,
  string,
  string,
  string,
  number,
];
const items: Item[] = [];
const stats: Record<string, number> = {};
const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1);

const CURRENCIES = [
  'usd',
  'eur',
  'gbp',
  'jpy',
  'cad',
  'aud',
  'chf',
  'sek',
  'inr',
  'cny',
  'krw',
  'rub',
  'pln',
  'czk',
];
const CODE: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c, c.toUpperCase()]),
);
/** Plausibility ranges are in dollar-like units; other currencies scale by their rough size. */
const SCALE: Record<string, number> = {
  usd: 1,
  eur: 1,
  gbp: 1,
  jpy: 100,
  cad: 1,
  aud: 1,
  chf: 1,
  sek: 10,
  inr: 50,
  cny: 7,
  krw: 1000,
  rub: 50,
  pln: 4,
  czk: 20,
};
/** Software, hardware, gadgets, consoles, aircraft and art need a Wikipedia article (filters
 * self-promotional entries); books and games are often catalogue imports without one. */
const NEEDS_ARTICLE = new Set(['software', 'tech', 'gadgets', 'consoles', 'vehicles', 'art']);
for (const currency of CURRENCIES) {
  const rows = (
    JSON.parse(readFileSync(join(cache, `price-${currency}.json`), 'utf8')) as {
      results: { bindings: Row[] };
    }
  ).results.bindings;
  const byItem = new Map<string, Row[]>();
  for (const r of rows) {
    const id = r.item.value.split('/').pop()!;
    byItem.set(id, [...(byItem.get(id) ?? []), r]);
  }
  for (const [id, rs] of byItem) {
    const classes = [...new Set(rs.map((r) => r.class?.value.split('/').pop() ?? ''))];
    const cls = classes.find((c) => CLASSES[c]);
    if (!cls) {
      bump('class');
      continue;
    }
    const [category, min, max] = CLASSES[cls]!;
    if (NEEDS_ARTICLE.has(category) && Number(rs[0]!.sl.value) < 1) {
      bump('no-article');
      continue;
    }
    const en = rs.find((r) => r.en)?.en?.value.trim();
    if (!en || /^Q\d+$/.test(en)) {
      bump('label');
      continue;
    }
    const fallbackYear =
      rs
        .map((r) => yearOf(r.pub?.value))
        .filter((y): y is number => y !== null)
        .sort()[0] ??
      rs
        .map((r) => yearOf(r.inc?.value))
        .filter((y): y is number => y !== null)
        .sort()[0] ??
      null;
    const statements = new Map<string, { v: number; year: number | null; preferred: boolean }>();
    for (const r of rs) {
      if (r.part) continue;
      const year = yearOf(r.time?.value) ?? fallbackYear;
      statements.set(`${r.amount.value}|${r.time?.value ?? ''}|${r.rank.value}`, {
        v: Number(r.amount.value),
        year,
        preferred: r.rank.value.endsWith('PreferredRank'),
      });
    }
    let list = [...statements.values()].filter(
      (s) => s.v > 0 && s.year !== null && s.year >= 1800 && s.year <= 2026,
    );
    if (!list.length) {
      bump('undated');
      continue;
    }
    if (list.some((s) => s.preferred)) list = list.filter((s) => s.preferred);
    const first = Math.min(...list.map((s) => s.year!));
    const same = list
      .filter((s) => s.year === first)
      .map((s) => s.v)
      .sort((a, b) => a - b);
    if (same[same.length - 1]! > same[0]! * 1.05) {
      bump('ambiguous');
      continue;
    }
    const v = same[Math.floor(same.length / 2)]!;
    if (v < min * SCALE[currency]! || v > max * SCALE[currency]!) {
      bump('range');
      continue;
    }
    const img = rs.find((r) => r.img)?.img?.value ?? '';
    items.push([
      id,
      category,
      CODE[currency]!,
      Number(v.toPrecision(6)),
      first,
      en,
      rs.find((r) => r.es)?.es?.value.trim() || en,
      rs.find((r) => r.den)?.den?.value.trim() ?? '',
      rs.find((r) => r.des)?.des?.value.trim() ?? '',
      img ? decodeURIComponent(img.split('/').pop()!) : '',
      Number(rs[0]!.sl.value),
    ]);
    bump(`kept:${category}`);
  }
}

// An item priced in several currencies keeps its US-dollar entry (then euro, pound, yen).
const ORDER: Record<string, number> = Object.fromEntries(
  CURRENCIES.map((c, i) => [c.toUpperCase(), i]),
);
const seen = new Set<string>();
const unique = items
  .sort((a, b) => ORDER[a[2]]! - ORDER[b[2]]!)
  .filter((i) => (seen.has(i[0]) ? false : (seen.add(i[0]), true)))
  .sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
/**
 * Price levels for “in today's money”: chained from World Bank consumer-price inflation
 * (FP.CPI.TOTL.ZG) of each currency's country (the European Union for euros: the euro area is not
 * in the shipped data). level[k] is relative to the last year.
 */
const wdi = JSON.parse(
  readFileSync(join(root, 'src', 'games', 'shared', 'stats', 'wdi.json'), 'utf8'),
) as {
  indicators: string[];
  entities: [string][];
  series: [number, number, number, number[]][];
};
const cpiIndex = wdi.indicators.indexOf('FP.CPI.TOTL.ZG');
const cpi: Record<string, { area: string; start: number; level: number[] }> = {};
for (const [cur, iso] of [
  ['USD', 'USA'],
  ['EUR', 'EUU'],
  ['GBP', 'GBR'],
  ['JPY', 'JPN'],
  ['CAD', 'CAN'],
  ['AUD', 'AUS'],
  ['CHF', 'CHE'],
  ['SEK', 'SWE'],
  ['INR', 'IND'],
  ['CNY', 'CHN'],
  ['KRW', 'KOR'],
  ['RUB', 'RUS'],
  ['PLN', 'POL'],
  ['CZK', 'CZE'],
] as const) {
  const ent = wdi.entities.findIndex((e) => e[0] === iso);
  const s = wdi.series.find((x) => x[0] === cpiIndex && x[1] === ent);
  if (!s) {
    console.warn(`No inflation series for ${iso}: no today's-money line for ${cur}`);
    continue;
  }
  const [, , start, rates] = s;
  // level(start) = 1, then compounding each later year's inflation; normalise to the last year.
  const level = [1];
  for (let k = 1; k < rates.length; k++) level.push(level[k - 1]! * (1 + rates[k]! / 100));
  const last = level[level.length - 1]!;
  cpi[cur] = { area: iso, start, level: level.map((v) => Number((v / last).toPrecision(6))) };
}

writeFileSync(out, JSON.stringify({ source: 'Wikidata (CC0), P2284', cpi, items: unique }) + '\n');
console.log(stats, unique.length, 'items', unique.filter((i) => i[9]).length, 'with images');
