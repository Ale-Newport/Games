/**
 * One-Star Landmarks rules (pure). A round shows the first line of a grumpy one-star review of a
 * famous place; the player names the place from the list. Each miss shows how far the guess is
 * from the answer and in which direction, and reveals the next line of the review (three lines
 * in all). Five guesses: 100 points first time, then 75, 50, 30, 15; none after five misses.
 * Sessions: a five-place daily or an endless run by region and difficulty. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { greatCircleKm } from '../rough-guess/engine';
import { REVIEWS, type Review } from './reviews';

export type Region = 'europe' | 'americas' | 'asia' | 'africa-oceania';
export const REGIONS: Region[] = ['europe', 'americas', 'asia', 'africa-oceania'];
export type RegionFilter = 'all' | Region;
export const REGION_FILTERS: RegionFilter[] = ['all', ...REGIONS];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** [Wikidata id, English name, Spanish name, latitude, longitude, region, sitelinks, English description]. */
export type PlaceRow = [string, string, string, number, number, Region, number, string];

export interface Place {
  index: number;
  qid: string;
  name: { en: string; es: string };
  lat: number;
  lon: number;
  region: Region;
  fame: number;
  about: string;
  review: Review;
}

export function placeAt(d: readonly PlaceRow[], i: number): Place {
  const r = d[i];
  if (!r) throw new Error(`Unknown place ${i}`);
  const [qid, en, es, lat, lon, region, fame, about] = r;
  const review = REVIEWS[qid];
  if (!review) throw new Error(`No review for ${qid}`);
  return { index: i, qid, name: { en, es }, lat, lon, region, fame, about, review };
}

/* ---------- distance and direction ---------- */

export const distanceKm = (a: Place, b: Place) => greatCircleKm([a.lat, a.lon], [b.lat, b.lon]);

/** Initial great-circle bearing from a to b, degrees clockwise from north. */
export function bearing(a: Place, b: Place): number {
  const r = Math.PI / 180;
  const φ1 = a.lat * r;
  const φ2 = b.lat * r;
  const Δλ = (b.lon - a.lon) * r;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (((Math.atan2(y, x) / r) % 360) + 360) % 360;
}
export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Compass = (typeof COMPASS)[number];
export const compassOf = (deg: number): Compass => COMPASS[Math.round(deg / 45) % 8]!;
/** Closeness 0–100: 100 on the spot, 0 at the antipode (20,015 km). */
export const closeness = (km: number) => Math.max(0, Math.round(100 * (1 - km / 20_015)));

export interface Hint {
  guess: number;
  km: number;
  compass: Compass;
  closeness: number;
}
export function hintFor(d: readonly PlaceRow[], guessIndex: number, target: number): Hint {
  const g = placeAt(d, guessIndex);
  const t = placeAt(d, target);
  const km = Math.round(distanceKm(g, t));
  return { guess: guessIndex, km, compass: compassOf(bearing(g, t)), closeness: closeness(km) };
}

/* ---------- scoring ---------- */

export const MAX_GUESSES = 5;
export const LINES = 3;
/** Points for finding the place on guess 1, 2, … 5. */
export const POINTS = [100, 75, 50, 30, 15];
/** Review lines shown after `misses` wrong guesses. */
export const linesShown = (misses: number) => Math.min(LINES, 1 + misses);

/* ---------- pools ---------- */

/** Fame rank within the whole list: Easy = the most-linked 40 %, Normal = 75 %, Hard = all. */
const CUT: Record<Difficulty, number> = { easy: 0.4, normal: 0.75, hard: 1 };
const poolCache = new WeakMap<readonly PlaceRow[], Map<string, number[]>>();
export function pool(d: readonly PlaceRow[], diff: Difficulty, region: RegionFilter): number[] {
  let c = poolCache.get(d);
  if (!c) poolCache.set(d, (c = new Map()));
  const key = `${diff}:${region}`;
  const hit = c.get(key);
  if (hit) return hit;
  const byFame = d.map((_, i) => i).sort((a, b) => d[b]![6] - d[a]![6] || a - b);
  const keep = new Set(byFame.slice(0, Math.ceil(byFame.length * CUT[diff])));
  const out = d
    .map((_, i) => i)
    .filter((i) => keep.has(i) && (region === 'all' || d[i]![5] === region));
  c.set(key, out);
  return out;
}

