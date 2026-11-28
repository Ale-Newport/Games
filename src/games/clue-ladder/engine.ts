/**
 * Clue Ladder rules (pure). Each question asks for a real quantity and climbs a ladder of five
 * rungs, each adding a stronger clue: (1) the subject and unit, (2) two related facts of the same
 * kind that bracket it, (3) how many digits it has, (4) its leading digit, (5) a ±15 % window.
 * On every rung the player makes one guess and sees banded feedback (direction and how far); they
 * then keep it — scoring accuracy × the rung's value — or climb for the next clue. The fifth
 * rung's guess is final. Sessions: a five-question daily challenge or an endless run.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  domain,
  greatCircleKm,
  pickQuestion,
  question,
  type Bank,
  type Difficulty,
  type QKey,
  type Question,
  type Topic,
} from '../rough-guess/engine';

export type { Bank, Difficulty, Topic };
export { DIFFICULTIES, TOPICS } from '../rough-guess/engine';

export const RUNGS = 5;
/** What a kept guess is worth (×accuracy / 100) on each rung. */
export const RUNG_VALUE = [100, 75, 55, 40, 25];
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;

/* ---------- clues ---------- */

export interface Bracket {
  below: { subject: { en: string; es: string }; value: number; year: number } | null;
  above: { subject: { en: string; es: string }; value: number; year: number } | null;
}

export interface Clues {
  bracket: Bracket;
  /** Digits of the integer part (0 when below 1). */
  digits: number;
  /** First significant digit. */
  leading: number;
  /** A ±15 % window around the answer, offset by a seeded amount so it is not centred on it. */
  window: [number, number];
}

/** Other facts of the same family (same commodity, kind, element property, distances). */
function family(
  bank: Bank,
  q: Question,
): { subject: { en: string; es: string }; value: number; year: number }[] {
  const [t, a, b] = q.key.split(':');
  if (t === 'p') {
    const ci = Number(a);
    return bank.rough.prices
      .filter((p) => p[0] === ci && p[1] !== q.year)
      .map((p) => ({ subject: q.subject, value: p[2], year: p[1] }));
  }
  if (t === 'd') {
    // Distances from one of the two cities to other big cities.
    const i = Number(a);
    const c = bank.rough.cities;
    const from = c[i]!;
    return c
      .filter((_, j) => j !== i && j !== Number(b))
      .slice(0, 200)
      .map((to) => ({
        subject: { en: `${from[1]} — ${to[1]}`, es: `${from[2]} — ${to[2]}` },
        value: Math.round(greatCircleKm([from[3], from[4]], [to[3], to[4]])),
        year: 0,
      }));
  }
  if (t === 'e') {
    const col = { melting: 4, boiling: 5, density: 6, 'atomic-mass': 7 }[b as 'melting'];
    return bank.rough.elements
      .filter((e, i) => i !== Number(a) && (e[col] as number) > 0)
      .map((e) => ({ subject: { en: e[1], es: e[2] }, value: e[col] as number, year: 0 }));
  }
  return bank.mag.questions
    .filter((m, i) => i !== Number(a) && m[1] === q.kind)
    .map((m) => ({ subject: { en: m[3], es: m[4] }, value: m[2], year: m[6] }));
}

/** Builds the clues for a question (seeded: which bracketing facts, where the window sits). */
export function cluesFor(bank: Bank, key: QKey, seed: number): Clues {
  const q = question(bank, key);
  const rng = new Rng(seed >>> 0);
  const fam = family(bank, q);
  const pick = (lo: number, hi: number) => {
    const c = fam.filter((f) => f.value >= lo && f.value <= hi);
    return c.length ? rng.pick(c) : null;
  };
  // A related fact 2–8× smaller and one 2–8× larger (widening if none exists).
  let below = pick(q.value / 8, q.value / 2);
  let above = pick(q.value * 2, q.value * 8);
  below ??= pick(q.value / 30, q.value / 1.3);
  above ??= pick(q.value * 1.3, q.value * 30);
  const digits = q.value < 1 ? 0 : Math.floor(Math.log10(q.value)) + 1;
  const leading = Number(q.value.toExponential(6)[0]);
  // The answer lies at a random point of a window whose ends are 30 % apart.
  const t = 0.15 + rng.float() * 0.7;
  const lo = q.value / Math.pow(1.3, t);
  return { bracket: { below, above }, digits, leading, window: [lo, lo * 1.3] };
}

/* ---------- feedback and scoring ---------- */

export type Band = 'exact' | 'hot' | 'warm' | 'near' | 'far' | 'way';
export interface Feedback {
  direction: 'higher' | 'lower' | 'exact';
  band: Band;
}
/** Bands by ratio: ≤ 1.02 exact, ≤ 1.1 hot, ≤ 1.25 warm, ≤ 1.5 near, ≤ 3 far, beyond way off. */
export function feedback(guess: number, answer: number): Feedback {
  const r = Math.max(guess / answer, answer / guess);
  if (r <= 1.02) return { direction: 'exact', band: 'exact' };
  const band: Band =
    r <= 1.1 ? 'hot' : r <= 1.25 ? 'warm' : r <= 1.5 ? 'near' : r <= 3 ? 'far' : 'way';
  return { direction: guess < answer ? 'higher' : 'lower', band };
}

