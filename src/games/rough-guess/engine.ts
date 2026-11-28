/**
 * Rough Guess rules (pure). Every question asks for a real quantity — a commodity's price in a
 * given year, the distance between two cities, a property of a chemical element, a population,
 * an area, a length… — and the player answers with a range: “roughly between X and Y”. A range
 * that contains the truth scores more the narrower it is; a miss scores nothing. Sessions: a
 * ten-question daily challenge or an endless run. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import type { Kind as MagKind, MagnitudeData } from '../order-of-magnitude/engine';

export interface RoughData {
  source: string;
  pinkSheetUpdated: string;
  /** [key, English, Spanish, unit key, fame]. */
  commodities: [string, string, string, string, number][];
  /** [commodity index, year, annual average price in nominal US$]. */
  prices: [number, number, number][];
  /** [Wikidata id, English, Spanish, atomic number, melting K, boiling K, density g/cm³, mass Da] (0 = none). */
  elements: [string, string, string, number, number, number, number, number][];
  /** [Wikidata id, English, Spanish, latitude, longitude, country id, sitelinks]. */
  cities: [string, string, string, number, number, string, number][];
}

export interface Bank {
  rough: RoughData;
  mag: MagnitudeData;
}

export type Kind =
  'price' | 'distance' | 'melting' | 'boiling' | 'density' | 'atomic-mass' | MagKind;

export type Topic = 'all' | 'prices' | 'distances' | 'science' | 'world';
export const TOPICS: Topic[] = ['all', 'prices', 'distances', 'science', 'world'];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** Quantities borrowed from the Order of Magnitude bank. */
const MAG_KINDS: MagKind[] = [
  'city-pop',
  'country-pop',
  'gdp',
  'river-length',
  'mountain-elev',
  'country-area',
  'island-area',
  'lake-area',
  'building-height',
  'body-diameter',
];

export const DAILY_ROUNDS = 10;
const KEEP_ROUNDS = 12;
/** Narrowest allowed range (hi/lo). */
export const MIN_RATIO = 1.01;

/* ---------- questions ---------- */

/**
 * A question key: `p:<commodity>:<year>`, `d:<city>:<city>` (indices, smaller first),
 * `e:<element>:<melting|boiling|density|atomic-mass>` or `m:<index in the magnitude bank>`.
 */
export type QKey = string;

export interface Question {
  key: QKey;
  kind: Kind;
  value: number;
  /** Subject text (one or two names) and the year, when it matters. */
  subject: { en: string; es: string };
  year: number;
  /** Price unit (bbl, mt, kg, troy-oz, mmbtu) for prices. */
  unit?: string;
  fame: number;
  source: 'pink' | 'wikidata' | 'worldbank' | 'computed';
  /** Source id (Wikidata item(s)) for the link. */
  ref: string;
}