/* ---------- sessions ---------- */

export interface Round {
  target: number;
  guesses: number[];
  status: 'playing' | 'won' | 'lost';
  score: number | null;
}
export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  region: RegionFilter;
  limit: number;
  rng: RngState;
  rounds: Round[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 97, 2246822507) ^ 0x1a2b_57a2) >>> 0;

function addRound(s: Session, d: readonly PlaceRow[], avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  const used = new Set([...avoid, ...s.rounds.map((r) => r.target)]);
  let ids = pool(d, s.difficulty, s.region);
  if (!ids.length) ids = pool(d, 'hard', s.region);
  const fresh = ids.filter((i) => !used.has(i));
  if (fresh.length) ids = fresh;
  else ids = ids.filter((i) => !s.rounds.slice(-3).some((r) => r.target === i));
  // The daily spreads its places over the regions (never two in a row from one region).
  if (s.mode === 'daily' && s.rounds.length) {
    const last = d[s.rounds[s.rounds.length - 1]!.target]![5];
    const other = ids.filter((i) => d[i]![5] !== last);
    if (other.length) ids = other;
  }
  const target = rng.pick(ids);
  const rounds = [...s.rounds, { target, guesses: [], status: 'playing' as const, score: null }];
  return { ...s, rng: rng.state, rounds: s.mode === 'daily' ? rounds : rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  diff: Difficulty,
  region: RegionFilter,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: diff,
    region,
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
  region: RegionFilter,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, diff, region, limit, seed), d, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).status === 'playing';

export function guess(s: Session, d: readonly PlaceRow[], place: number): Session {
  if (!awaiting(s)) throw new Error('No place is waiting for a guess');
  const r = current(s);
  if (!Number.isInteger(place) || place < 0 || place >= d.length) throw new Error('Unknown place');
  if (r.guesses.includes(place)) throw new Error('Already guessed');
  const guesses = [...r.guesses, place];
  let nr: Round;
  if (place === r.target) nr = { ...r, guesses, status: 'won', score: POINTS[guesses.length - 1]! };
  else if (guesses.length >= MAX_GUESSES) nr = { ...r, guesses, status: 'lost', score: 0 };
  else nr = { ...r, guesses };
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

/** Give up on the current place (scores 0). */
export function giveUp(s: Session): Session {
  if (!awaiting(s)) throw new Error('Nothing to give up');
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...current(s), status: 'lost', score: 0 }],
    count,
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
    r.status === 'won'
      ? '🟥'.repeat(r.guesses.length - 1) + '🟩'
      : r.status === 'lost'
        ? '🟥'.repeat(Math.max(1, r.guesses.length)) + '⬛'
        : '';
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map(row).join('\n')}`;
}

/* ---------- name search ---------- */

export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Places whose English or Spanish name contains every typed word (accents ignored), best first. */
export function search(
  d: readonly PlaceRow[],
  text: string,
  exclude: ReadonlySet<number> = new Set(),
  limit = 8,
): number[] {
  const words = fold(text).split(' ').filter(Boolean);
  if (!words.length) return [];
  const scored: [number, number][] = [];
  d.forEach((r, i) => {
    if (exclude.has(i)) return;
    const names = [fold(r[1]), fold(r[2])];
    if (!words.every((w) => names.some((n) => n.includes(w)))) return;
    // Names that start with the text come first, then shorter names.
    const starts = names.some((n) => n.startsWith(words.join(' '))) ? 0 : 1;
    scored.push([i, starts * 1000 + Math.min(...names.map((n) => n.length))]);
  });
  return scored
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([i]) => i);
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, d?: readonly PlaceRow[]): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const okPlace = (i: unknown) => isNum(i) && Number.isInteger(i) && i >= 0 && (!d || i < d.length);
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    REGION_FILTERS.includes(s.region) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        okPlace(r.target) &&
        Array.isArray(r.guesses) &&
        r.guesses.length <= MAX_GUESSES &&
        r.guesses.every(okPlace) &&
        (r.status === 'playing'
          ? r.score === null
          : (r.status === 'won' || r.status === 'lost') && isNum(r.score)),
    )
  );
}
