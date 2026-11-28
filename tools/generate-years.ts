/**
 * Builds `src/games/year-guess/events.json` for Year Guess (#239) from the Wikidata downloads
 * (tools/fetch-years.ts, data CC0).
 *
 * Rules:
 * - statements need year precision or better; deprecated ones are ignored and preferred rank wins;
 * - releases (films, books, albums, video games) and openings take the earliest year; any other
 *   item whose best statements disagree on the year is dropped;
 * - battles merge “point in time” and “start time” (dropped when they differ by more than a year);
 * - labels fall back to the language-neutral (“mul”) label; a parenthetical with digits is
 *   stripped (“Treaty of Paris (1898)”), and items whose label still shows the year are dropped;
 * - descriptions are kept only without digits, centuries or Roman numerals (they would give the
 *   answer away); same-label items need a description to tell them apart;
 * - discoveries leave out astronomy (asteroids, galaxies, moons…) and islands.
 *
 *   npx tsx tools/generate-years.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { YEAR_QUERIES } from './year-queries';

const root = join(import.meta.dirname, '..');
const cache = join(root, '.cache', 'wikidata');
const out = join(root, 'src', 'games', 'year-guess', 'events.json');

/** Question kinds in display order; source query ids map onto them. */
export const KINDS = [
  'battle',
  'war',
  'treaty',
  'discovery',
  'spaceflight',
  'film',
  'book',
  'painting',
  'album',
  'game',
  'opened',
  'company',
  'disaster',
] as const;
const KIND_OF: Record<string, (typeof KINDS)[number]> = {
  'battle-start': 'battle',
  'treaty-signed': 'treaty',
};
const EARLIEST = new Set(['film', 'book', 'album', 'game', 'opened']);
const LAST_YEAR = 2025;

interface Row {
  item: { value: string };
  sl: { value: string };
  time: { value: string };
  prec: { value: string };
  rank: { value: string };
  en?: { value: string };
  es?: { value: string };
  mul?: { value: string };
  den?: { value: string };
  des?: { value: string };
}
interface Item {
  qid: string;
  kind: (typeof KINDS)[number];
  fame: number;
  en: string;
  es: string;
  den: string;
  des: string;
  /** Years by source query id. */
  years: Map<string, number[]>;
}

const yearOf = (t: string) => {
  // "+1066-10-14T00:00:00Z" / "-0051-…". The RDF export follows XSD 1.1, which numbers years
  // astronomically (0000 = 1 BC, −0051 = 52 BC); the game counts historically (−52 = 52 BC).
  const m = /^([+-]?)(\d+)-/.exec(t);
  if (!m) return NaN;
  const astro = (m[1] === '-' ? -1 : 1) * Number(m[2]);
  return astro <= 0 ? astro - 1 : astro;
};
const ASTRO =
  /asteroid|galaxy|cluster|constellation|nebula|moon of|satellite of|natural satellite|trojan|extrasolar|exoplanet|comet|\bstar\b|island|supernova|centaur|kuiper|quasar|pulsar/i;
const PLACE =
  /country|continent|lake|island|archipelago|territory|region|\bsea\b|ocean|river|mountain|\bpole\b|\bstate\b|capital|city|peninsula|\bbay\b|desert|waterfall|strait/i;
