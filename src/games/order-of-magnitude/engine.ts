/**
 * Order of Magnitude rules (pure). Each question asks for a real quantity; the player answers in
 * scientific notation (a leading figure 1.0–9.9 times a power of ten) and gets up to three
 * guesses. After each one the feedback says whether the answer is higher or lower and how far
 * off the guess is, in orders of magnitude. The player may lock a guess in at any time; the
 * score depends on how close the locked guess is (on a log scale) and on how many guesses it
 * took. Sessions: a five-question daily challenge or an endless run. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export interface MagnitudeData {
  source: string;
  /** [id, kind, value, English subject, Spanish subject, fame, year (0 = timeless)]. */
  questions: [string, Kind, number, string, string, number, number][];
}

export type Kind =
  | 'city-pop'
  | 'country-pop'
  | 'gdp'
  | 'air-passengers'
  | 'tourists'
  | 'river-length'
  | 'mountain-elev'
  | 'lake-area'
  | 'island-area'
  | 'country-area'
  | 'building-height'
  | 'bridge-length'
  | 'ship-length'
  | 'body-diameter'
  | 'star-diameter';

export type Topic = 'all' | 'people' | 'economy' | 'geography' | 'engineering' | 'space';
export const TOPICS: Topic[] = ['all', 'people', 'economy', 'geography', 'engineering', 'space'];
export const TOPIC_OF: Record<Kind, Exclude<Topic, 'all'>> = {
  'city-pop': 'people',
  'country-pop': 'people',
  gdp: 'economy',
  'air-passengers': 'economy',
  tourists: 'economy',
  'river-length': 'geography',
  'mountain-elev': 'geography',
  'lake-area': 'geography',
  'island-area': 'geography',
  'country-area': 'geography',
  'building-height': 'engineering',
  'bridge-length': 'engineering',
  'ship-length': 'engineering',
  'body-diameter': 'space',
  'star-diameter': 'space',
};

export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
/** Minimum fame (Wikipedia sitelinks, or the population tier for World Bank figures). */
export const MIN_FAME: Record<Difficulty, number> = { easy: 45, normal: 30, hard: 0 };

export const MAX_GUESSES = 3;
/** Score multiplier for a guess locked in on the 1st, 2nd and 3rd try. */
export const TRY_FACTOR = [1, 0.85, 0.7];
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;
/** Powers of ten the answer box offers: 10^0 … 10^15. */
export const EXP_RANGE: [number, number] = [0, 15];
export const EXACT = 1.05;

export interface Question {
  index: number;
  id: string;
  kind: Kind;
  value: number;
  subject: { en: string; es: string };
  fame: number;
  year: number;
}

export function questionAt(data: MagnitudeData, i: number): Question {
  const [id, kind, value, en, es, fame, year] = data.questions[i]!;
  return { index: i, id, kind, value, subject: { en, es }, fame, year };
}

/* ---------- numbers ---------- */

/** A guess in scientific notation: mantissa 1.0–9.9 (one decimal) × 10^exp. */
export interface Sci {
  m: number;
  e: number;
}
export const sciValue = ({ m, e }: Sci) => Number((m * Math.pow(10, e)).toPrecision(3));
/** The scientific-notation form of a positive number, rounded to the answer box's precision. */
export function toSci(v: number): Sci {
  let e = Math.floor(Math.log10(v));
  let m = Math.round((v / Math.pow(10, e)) * 10) / 10;
  if (m >= 10) {
    m = 1;
    e++;
  }
  e = Math.max(EXP_RANGE[0], Math.min(EXP_RANGE[1], e));
  return { m: Math.max(1, Math.min(9.9, m)), e };
}
export const isSci = (s: Sci) =>
  Number.isInteger(s.e) &&
  s.e >= EXP_RANGE[0] &&
  s.e <= EXP_RANGE[1] &&
  Math.abs(s.m * 10 - Math.round(s.m * 10)) < 1e-9 &&
  s.m >= 1 &&
  s.m <= 9.9;

