/**
 * Price Check rules (pure). Each round shows a real product, artwork or collectible with its
 * year and description; the player guesses what it cost then (in the currency of the record).
 * Two rules: Closest (score by how near the guess is, either side) and Don't go over (any guess
 * above the price scores nothing). Sessions: a six-item daily challenge or an endless run.
 * See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export type Category =
  'games' | 'consoles' | 'tech' | 'gadgets' | 'art' | 'vehicles' | 'software' | 'books';
export const CATEGORIES: Category[] = [
  'games',
  'consoles',
  'tech',
  'gadgets',
  'art',
  'vehicles',
  'software',
  'books',
];
export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'SEK'
  | 'INR'
  | 'CNY'
  | 'KRW'
  | 'RUB'
  | 'PLN'
  | 'CZK';

export interface PriceData {
  source: string;
  /** Price levels relative to the last year, for “in today's money”. */
  cpi: Partial<Record<Currency, { area: string; start: number; level: number[] }>>;
  /** [Wikidata id, category, currency, price, year, English, Spanish, description en, description es, Commons file, sitelinks]. */
  items: [
    string,
    Category,
    Currency,
    number,
    number,
    string,
    string,
    string,
    string,
    string,
    number,
  ][];
}

export interface Item {
  index: number;
  id: string;
  category: Category;
  currency: Currency;
  price: number;
  year: number;
  name: { en: string; es: string };
  description: { en: string; es: string };
  image: string;
  fame: number;
}

export function itemAt(d: PriceData, i: number): Item {
  const [id, category, currency, price, year, en, es, den, des, image, fame] = d.items[i]!;
  return {
    index: i,
    id,
    category,
    currency,
    price,
    year,
    name: { en, es },
    description: { en: den, es: des || den },
    image,
    fame,
  };
}

/** The price in today's money (the last year with inflation data), or null when out of range. */
export function inToday(d: PriceData, it: Item): { value: number; year: number } | null {
  const c = d.cpi[it.currency];
  if (!c) return null;
  const k = it.year - c.start;
  const lvl = c.level[k];
  if (!lvl) return null;
  return { value: it.price / lvl, year: c.start + c.level.length - 1 };
}

export type Rule = 'closest' | 'under';
export const RULES: Rule[] = ['closest', 'under'];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
export type Topic = 'all' | Category;
export const TOPICS: Topic[] = ['all', ...CATEGORIES];
export const DAILY_ROUNDS = 6;
const KEEP_ROUNDS = 12;

/** Easy: pictured items from 1990 on with ≥ 10 sitelinks; Normal: pictured or ≥ 5; Hard: all. */
export function eligible(it: Item, d: Difficulty): boolean {
  if (d === 'easy') return it.image !== '' && it.year >= 1990 && it.fame >= 10;
  if (d === 'normal') return it.image !== '' || it.fame >= 5;
  return true;
}

const poolCache = new WeakMap<PriceData, Map<string, number[]>>();
export function pool(d: PriceData, diff: Difficulty, topic: Topic): number[] {
  let c = poolCache.get(d);
  if (!c) poolCache.set(d, (c = new Map()));
  const key = `${diff}:${topic}`;
  const hit = c.get(key);
  if (hit) return hit;
  const out: number[] = [];
  d.items.forEach((_, i) => {
    const it = itemAt(d, i);
    if (eligible(it, diff) && (topic === 'all' || it.category === topic)) out.push(i);
  });
  c.set(key, out);
  return out;
}

/** The guess scale (log10) for an item: its category and currency's price extent, ×/÷ 10. */
const scaleCache = new WeakMap<PriceData, Map<string, [number, number]>>();
export function scale(d: PriceData, it: Item): [number, number] {
  let c = scaleCache.get(d);
  if (!c) scaleCache.set(d, (c = new Map()));
  const key = `${it.category}:${it.currency}`;
  const hit = c.get(key);
  if (hit) return hit;
  const prices = d.items
    .filter((x) => x[1] === it.category && x[2] === it.currency)
    .map((x) => Math.log10(x[3]));
  const s: [number, number] = [
    Math.floor(Math.min(...prices) - 1),
    Math.ceil(Math.max(...prices) + 1),
  ];
  c.set(key, s);
  return s;
}

