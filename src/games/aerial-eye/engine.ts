/**
 * Aerial Eye rules (pure). Each round shows an aerial photograph of a real place — an airport, a
 * racing circuit, a city, a castle, a volcano, an island… — zoomed in on its centre, and six
 * places of the same kind to choose from. A wrong pick zooms the photo out and strikes the
 * option. Three picks: 100, 50 or 20 points. Sessions: a five-photo daily (five different kinds)
 * or an endless run by kind and difficulty. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export type Category =
  | 'airport'
  | 'circuit'
  | 'city'
  | 'ancient'
  | 'stadium'
  | 'castle'
  | 'volcano'
  | 'mountain'
  | 'island'
  | 'lake'
  | 'river';
export const CATEGORIES: Category[] = [
  'airport',
  'circuit',
  'city',
  'ancient',
  'stadium',
  'castle',
  'volcano',
  'mountain',
  'island',
  'lake',
  'river',
];
export type CategoryFilter = 'all' | Category;
export const CATEGORY_FILTERS: CategoryFilter[] = ['all', ...CATEGORIES];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** [Wikidata id, category, English, Spanish, latitude, longitude, country en, country es, sitelinks, Commons file, colours (3 × 3 grid × RGB)]. */
export type PlaceRow = [
  string,
  Category,
  string,
  string,
  number,
  number,
  string,
  string,
  number,
  string,
  number[],
];

export interface Place {
  index: number;
  qid: string;
  category: Category;
  name: { en: string; es: string };
  lat: number;
  lon: number;
  country: { en: string; es: string };
  fame: number;
  file: string;
  colours: number[];
}
export function placeAt(d: readonly PlaceRow[], i: number): Place {
  const r = d[i];
  if (!r) throw new Error(`Unknown place ${i}`);
  const [qid, category, en, es, lat, lon, cen, ces, fame, file, colours] = r;
  return {
    index: i,
    qid,
    category,
    name: { en, es },
    lat,
    lon,
    country: { en: cen, es: ces },
    fame,
    file,
    colours,
  };
}

export const OPTIONS = 6;
export const PICKS = 3;
export const POINTS = [100, 50, 20];
/** Photo magnification after 0, 1, 2 wrong picks (and 1 once the round is over). */
export const ZOOM = [2.2, 1.5, 1];
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;

/* ---------- pools ---------- */

/** Easy: the better-known half of each kind; Normal: three quarters; Hard: all. */
const CUT: Record<Difficulty, number> = { easy: 0.5, normal: 0.75, hard: 1 };
const poolCache = new WeakMap<readonly PlaceRow[], Map<string, number[]>>();
export function pool(d: readonly PlaceRow[], diff: Difficulty, cat: Category): number[] {
  let c = poolCache.get(d);
  if (!c) poolCache.set(d, (c = new Map()));
  const key = `${diff}:${cat}`;
  const hit = c.get(key);
  if (hit) return hit;
  const all = d
    .map((_, i) => i)
    .filter((i) => d[i]![1] === cat)
    .sort((a, b) => d[b]![8] - d[a]![8] || a - b);
  const out = all
    .slice(0, Math.max(OPTIONS, Math.ceil(all.length * CUT[diff])))
    .sort((a, b) => a - b);
  c.set(key, out);
  return out;
}

/* ---------- rounds ---------- */

export interface Round {
  target: number;
  /** The six options in display order (place indices). */
  options: number[];
  picks: number[];
  status: 'playing' | 'won' | 'lost';
  score: number | null;
}
export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  category: CategoryFilter;
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
const dailySeed = (day: number) => (Math.imul(day + 131, 2246822519) ^ 0x4e7e_a1e7) >>> 0;

function addRound(s: Session, d: readonly PlaceRow[], avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  const usedCats = new Set(s.rounds.map((r) => d[r.target]![1]));
  let cats: Category[] = s.category === 'all' ? [...CATEGORIES] : [s.category];
  if (s.category === 'all') {
    const fresh = cats.filter((c) => !usedCats.has(c));
    if (fresh.length) cats = fresh;
    const last = s.rounds.length ? d[s.rounds[s.rounds.length - 1]!.target]![1] : null;
    if (cats.length > 1 && last) cats = cats.filter((c) => c !== last);
  }
  const cat = rng.pick(cats);
  const ids = pool(d, s.difficulty, cat);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.rounds.map((r) => r.target)]);
  const fresh = ids.filter((i) => !used.has(i));
  const target = rng.pick(fresh.length ? fresh : ids);
  const others = rng.shuffle(ids.filter((i) => i !== target)).slice(0, OPTIONS - 1);
  const options = rng.shuffle([target, ...others]);
  const rounds = [
    ...s.rounds,
    { target, options, picks: [], status: 'playing' as const, score: null },
  ];
  return { ...s, rng: rng.state, rounds: s.mode === 'daily' ? rounds : rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  diff: Difficulty,
  category: CategoryFilter,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: diff,
    category,
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}
export const newDaily = (d: readonly PlaceRow[], day: number) =>
  addRound(base('daily', day, 'normal', 'all', DAILY_ROUNDS, dailySeed(day)), d, new Set());
export const newEndless = (
  d: readonly PlaceRow[],
  seed: number,
  diff: Difficulty,
  category: CategoryFilter,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, diff, category, limit, seed), d, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).status === 'playing';
/** Magnification for the current state of a round. */
export const zoomOf = (r: Round) =>
  r.status === 'playing' ? ZOOM[Math.min(r.picks.length, ZOOM.length - 1)]! : 1;

export function pick(s: Session, place: number): Session {
  if (!awaiting(s)) throw new Error('No photo is waiting for a pick');
  const r = current(s);
  if (!r.options.includes(place)) throw new Error('Not an option');
  if (r.picks.includes(place)) throw new Error('Already picked');
  const picks = [...r.picks, place];
  let nr: Round;
  if (place === r.target) nr = { ...r, picks, status: 'won', score: POINTS[picks.length - 1]! };
  else if (picks.length >= PICKS) nr = { ...r, picks, status: 'lost', score: 0 };
  else nr = { ...r, picks };
  const rounds = [...s.rounds.slice(0, -1), nr];
  if (nr.status === 'playing') return { ...s, rounds };
  const count = s.count + 1;
  return {
    ...s,
    rounds,
    count,
    total: s.total + nr.score!,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

export function next(
  s: Session,
  d: readonly PlaceRow[],
  avoid: ReadonlySet<number> = new Set(),
): Session {
  if (s.status !== 'playing' || current(s).status === 'playing')
    throw new Error('Nothing to advance');
  return addRound(s, d, avoid);
}
export function finish(s: Session): Session {
  const rounds = current(s).status === 'playing' ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const row = (r: Round) =>
    r.status === 'won' ? '🟥'.repeat(r.picks.length - 1) + '🟩' : '🟥'.repeat(PICKS);
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds
    .filter((r) => r.status !== 'playing')
    .map(row)
    .join('\n')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, d?: readonly PlaceRow[]): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const ok = (i: unknown) => isNum(i) && Number.isInteger(i) && i >= 0 && (!d || i < d.length);
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    CATEGORY_FILTERS.includes(s.category) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        ok(r.target) &&
        Array.isArray(r.options) &&
        r.options.length === OPTIONS &&
        r.options.every(ok) &&
        r.options.includes(r.target) &&
        Array.isArray(r.picks) &&
        r.picks.length <= PICKS &&
        r.picks.every((p) => r.options.includes(p)) &&
        (r.status === 'playing'
          ? r.score === null
          : (r.status === 'won' || r.status === 'lost') && isNum(r.score)),
    )
  );
}