export type Band = 'exact' | 'hot' | 'warm' | 'order' | 'off';
export interface Feedback {
  /** Where the answer lies compared with the guess. */
  direction: 'higher' | 'lower' | 'exact';
  band: Band;
  /** Orders of magnitude off, rounded (0 when within the same order). */
  orders: number;
}

/**
 * Feedback for a guess: exact within 5 %; hot within ×1.26 (0.1 order); warm within ×2
 * (0.3 order); same order within ×10; otherwise off by the rounded number of orders.
 */
export function feedback(guess: number, actual: number): Feedback {
  const l = Math.log10(guess / actual);
  const a = Math.abs(l);
  if (a <= Math.log10(EXACT)) return { direction: 'exact', band: 'exact', orders: 0 };
  const direction = l < 0 ? 'higher' : 'lower';
  const band: Band = a < 0.1 ? 'hot' : a < 0.3 ? 'warm' : a < 1 ? 'order' : 'off';
  return { direction, band, orders: band === 'off' ? Math.round(a) : 0 };
}

/** The interval (log10) consistent with every feedback received so far. */
export function feasible(guesses: { value: number; feedback: Feedback }[]): [number, number] {
  let lo = 0;
  let hi = EXP_RANGE[1] + 1;
  for (const { value, feedback: f } of guesses) {
    const g = Math.log10(value);
    if (f.direction === 'exact') return [g - 0.02, g + 0.02];
    // Distance band in orders of magnitude.
    const [dMin, dMax] =
      f.band === 'hot'
        ? [0.02, 0.1]
        : f.band === 'warm'
          ? [0.1, 0.3]
          : f.band === 'order'
            ? [0.3, 1]
            : [Math.max(1, f.orders - 0.5), f.orders + 0.5];
    if (f.direction === 'higher') {
      lo = Math.max(lo, g + dMin);
      hi = Math.min(hi, g + dMax);
    } else {
      lo = Math.max(lo, g - dMax);
      hi = Math.min(hi, g - dMin);
    }
  }
  return lo <= hi ? [lo, hi] : [hi, lo];
}

/** Accuracy 0–100: 100 within 5 %, then 100 × (1 − orders off / 2): ×2 → 85, ×10 → 50, ×100 → 0. */
export function accuracy(guess: number, actual: number): number {
  const a = Math.abs(Math.log10(guess / actual));
  if (a <= Math.log10(EXACT)) return 100;
  return Math.round(100 * Math.max(0, 1 - a / 2));
}
// (The epsilon keeps 85 × 0.7 = 59.4999… from rounding down.)
export const roundScore = (guess: number, actual: number, tries: number) =>
  Math.round(accuracy(guess, actual) * TRY_FACTOR[tries - 1]! + 1e-9);

/* ---------- pools ---------- */

const poolCache = new WeakMap<MagnitudeData, Map<string, number[]>>();
export function pool(data: MagnitudeData, difficulty: Difficulty, topic: Topic): number[] {
  let c = poolCache.get(data);
  if (!c) poolCache.set(data, (c = new Map()));
  const key = `${difficulty}:${topic}`;
  const hit = c.get(key);
  if (hit) return hit;
  const out: number[] = [];
  data.questions.forEach(([, kind, , , , fame], i) => {
    if (fame >= MIN_FAME[difficulty] && (topic === 'all' || TOPIC_OF[kind] === topic)) out.push(i);
  });
  c.set(key, out);
  return out;
}

/** A question: kind first (so city populations do not crowd out the rest), then the item. */
export function pickQuestion(
  data: MagnitudeData,
  rng: Rng,
  difficulty: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
  avoidKind: Kind | null = null,
): number {
  let ids = pool(data, difficulty, topic);
  const fresh = avoid.size ? ids.filter((i) => !avoid.has(i)) : ids;
  if (fresh.length) ids = fresh;
  const byKind = new Map<Kind, number[]>();
  for (const i of ids) {
    const k = data.questions[i]![1];
    const l = byKind.get(k);
    if (l) l.push(i);
    else byKind.set(k, [i]);
  }
  let kinds = [...byKind.keys()];
  if (avoidKind && kinds.length > 1) kinds = kinds.filter((k) => k !== avoidKind);
  return rng.pick(byKind.get(rng.pick(kinds))!);
}