/**
 * Score: 100 × e^(−1.5 × |ln(guess / price)|) — 10 % off → 87, 25 % → 72, 50 % → 54, double or
 * half → 35; within 2 % counts as exact (100). Under “don't go over”, a guess above the price
 * (by more than 0.5 %) scores 0.
 */
export function scoreGuess(guess: number, price: number, rule: Rule): number {
  if (!(guess > 0)) return 0;
  if (rule === 'under' && guess > price * 1.005) return 0;
  const r = Math.abs(Math.log(guess / price));
  if (r <= Math.log(1.02)) return 100;
  return Math.round(100 * Math.exp(-1.5 * r));
}

/* ---------- sessions ---------- */

export interface Round {
  item: number;
  guess: number | null;
  score: number | null;
}
export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  topic: Topic;
  rule: Rule;
  limit: number;
  rng: RngState;
  rounds: Round[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 61, 2246822519) ^ 0x5e11_ca7e) >>> 0;

function addRound(s: Session, d: PriceData, avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.rounds.map((r) => r.item)]);
  let ids = pool(d, s.difficulty, s.topic);
  if (!ids.length) ids = pool(d, 'hard', s.topic);
  const fresh = ids.filter((i) => !used.has(i));
  if (fresh.length) ids = fresh;
  // Category first (books would otherwise crowd the rest out), then the item.
  const byCat = new Map<Category, number[]>();
  for (const i of ids) {
    const c = d.items[i]![1];
    byCat.set(c, [...(byCat.get(c) ?? []), i]);
  }
  const last = s.rounds.length ? d.items[s.rounds[s.rounds.length - 1]!.item]![1] : null;
  let cats = [...byCat.keys()];
  if (cats.length > 1 && last) cats = cats.filter((c) => c !== last);
  const item = rng.pick(byCat.get(rng.pick(cats))!);
  const rounds = [...s.rounds, { item, guess: null, score: null }];
  return { ...s, rng: rng.state, rounds: rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  diff: Difficulty,
  topic: Topic,
  rule: Rule,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: diff,
    topic,
    rule,
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}

export const newDaily = (d: PriceData, day: number) =>
  addRound(
    base('daily', day, 'normal', 'all', 'closest', DAILY_ROUNDS, dailySeed(day)),
    d,
    new Set(),
  );
export const newEndless = (
  d: PriceData,
  seed: number,
  diff: Difficulty,
  topic: Topic,
  rule: Rule,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, diff, topic, rule, limit, seed), d, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).guess === null;

export function guess(s: Session, d: PriceData, value: number): Session {
  if (!awaiting(s)) throw new Error('No item is waiting for a guess');
  const it = itemAt(d, current(s).item);
  const [lo, hi] = scale(d, it);
  if (
    !(value > 0) ||
    !Number.isFinite(value) ||
    Math.log10(value) < lo - 1e-9 ||
    Math.log10(value) > hi + 1e-9
  )
    throw new Error('The guess is off the scale');
  const score = scoreGuess(value, it.price, s.rule);
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...current(s), guess: value, score }],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

export function next(s: Session, d: PriceData, avoid: ReadonlySet<number> = new Set()): Session {
  if (s.status !== 'playing' || current(s).guess === null) throw new Error('Nothing to advance');
  return addRound(s, d, avoid);
}

export function finish(s: Session): Session {
  const rounds = current(s).guess === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) =>
    n >= 90 ? '🟩' : n >= 65 ? '🟨' : n >= 35 ? '🟧' : n > 0 ? '🟥' : '⬛';
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => sq(r.score ?? 0)).join('')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, d?: PriceData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    RULES.includes(s.rule) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        isNum(r.item) &&
        r.item >= 0 &&
        (!d || r.item < d.items.length) &&
        (r.guess === null ? r.score === null : isNum(r.guess) && r.guess > 0 && isNum(r.score)),
    )
  );
}
