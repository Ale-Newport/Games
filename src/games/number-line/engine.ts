/**
 * Number Line rules (pure). A board is one World Bank indicator in one year drawn as a line —
 * logarithmic for money and counts, linear otherwise — with three reference countries already in
 * place (low, middle and high). The player places three mystery countries on the line; each scores
 * 100 · e^(−d / 0.1), where d is the distance to the true position as a share of the line.
 * Sessions: a five-board daily or an endless run by topic and difficulty. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { valueOf } from '../plot-the-point/engine';
import {
  INDICATOR_BY_CODE,
  TOPICS as STAT_TOPICS,
  type Indicator,
  type StatTopic,
} from '../shared/stats/indicators';
import { niceRange, type StatsData } from '../shared/stats/stats';

export type Topic = 'all' | StatTopic;
export const TOPICS: Topic[] = ['all', ...STAT_TOPICS];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

export const REFS = 3;
export const TARGETS = 3;
export const DAILY_BOARDS = 5;
/** Countries an indicator-year needs to make a board. */
export const MIN_COUNTRIES = 60;
/** Distance (share of the line) at which a placement scores 100/e ≈ 37. */
export const SCALE = 0.1;

/* ---------- the line ---------- */

export interface Axis {
  log: boolean;
  lo: number;
  hi: number;
}
/** Value at quantile q of the sorted values (nearest rank). */
const quantile = (sorted: number[], q: number) =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]!;
/** The span the line covers: the 2nd to 98th percentile, so a few outliers do not squash the rest. */
export function span(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  return [quantile(sorted, 0.02), quantile(sorted, 0.98)];
}
const isLog = (ind: Indicator, values: number[]) => {
  if (ind.signed || values.some((v) => v <= 0)) return false;
  const [lo, hi] = span(values);
  return hi / lo > 30 || ((ind.format === 'money' || ind.format === 'count') && hi / lo > 10);
};

/**
 * The line for a set of values over their 2nd–98th percentile span, with nice bounds: log10 when
 * the span covers orders of magnitude (money, populations, skewed shares), linear otherwise.
 */
export function axisFor(ind: Indicator, values: number[]): Axis {
  const [vlo, vhi] = span(values);
  if (isLog(ind, values)) {
    const lo = Math.floor(Math.log10(vlo));
    const hi = Math.ceil(Math.log10(vhi));
    return { log: true, lo, hi: hi > lo ? hi : lo + 1 };
  }
  const [lo, hi] = niceRange(vlo, vhi, 5);
  return { log: false, lo, hi: ind.max !== undefined ? Math.min(hi, ind.max) : hi };
}
/** Position 0–1 of a value on the line (clamped). */
export function positionOf(a: Axis, v: number): number {
  const x = a.log ? Math.log10(Math.max(v, 1e-12)) : v;
  return Math.min(1, Math.max(0, (x - a.lo) / (a.hi - a.lo)));
}
export function valueAt(a: Axis, p: number): number {
  const x = a.lo + Math.min(1, Math.max(0, p)) * (a.hi - a.lo);
  return a.log ? Math.pow(10, x) : x;
}

export const scorePlacement = (guess: number, truth: number) =>
  Math.round(100 * Math.exp(-Math.abs(guess - truth) / SCALE));

/* ---------- boards ---------- */

export interface Board {
  code: string;
  year: number;
  /** Reference countries (entity indices), low to high. */
  refs: number[];
  /** Mystery countries (entity indices). */
  targets: number[];
  axis: Axis;
  /** placed[i] = position 0–1 of target i, or null. */
  placed: (number | null)[];
  /** Points per target once the board is locked. */
  points: number[] | null;
}

/** Countries ranked by population (the better-known first): the difficulty pools. */
const popCache = new WeakMap<StatsData, number[]>();
export function byPopulation(data: StatsData): number[] {
  const hit = popCache.get(data);
  if (hit) return hit;
  const pop = (e: number) => {
    for (let y = 2024; y >= 2000; y--) {
      const v = valueOf(data, 'SP.POP.TOTL', e, y);
      if (v !== null) return v;
    }
    return 0;
  };
  const out = data.entities
    .map((_, i) => i)
    .filter((i) => data.entities[i]![4] === 0)
    .map((i) => [i, pop(i)] as const)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([i]) => i);
  popCache.set(data, out);
  return out;
}
const POOL: Record<Difficulty, number> = { easy: 60, normal: 120, hard: 400 };