const R_EARTH = 6371.0088;
export function greatCircleKm(a: [number, number], b: [number, number]): number {
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r;
  const dLon = (b[1] - a[1]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
}

const ELEMENT_PROPS = ['melting', 'boiling', 'density', 'atomic-mass'] as const;
const ELEMENT_COL: Record<(typeof ELEMENT_PROPS)[number], number> = {
  melting: 4,
  boiling: 5,
  density: 6,
  'atomic-mass': 7,
};

export function question(bank: Bank, key: QKey): Question {
  const [t, a, b] = key.split(':');
  const { rough, mag } = bank;
  if (t === 'p') {
    const ci = Number(a);
    const c = rough.commodities[ci];
    const row = rough.prices.find((p) => p[0] === ci && p[1] === Number(b));
    if (!c || !row) throw new Error(`Unknown question ${key}`);
    return {
      key,
      kind: 'price',
      value: row[2],
      subject: { en: c[1], es: c[2] },
      year: row[1],
      unit: c[3],
      fame: c[4],
      source: 'pink',
      ref: c[0],
    };
  }
  if (t === 'd') {
    const x = rough.cities[Number(a)];
    const y = rough.cities[Number(b)];
    if (!x || !y || Number(a) >= Number(b)) throw new Error(`Unknown question ${key}`);
    return {
      key,
      kind: 'distance',
      value: Math.round(greatCircleKm([x[3], x[4]], [y[3], y[4]])),
      subject: { en: `${x[1]} — ${y[1]}`, es: `${x[2]} — ${y[2]}` },
      year: 0,
      fame: Math.min(x[6], y[6]),
      source: 'computed',
      ref: `${x[0]},${y[0]}`,
    };
  }
  if (t === 'e') {
    const e = rough.elements[Number(a)];
    const prop = b as (typeof ELEMENT_PROPS)[number];
    const v = e?.[ELEMENT_COL[prop]] as number | undefined;
    if (!e || !ELEMENT_PROPS.includes(prop) || !v) throw new Error(`Unknown question ${key}`);
    return {
      key,
      kind: prop,
      value: v,
      subject: { en: e[1], es: e[2] },
      year: 0,
      // The first 30 elements and the familiar metals are the well-known ones.
      fame: e[3] <= 30 || [47, 50, 74, 78, 79, 80, 82, 92].includes(e[3]) ? 80 : 20,
      source: 'wikidata',
      ref: e[0],
    };
  }
  if (t === 'm') {
    const q = mag.questions[Number(a)];
    if (!q || !MAG_KINDS.includes(q[1])) throw new Error(`Unknown question ${key}`);
    return {
      key,
      kind: q[1],
      value: q[2],
      subject: { en: q[3], es: q[4] },
      year: q[6],
      fame: q[5],
      source: q[0].startsWith('WB:') ? 'worldbank' : 'wikidata',
      ref: q[0].startsWith('WB:') ? q[0].split(':')[1]! : q[0].split(':')[0]!,
    };
  }
  throw new Error(`Unknown question ${key}`);
}

export const topicOf = (k: Kind): Exclude<Topic, 'all'> =>
  k === 'price'
    ? 'prices'
    : k === 'distance'
      ? 'distances'
      : k === 'melting' ||
          k === 'boiling' ||
          k === 'density' ||
          k === 'atomic-mass' ||
          k === 'body-diameter'
        ? 'science'
        : 'world';

/** Fame thresholds per difficulty. Cities use Wikipedia sitelinks (≥ 120 in the data). */
const FAME: Record<Difficulty, { item: number; city: number }> = {
  easy: { item: 60, city: 220 },
  normal: { item: 30, city: 170 },
  hard: { item: 0, city: 0 },
};

/** Every non-distance question key available at a difficulty (distances are drawn as pairs). */
const listCache = new WeakMap<Bank, Map<Difficulty, QKey[]>>();
export function listKeys(bank: Bank, d: Difficulty): QKey[] {
  let c = listCache.get(bank);
  if (!c) listCache.set(bank, (c = new Map()));
  const hit = c.get(d);
  if (hit) return hit;
  const min = FAME[d].item;
  const out: QKey[] = [];
  bank.rough.prices.forEach(([ci, year]) => {
    if (bank.rough.commodities[ci]![4] >= min) out.push(`p:${ci}:${year}`);
  });
  bank.rough.elements.forEach((e, i) => {
    for (const p of ELEMENT_PROPS) if (e[ELEMENT_COL[p]]) out.push(`e:${i}:${p}`);
  });
  bank.mag.questions.forEach((q, i) => {
    if (MAG_KINDS.includes(q[1]) && q[5] >= min) out.push(`m:${i}`);
  });
  const keep = out.filter((k) => question(bank, k).fame >= min);
  c.set(d, keep);
  return keep;
}

export function citiesFor(bank: Bank, d: Difficulty): number[] {
  const min = FAME[d].city;
  const out: number[] = [];
  bank.rough.cities.forEach((c, i) => {
    if (c[6] >= min) out.push(i);
  });
  return out;
}

const kindOfKey = (bank: Bank, k: QKey): Kind => question(bank, k).kind;

/** Picks a question: kind first (prices, distances, elements and world facts all get turns). */
export function pickQuestion(
  bank: Bank,
  rng: Rng,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<QKey> = new Set(),
  avoidKind: Kind | null = null,
): QKey {
  const kindsByTopic = new Map<Kind, QKey[]>();
  for (const k of listKeys(bank, d)) {
    const kind = kindOfKey(bank, k);
    if (topic !== 'all' && topicOf(kind) !== topic) continue;
    const l = kindsByTopic.get(kind);
    if (l) l.push(k);
    else kindsByTopic.set(kind, [k]);
  }
  const cityIds = citiesFor(bank, d);
  const kinds: Kind[] = [...kindsByTopic.keys()];
  if (topic === 'all' || topic === 'distances') kinds.push('distance');
  let choices = kinds.length > 1 && avoidKind ? kinds.filter((k) => k !== avoidKind) : kinds;
  if (!choices.length) choices = kinds;
  for (let attempt = 0; ; attempt++) {
    const kind = rng.pick(choices);
    let key: QKey;
    if (kind === 'distance') {
      const a = rng.pick(cityIds);
      const b = rng.pick(cityIds);
      if (a === b) continue;
      // Different countries make better questions (and avoid near-zero distances).
      if (bank.rough.cities[a]![5] === bank.rough.cities[b]![5] && attempt < 20) continue;
      key = `d:${Math.min(a, b)}:${Math.max(a, b)}`;
    } else key = rng.pick(kindsByTopic.get(kind)!);
    if (!avoid.has(key) || attempt > 40) return key;
  }
}

/* ---------- ranges and scoring ---------- */

/** The slider domain (log10 [lo, hi]) for a kind: its values' extent, padded ×5 each way. */
const domainCache = new WeakMap<Bank, Map<string, [number, number]>>();
export function domain(bank: Bank, q: Question): [number, number] {
  let c = domainCache.get(bank);
  if (!c) domainCache.set(bank, (c = new Map()));
  const id = q.kind === 'price' ? `price:${q.ref}` : q.kind;
  const hit = c.get(id);
  if (hit) return hit;
  let values: number[];
  if (q.kind === 'price') {
    const ci = bank.rough.commodities.findIndex((x) => x[0] === q.ref);
    values = bank.rough.prices.filter((p) => p[0] === ci).map((p) => p[2]);
  } else if (q.kind === 'distance') values = [10, 20_016];
  else if (q.kind in ELEMENT_COL)
    values = bank.rough.elements
      .map((e) => e[ELEMENT_COL[q.kind as 'melting']] as number)
      .filter((v) => v > 0);
  else values = bank.mag.questions.filter((m) => m[1] === q.kind).map((m) => m[2]);
  const lo = Math.log10(Math.min(...values)) - Math.log10(5);
  const hi = Math.log10(Math.max(...values)) + Math.log10(5);
  const d: [number, number] = [Math.floor(lo * 10) / 10, Math.ceil(hi * 10) / 10];
  c.set(id, d);
  return d;
}

/** Range width in orders of magnitude. */
export const width = (lo: number, hi: number) => Math.log10(hi / lo);

/**
 * Score: a range containing the answer earns 100 × (1 − width / 2), at least 10 (width ×2 → 85,
 * ×10 → 50, ×100 or wider → 10); a range that misses earns 0.
 */
export function scoreRange(lo: number, hi: number, value: number): number {
  if (!(value >= lo && value <= hi)) return 0;
  return Math.max(10, Math.round(100 * (1 - width(lo, hi) / 2)));
}

/* ---------- sessions ---------- */

export interface Round {
  key: QKey;
  range: [number, number] | null;
  score: number | null;
}

export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  topic: Topic;
  limit: number;
  rng: RngState;
  rounds: Round[];
  count: number;
  total: number;
  hits: number;
  status: 'playing' | 'done';
}

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 29, 2654435769) ^ 0x2b0c_9a11) >>> 0;