/* ---------- sessions ---------- */

export interface Round {
  q: number;
  /** Guesses made so far (values). */
  guesses: number[];
  locked: boolean;
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
  status: 'playing' | 'done';
}

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 13, 3266489917) ^ 0x0a6e_2331) >>> 0;

function addRound(s: Session, data: MagnitudeData, avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  const used = new Set([...avoid, ...s.rounds.map((r) => r.q)]);
  const last = s.rounds.length ? data.questions[s.rounds[s.rounds.length - 1]!.q]![1] : null;
  const q = pickQuestion(data, rng, s.difficulty, s.topic, used, last);
  const rounds = [...s.rounds, { q, guesses: [], locked: false, score: null }];
  return { ...s, rng: rng.state, rounds: rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  d: Difficulty,
  t: Topic,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: d,
    topic: t,
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}

export const newDaily = (data: MagnitudeData, day: number) =>
  addRound(base('daily', day, 'normal', 'all', DAILY_ROUNDS, dailySeed(day)), data, new Set());

export const newEndless = (
  data: MagnitudeData,
  seed: number,
  difficulty: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, difficulty, topic, limit, seed), data, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const canGuess = (s: Session) =>
  s.status === 'playing' && !current(s).locked && current(s).guesses.length < MAX_GUESSES;
export const canLock = (s: Session) =>
  s.status === 'playing' && !current(s).locked && current(s).guesses.length > 0;

function settle(s: Session, r: Round): Session {
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), r],
    count,
    total: s.total + r.score!,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

/** Lock the last guess in and score it. */
function lockRound(s: Session, data: MagnitudeData, r: Round): Session {
  const last = r.guesses[r.guesses.length - 1]!;
  const score = roundScore(last, questionAt(data, r.q).value, r.guesses.length);
  return settle(s, { ...r, locked: true, score });
}

/**
 * Makes a guess. An exact guess (within 5 %) or the third guess locks in automatically.
 */
export function guess(s: Session, data: MagnitudeData, sci: Sci): Session {
  if (!canGuess(s)) throw new Error('No guess is possible now');
  if (!isSci(sci)) throw new Error('Guesses are 1.0–9.9 × 10^0…10^15');
  const r = current(s);
  const v = sciValue(sci);
  const nr: Round = { ...r, guesses: [...r.guesses, v] };
  const fb = feedback(v, questionAt(data, r.q).value);
  if (fb.band === 'exact' || nr.guesses.length >= MAX_GUESSES) return lockRound(s, data, nr);
  return { ...s, rounds: [...s.rounds.slice(0, -1), nr] };
}

export function lock(s: Session, data: MagnitudeData): Session {
  if (!canLock(s)) throw new Error('Nothing to lock in');
  return lockRound(s, data, current(s));
}

export function next(
  s: Session,
  data: MagnitudeData,
  avoid: ReadonlySet<number> = new Set(),
): Session {
  if (s.status !== 'playing' || !current(s).locked) throw new Error('Nothing to advance');
  return addRound(s, data, avoid);
}

export function finish(s: Session): Session {
  const rounds = current(s).locked ? s.rounds : s.rounds.slice(0, -1);
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 90 ? '🟩' : n >= 70 ? '🟨' : n >= 45 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => `${sq(r.score ?? 0)}${r.guesses.length}`).join(' ')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, data?: MagnitudeData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        isNum(r.q) &&
        r.q >= 0 &&
        (!data || r.q < data.questions.length) &&
        Array.isArray(r.guesses) &&
        r.guesses.length <= MAX_GUESSES &&
        r.guesses.every((g) => isNum(g) && g > 0) &&
        typeof r.locked === 'boolean' &&
        (r.locked ? r.guesses.length > 0 && isNum(r.score) : r.score === null),
    )
  );
}