/** Indicator-years with enough countries: [code, year, countries]. */
const choiceCache = new WeakMap<StatsData, [string, number, number[]][]>();
export function choices(data: StatsData): [string, number, number[]][] {
  const hit = choiceCache.get(data);
  if (hit) return hit;
  const countries = byPopulation(data);
  const out: [string, number, number[]][] = [];
  for (const code of data.indicators) {
    const ind = INDICATOR_BY_CODE.get(code);
    if (!ind) continue;
    for (let y = 1995; y <= 2024; y++) {
      const have = countries.filter((e) => valueOf(data, code, e, y) !== null);
      if (have.length >= MIN_COUNTRIES) out.push([code, y, have]);
    }
  }
  choiceCache.set(data, out);
  return out;
}

export function makeBoard(data: StatsData, rng: Rng, diff: Difficulty, topic: Topic): Board {
  const all = choices(data).filter(
    ([code]) => topic === 'all' || INDICATOR_BY_CODE.get(code)!.topic === topic,
  );
  // Indicator first (years would otherwise favour long series), then a year.
  const codes = [...new Set(all.map((c) => c[0]))];
  const code = rng.pick(codes);
  const [, year, have] = rng.pick(all.filter((c) => c[0] === code));
  const ind = INDICATOR_BY_CODE.get(code)!;
  const value = (e: number) => valueOf(data, code, e, year)!;
  const rank = new Map(byPopulation(data).map((e, i) => [e, i]));
  const axis = axisFor(ind, have.map(value));
  const pos = (e: number) => positionOf(axis, value(e));
  // Only countries that sit on the line (not clamped at either end) can be references or mysteries.
  const onLine = have.filter((e) => pos(e) > 0.005 && pos(e) < 0.995);
  const famous = onLine.filter((e) => rank.get(e)! < POOL[diff]);
  // Targets: well-known countries with values at least 3 % of the line apart.
  const targets: number[] = [];
  for (const e of rng.shuffle(famous.length >= TARGETS + REFS ? famous : onLine)) {
    if (targets.every((t) => Math.abs(pos(t) - pos(e)) >= 0.03)) targets.push(e);
    if (targets.length === TARGETS) break;
  }
  // References: the best-known countries nearest the 10th, 50th and 90th percentiles of the line.
  const sorted = onLine.filter((e) => !targets.includes(e)).sort((a, b) => value(a) - value(b));
  const refs: number[] = [];
  for (const q of [0.1, 0.5, 0.9]) {
    const centre = sorted[Math.floor(q * (sorted.length - 1))]!;
    const window = sorted.filter(
      (e) => Math.abs(pos(e) - pos(centre)) <= 0.06 && !refs.includes(e),
    );
    const best = window.sort((a, b) => rank.get(a)! - rank.get(b)!)[0] ?? centre;
    refs.push(best);
  }
  refs.sort((a, b) => value(a) - value(b));
  return { code, year, refs, targets, axis, placed: targets.map(() => null), points: null };
}

/** The true position of target i. */
export const truePosition = (data: StatsData, b: Board, i: number) =>
  positionOf(b.axis, valueOf(data, b.code, b.targets[i]!, b.year)!);

export function placeTarget(b: Board, i: number, p: number): Board {
  if (b.points) throw new Error('The board is locked');
  if (!(i >= 0 && i < TARGETS) || !(p >= 0 && p <= 1)) throw new Error('Bad placement');
  const placed = [...b.placed];
  placed[i] = p;
  return { ...b, placed };
}
export const allPlaced = (b: Board) => b.placed.every((p) => p !== null);
export function lockBoard(data: StatsData, b: Board): Board {
  if (b.points) throw new Error('Already locked');
  if (!allPlaced(b)) throw new Error('Place every country first');
  return { ...b, points: b.placed.map((p, i) => scorePlacement(p!, truePosition(data, b, i))) };
}
export const boardScore = (b: Board) =>
  b.points ? Math.round(b.points.reduce((a, x) => a + x, 0) / TARGETS) : null;

/* ---------- sessions ---------- */