/** Accuracy 0–100: 100 within 2 %, else 100 · e^(−1.5 · |ln ratio|) (×1.1 → 87, ×2 → 35). */
export function accuracy(guess: number, answer: number): number {
  const r = Math.abs(Math.log(guess / answer));
  if (r <= Math.log(1.02)) return 100;
  return Math.round(100 * Math.exp(-1.5 * r));
}
export const keptScore = (guess: number, answer: number, rung: number) =>
  Math.round((accuracy(guess, answer) * RUNG_VALUE[rung]!) / 100);

/* ---------- sessions ---------- */

export interface Round {
  key: QKey;
  /** Seed of the clue choices. */
  clueSeed: number;
  /** Rung being played (0-based). */
  rung: number;
  /** One guess per rung climbed so far. */
  guesses: number[];
  /** Kept (or final) guess's rung, once the round is over. */
  kept: number | null;
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
const dailySeed = (day: number) => (Math.imul(day + 71, 3266489917) ^ 0x6c1e_1add) >>> 0;

function addRound(s: Session, bank: Bank, avoid: ReadonlySet<QKey>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.rounds.map((r) => r.key)]);
  const last = s.rounds.length ? question(bank, s.rounds[s.rounds.length - 1]!.key).kind : null;
  const key = pickQuestion(bank, rng, s.difficulty, s.topic, used, last);
  const clueSeed = rng.uint32();
  const rounds = [...s.rounds, { key, clueSeed, rung: 0, guesses: [], kept: null, score: null }];
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
export const newDaily = (bank: Bank, day: number) =>
  addRound(base('daily', day, 'normal', 'all', DAILY_ROUNDS, dailySeed(day)), bank, new Set());
export const newEndless = (
  bank: Bank,
  seed: number,
  d: Difficulty,
  t: Topic,
  avoid: ReadonlySet<QKey> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, d, t, limit, seed), bank, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
const over = (r: Round) => r.kept !== null;
/** A guess is due on the current rung. */
export const canGuess = (s: Session) =>
  s.status === 'playing' && !over(current(s)) && current(s).guesses.length === current(s).rung;
/** A guess was made on this rung: keep it or climb. */
export const canDecide = (s: Session) =>
  s.status === 'playing' && !over(current(s)) && current(s).guesses.length === current(s).rung + 1;

function settle(s: Session, bank: Bank, r: Round): Session {
  const q = question(bank, r.key);
  const g = r.guesses[r.rung]!;
  const score = keptScore(g, q.value, r.rung);
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...r, kept: r.rung, score }],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

/** Guesses on the current rung. An exact guess, or any guess on the last rung, is kept at once. */
export function guess(s: Session, bank: Bank, value: number): Session {
  if (!canGuess(s)) throw new Error('No guess is due');
  const r = current(s);
  const q = question(bank, r.key);
  const [lo, hi] = domain(bank, q);
  if (
    !(value > 0) ||
    !Number.isFinite(value) ||
    Math.log10(value) < lo - 1e-9 ||
    Math.log10(value) > hi + 1e-9
  )
    throw new Error('The guess is off the scale');
  const nr: Round = { ...r, guesses: [...r.guesses, value] };
  if (r.rung === RUNGS - 1 || feedback(value, q.value).band === 'exact') return settle(s, bank, nr);
  return { ...s, rounds: [...s.rounds.slice(0, -1), nr] };
}

export function keep(s: Session, bank: Bank): Session {
  if (!canDecide(s)) throw new Error('Nothing to keep');
  return settle(s, bank, current(s));
}

export function climb(s: Session): Session {
  if (!canDecide(s)) throw new Error('Guess before climbing');
  const r = current(s);
  return { ...s, rounds: [...s.rounds.slice(0, -1), { ...r, rung: r.rung + 1 }] };
}

export function next(s: Session, bank: Bank, avoid: ReadonlySet<QKey> = new Set()): Session {
  if (s.status !== 'playing' || !over(current(s))) throw new Error('Nothing to advance');
  return addRound(s, bank, avoid);
}

export function finish(s: Session): Session {
  const rounds = over(current(s)) ? s.rounds : s.rounds.slice(0, -1);
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 80 ? '🟩' : n >= 50 ? '🟨' : n >= 25 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => `${sq(r.score ?? 0)}${(r.kept ?? 0) + 1}`).join(' ')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, bank?: Bank): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const okKey = (k: unknown) => {
    if (typeof k !== 'string') return false;
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
    ['easy', 'normal', 'hard'].includes(s.difficulty) &&
    ['all', 'prices', 'distances', 'science', 'world'].includes(s.topic) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        okKey(r.key) &&
        isNum(r.clueSeed) &&
        isNum(r.rung) &&
        r.rung >= 0 &&
        r.rung < RUNGS &&
        Array.isArray(r.guesses) &&
        r.guesses.length <= r.rung + 1 &&
        r.guesses.every((g) => isNum(g) && g > 0) &&
        (r.kept === null ? r.score === null : isNum(r.kept) && isNum(r.score)),
    )
  );
}