function addRound(s: Session, bank: Bank, avoid: ReadonlySet<QKey>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.rounds.map((r) => r.key)]);
  const last = s.rounds.length ? question(bank, s.rounds[s.rounds.length - 1]!.key).kind : null;
  const key = pickQuestion(bank, rng, s.difficulty, s.topic, used, last);
  const rounds = [...s.rounds, { key, range: null, score: null }];
  return { ...s, rng: rng.state, rounds: rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  difficulty: Difficulty,
  topic: Topic,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty,
    topic,
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    hits: 0,
    status: 'playing',
  };
}

export const newDaily = (bank: Bank, day: number) =>
  addRound(base('daily', day, 'normal', 'all', DAILY_ROUNDS, dailySeed(day)), bank, new Set());

export const newEndless = (
  bank: Bank,
  seed: number,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<QKey> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, d, topic, limit, seed), bank, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).range === null;

/** Locks a range in. It must lie inside the question's domain and be at least ×1.01 wide. */
export function answer(s: Session, bank: Bank, lo: number, hi: number): Session {
  if (!awaiting(s)) throw new Error('No question is waiting for an answer');
  const q = question(bank, current(s).key);
  const [dLo, dHi] = domain(bank, q);
  if (!(lo > 0 && hi > 0) || !Number.isFinite(lo) || !Number.isFinite(hi))
    throw new Error('A range needs two positive numbers');
  if (hi / lo < MIN_RATIO * 0.9999) throw new Error('The range is too narrow');
  if (Math.log10(lo) < dLo - 1e-9 || Math.log10(hi) > dHi + 1e-9)
    throw new Error('The range leaves the scale');
  const score = scoreRange(lo, hi, q.value);
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...current(s), range: [lo, hi], score }],
    count,
    total: s.total + score,
    hits: s.hits + (score > 0 ? 1 : 0),
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

export function next(s: Session, bank: Bank, avoid: ReadonlySet<QKey> = new Set()): Session {
  if (s.status !== 'playing' || current(s).range === null) throw new Error('Nothing to advance');
  return addRound(s, bank, avoid);
}

export function finish(s: Session): Session {
  const rounds = current(s).range === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n === 0 ? '⬛' : n >= 80 ? '🟩' : n >= 50 ? '🟨' : '🟧');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head} · ${s.hits}/${s.count}\n${s.rounds.map((r) => sq(r.score ?? 0)).join('')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, bank?: Bank): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const okKey = (k: unknown) => {
    if (typeof k !== 'string' || !/^(p:\d+:\d{4}|d:\d+:\d+|e:\d+:[a-z-]+|m:\d+)$/.test(k))
      return false;
    if (!bank) return true;
    try {
      question(bank, k);
      return true;
    } catch {
      return false;
    }
  };
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    [s.day, s.limit, s.count, s.total, s.hits].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        okKey(r.key) &&
        (r.range === null
          ? r.score === null
          : Array.isArray(r.range) &&
            r.range.length === 2 &&
            r.range.every((x) => isNum(x) && x > 0) &&
            r.range[0] <= r.range[1] &&
            isNum(r.score)),
    )
  );
}