export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  topic: Topic;
  limit: number;
  rng: RngState;
  boards: Board[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}
const KEEP_BOARDS = 8;
const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 151, 2654435761) ^ 0x2b3c_9d1e) >>> 0;

function addBoard(s: Session, data: StatsData, avoid: ReadonlySet<string>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const recent = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.boards.map((b) => b.code)]);
  let topic = s.topic;
  // The daily walks through the topics (economy, people, health, environment, technology / society).
  if (s.mode === 'daily') topic = STAT_TOPICS[s.boards.length % STAT_TOPICS.length]!;
  let b = makeBoard(data, rng, s.difficulty, topic);
  for (let k = 0; k < 8 && recent.has(b.code); k++) b = makeBoard(data, rng, s.difficulty, topic);
  const boards = [...s.boards, b];
  return { ...s, rng: rng.state, boards: s.mode === 'daily' ? boards : boards.slice(-KEEP_BOARDS) };
}
function base(
  mode: Session['mode'],
  day: number,
  d: Difficulty,
  topic: Topic,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: d,
    topic,
    limit,
    rng: new Rng(seed >>> 0).state,
    boards: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}
export const newDaily = (data: StatsData, day: number) =>
  addBoard(base('daily', day, 'normal', 'all', DAILY_BOARDS, dailySeed(day)), data, new Set());
export const newEndless = (
  data: StatsData,
  seed: number,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<string> = new Set(),
  limit = 0,
) => addBoard(base('endless', -1, d, topic, limit, seed), data, avoid);

export const current = (s: Session): Board => s.boards[s.boards.length - 1]!;
const withBoard = (s: Session, b: Board): Session => ({
  ...s,
  boards: [...s.boards.slice(0, -1), b],
});
export function place(s: Session, i: number, p: number): Session {
  if (s.status !== 'playing') throw new Error('The session is over');
  return withBoard(s, placeTarget(current(s), i, p));
}
export function lock(s: Session, data: StatsData): Session {
  if (s.status !== 'playing') throw new Error('The session is over');
  const b = lockBoard(data, current(s));
  const count = s.count + 1;
  return {
    ...withBoard(s, b),
    count,
    total: s.total + boardScore(b)!,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}
export function next(s: Session, data: StatsData, avoid: ReadonlySet<string> = new Set()): Session {
  if (s.status !== 'playing' || !current(s).points) throw new Error('Nothing to advance');
  return addBoard(s, data, avoid);
}
export function finish(s: Session): Session {
  const boards = current(s).points ? s.boards : s.boards.slice(0, -1);
  return { ...s, boards, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 80 ? '🟩' : n >= 50 ? '🟨' : n >= 25 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.boards
    .filter((b) => b.points)
    .map((b) => b.points!.map(sq).join(''))
    .join('\n')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isBoard(v: unknown, data?: StatsData): v is Board {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Board;
  const ent = (e: unknown) =>
    isNum(e) &&
    Number.isInteger(e) &&
    e >= 0 &&
    (!data || (e < data.entities.length && valueOf(data, b.code, e, b.year) !== null));
  return (
    typeof b.code === 'string' &&
    INDICATOR_BY_CODE.has(b.code) &&
    isNum(b.year) &&
    Array.isArray(b.refs) &&
    b.refs.length === REFS &&
    b.refs.every(ent) &&
    Array.isArray(b.targets) &&
    b.targets.length === TARGETS &&
    b.targets.every(ent) &&
    typeof b.axis === 'object' &&
    b.axis !== null &&
    typeof b.axis.log === 'boolean' &&
    isNum(b.axis.lo) &&
    isNum(b.axis.hi) &&
    b.axis.hi > b.axis.lo &&
    Array.isArray(b.placed) &&
    b.placed.length === TARGETS &&
    b.placed.every((p) => p === null || (isNum(p) && p >= 0 && p <= 1)) &&
    (b.points === null ||
      (Array.isArray(b.points) && b.points.length === TARGETS && b.points.every(isNum)))
  );
}
export function isSession(v: unknown, data?: StatsData): v is Session {
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
    Array.isArray(s.boards) &&
    (s.boards.length > 0 || s.status === 'done') &&
    s.boards.every((b) => isBoard(b, data))
  );
}