const ANCIENT_ELEMENTS = new Set(
  'carbon sulfur copper iron gold silver tin lead mercury antimony arsenic bismuth zinc platinum'.split(
    ' ',
  ),
);
const HINT = /\d|century|centuries|siglo|\b[IVXLC]{2,}\b|\b(?:I|V|X)\b/;
const cleanLabel = (s: string) =>
  s
    .replace(/\s*\([^)]*\d[^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const MONTHS =
  'january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre';
function stripYear(label: string, year: number): string {
  const y = String(Math.abs(year));
  return label
    .replace(new RegExp(`^(?:(?:${MONTHS})\\s+)?${y}\\s+`, 'i'), '')
    .replace(
      new RegExp(`\\s+(?:of|in|de|del|en)\\s+(?:(?:${MONTHS})\\s+(?:de\\s+)?)?${y}$`, 'i'),
      '',
    )
    .replace(new RegExp(`\\s+${y}$`), '')
    .trim();
}
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const items = new Map<string, Item>();
for (const q of YEAR_QUERIES) {
  const file = join(cache, `year-${q.id}.json`);
  if (!existsSync(file)) {
    console.warn('missing', q.id);
    continue;
  }
  const rows = (JSON.parse(readFileSync(file, 'utf8')) as { results: { bindings: Row[] } }).results
    .bindings;
  const kind = KIND_OF[q.id] ?? (q.id as (typeof KINDS)[number]);
  // Best-rank statements per item for this query.
  const byItem = new Map<string, Row[]>();
  for (const r of rows) {
    if (r.rank.value.endsWith('DeprecatedRank')) continue;
    if (Number(r.prec.value) < 9) continue;
    const qid = r.item.value.split('/').pop()!;
    byItem.set(qid, [...(byItem.get(qid) ?? []), r]);
  }
  for (const [qid, rs] of byItem) {
    const preferred = rs.filter((r) => r.rank.value.endsWith('PreferredRank'));
    const best = preferred.length ? preferred : rs;
    const ys = [...new Set(best.map((r) => yearOf(r.time.value)))].filter(Number.isFinite);
    const r = rs[0]!;
    const en = cleanLabel(r.en?.value ?? r.mul?.value ?? '');
    // English before the “mul” label: some mul labels are really one language (Indonesian…).
    const es = cleanLabel(r.es?.value ?? r.en?.value ?? r.mul?.value ?? '');
    let it = items.get(qid);
    if (it && it.kind !== kind) {
      // The same item answered by two kinds (a battle that is also a war…): keep the first.
      continue;
    }
    it ??= {
      qid,
      kind,
      fame: Number(r.sl.value),
      en: cap(en),
      es: cap(es),
      den: r.den?.value ?? '',
      des: r.des?.value ?? '',
      years: new Map(),
    };
    it.years.set(q.id, ys);
    items.set(qid, it);
  }
}

type Out = [
  kind: number,
  year: number,
  en: string,
  es: string,
  den: string,
  des: string,
  qid: string,
  fame: number,
];
const outRows: Out[] = [];
const dropped: Record<string, number> = {};
const drop = (why: string) => (dropped[why] = (dropped[why] ?? 0) + 1);
for (const it of items.values()) {
  let year: number;
  if (it.kind === 'battle') {
    const a = it.years.get('battle') ?? [];
    const b = it.years.get('battle-start') ?? [];
    const all = [...a, ...b];
    if (Math.max(...all) - Math.min(...all) > 1) {
      drop('battle years disagree');
      continue;
    }
    year = a.length === 1 ? a[0]! : Math.min(...all);
  } else {
    const all = [...it.years.values()].flat();
    if (!all.length) continue;
    if (EARLIEST.has(it.kind)) year = Math.min(...all);
    else if (new Set(all).size > 1) {
      drop('years disagree');
      continue;
    } else year = all[0]!;
  }
  if (!Number.isFinite(year) || year > LAST_YEAR || year < -3000 || year === 0) {
    drop('year out of range');
    continue;
  }
  if (!it.en || /^Q\d+$/.test(it.en) || it.en.length < 3) {
    drop('no label');
    continue;
  }
  // Names that carry their own year (“1989 Loma Prieta earthquake”, “Incendio de 2013”) lose it.
  it.en = stripYear(it.en, year);
  it.es = cap(stripYear(it.es, year));
  const y = String(Math.abs(year));
  const shows = (s: string) =>
    new RegExp(`(^|\\D)(${Math.abs(year) - 1}|${y}|${Math.abs(year) + 1})(\\D|$)`).test(s);
  if (shows(it.en) || shows(it.es)) {
    drop('label shows the year');
    continue;
  }
  if (it.kind === 'discovery' && ASTRO.test(it.den)) {
    drop('astronomy');
    continue;
  }
  // Places people already lived in were not “discovered”; elements known since antiquity carry
  // the year they were recognised as elements, which reads wrongly as a discovery.
  if (
    it.kind === 'discovery' &&
    (PLACE.test(it.den) || ANCIENT_ELEMENTS.has(it.en.toLowerCase()))
  ) {
    drop('place or ancient element');
    continue;
  }
  if (it.en.length < 3 || /[/\\]/.test(it.en)) {
    drop('odd label');
    continue;
  }
  const den = HINT.test(it.den) ? '' : cap(it.den);
  const des = HINT.test(it.des) ? '' : cap(it.des);
  outRows.push([KINDS.indexOf(it.kind), year, it.en, it.es, den, des, it.qid, it.fame]);
}

// Same label within a kind: each needs a description, else all of them go.
const groups = new Map<string, Out[]>();
for (const r of outRows)
  groups.set(`${r[0]}|${r[2]}`, [...(groups.get(`${r[0]}|${r[2]}`) ?? []), r]);
const final = outRows.filter((r) => {
  const g = groups.get(`${r[0]}|${r[2]}`)!;
  if (g.length === 1) return true;
  const ok = g.every((x) => x[4]) && new Set(g.map((x) => x[4])).size === g.length;
  if (!ok) drop('ambiguous label');
  return ok;
});
final.sort((a, b) => a[0] - b[0] || b[7] - a[7] || a[6].localeCompare(b[6]));

writeFileSync(out, JSON.stringify({ kinds: KINDS, events: final }));
const per: Record<string, number> = {};
for (const r of final) per[KINDS[r[0]]!] = (per[KINDS[r[0]]!] ?? 0) + 1;
console.log(final.length, 'events', per);
console.log('dropped', dropped);
