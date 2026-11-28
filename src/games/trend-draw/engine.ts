/**
 * Trend Draw rules (pure). A chart shows one World Bank indicator for one country over 15–40
 * years, but only its first point — and the whole world's curve for the same years as a guide.
 * The player draws the country's entire curve; the score falls with the mean distance between the
 * drawing and the truth, as a share of the chart height (as in #231, whose drawing helpers this
 * reuses). Sessions: a five-chart daily or an endless run by topic and difficulty. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  clampTo,
  completeDraft as completeForecast,
  drawSegment as drawForecast,
  type Draft,
} from '../graph-forecast/engine';
import {
  INDICATOR_BY_CODE,
  TOPICS as STAT_TOPICS,
  type Indicator,
  type StatTopic,
} from '../shared/stats/indicators';
import { entityAt, seriesAt, seriesWhere, type StatsData } from '../shared/stats/stats';

export type Topic = 'all' | StatTopic;
export const TOPICS: Topic[] = ['all', ...STAT_TOPICS];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;

interface Level {
  window: [number, number];
  volatility: 1 | 2 | 3;
}
export const LEVELS: Record<Difficulty, Level> = {
  easy: { window: [15, 20], volatility: 1 },
  normal: { window: [20, 30], volatility: 2 },
  hard: { window: [25, 40], volatility: 3 },
};

/**
 * A chart: country series `s` over values[from..to], the world series `w` for the same years,
 * and the y axis [lo, hi]. Only values[from] is shown; `cut` = from + 1 (the drawing starts there).
 */
export interface Challenge {
  s: number;
  w: number;
  from: number;
  to: number;
  cut: number;
  lo: number;
  hi: number;
}

/* ---------- pools ---------- */

const worldIndex = new WeakMap<StatsData, Map<string, number>>();
/** The world series of each indicator (series index by code). */
export function worldSeries(data: StatsData): Map<string, number> {
  let m = worldIndex.get(data);
  if (m) return m;
  m = new Map();
  const wld = data.entities.findIndex((e) => e[0] === 'WLD');
  data.series.forEach(([ind, ent], i) => {
    if (ent === wld) m!.set(data.indicators[ind]!, i);
  });
  worldIndex.set(data, m);
  return m;
}

/** World totals (sums over countries) dwarf any one country: no comparable guide. */
export const TOTALS = new Set(['SP.POP.TOTL', 'NY.GDP.MKTP.CD', 'IS.AIR.PSGR', 'ST.INT.ARVL']);

/** Country series (no aggregates) long enough for the level, whose indicator has a comparable world series. */
export function pool(data: StatsData, d: Difficulty, topic: Topic): number[] {
  const lv = LEVELS[d];
  const world = worldSeries(data);
  return seriesWhere(
    data,
    `td:${d}:${topic}`,
    (ind, len) =>
      len >= lv.window[0] &&
      ind.volatility <= lv.volatility &&
      (topic === 'all' || ind.topic === topic),
  ).filter((i) => {
    const [indI, ent] = data.series[i]!;
    const code = data.indicators[indI]!;
    return data.entities[ent]![4] === 0 && world.has(code) && !TOTALS.has(code);
  });
}

export const yearOf = (data: StatsData, c: Challenge, k: number) =>
  seriesAt(data, c.s).start + c.from + k;
/** The country's values over the window. */
export const actual = (data: StatsData, c: Challenge) =>
  seriesAt(data, c.s).values.slice(c.from, c.to + 1);
/** The world's values for the window's years (null where the world series has no value). */
export function worldValues(data: StatsData, c: Challenge): (number | null)[] {
  const s = seriesAt(data, c.s);
  const w = seriesAt(data, c.w);
  return Array.from(
    { length: c.to - c.from + 1 },
    (_, k) => w.values[s.start + c.from + k - w.start] ?? null,
  );
}
export const hiddenCount = (c: Challenge) => c.to - c.cut + 1;

/**
 * Picks a chart: a playable country series (avoiding `avoid` while possible), a window whose
 * years the world series covers, and a y axis around both curves padded by a random 6–18 % on
 * each side (never below zero for quantities that cannot be negative).
 */
export function pickChallenge(
  data: StatsData,
  rng: Rng,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
): Challenge {
  const lv = LEVELS[d];
  let ids = pool(data, d, topic);
  if (!ids.length) ids = pool(data, d, 'all');
  const fresh = ids.filter((i) => !avoid.has(i));
  if (fresh.length) ids = fresh;
  const world = worldSeries(data);
  for (let attempt = 0; attempt < 200; attempt++) {
    const s = rng.pick(ids);
    const ser = seriesAt(data, s);
    const w = world.get(ser.indicator.code)!;
    const wser = seriesAt(data, w);
    const first = Math.max(ser.start, wser.start);
    const last = Math.min(ser.start + ser.values.length - 1, wser.start + wser.values.length - 1);
    const len = Math.min(last - first + 1, lv.window[0] + rng.int(lv.window[1] - lv.window[0] + 1));
    if (len < lv.window[0]) continue;
    // Half the time the window ends at the latest common year.
    const startYear = rng.chance(0.5) ? last - len + 1 : first + rng.int(last - first - len + 2);
    const from = startYear - ser.start;
    const to = from + len - 1;
    const c0 = { s, w, from, to, cut: from + 1, lo: 0, hi: 1 };
    const all = [
      ...actual(data, c0),
      ...worldValues(data, c0).filter((v): v is number => v !== null),
    ];
    const lo0 = Math.min(...all);
    const hi0 = Math.max(...all);
    const span = hi0 - lo0 || Math.abs(hi0) || 1;
    let lo = lo0 - span * (0.06 + rng.float() * 0.12);
    let hi = hi0 + span * (0.06 + rng.float() * 0.12);
    if (!ser.indicator.signed && lo0 >= 0) lo = Math.max(0, lo);
    if (ser.indicator.max !== undefined) hi = Math.min(ser.indicator.max, hi);
    if (!(hi > lo)) continue;
    const round = (v: number) => Number(v.toPrecision(4));
    lo = round(lo);
    hi = round(hi);
    if (!(hi > lo) || lo > lo0 || hi < hi0) continue;
    // The country's line must not be squashed against the bottom by a far larger world curve.
    if ((Math.max(...actual(data, c0)) - lo) / (hi - lo) < 0.15) continue;
    return { ...c0, lo, hi };
  }
  throw new Error('No chart could be picked');
}

/** Score 0–100 from the mean distance as a share of the chart height (1 % → 90, 5 % → 61, 10 % → 37). */
export function scoreDrawing(
  c: Challenge,
  pred: readonly number[],
  truth: readonly number[],
): number {
  let err = 0;
  for (let i = 0; i < truth.length; i++) err += Math.abs(pred[i]! - truth[i]!);
  return Math.round(100 * Math.exp(-(err / truth.length / (c.hi - c.lo)) / 0.1));
}

/* ---------- drawing ---------- */

export type { Draft };
export const emptyDraft = (c: Challenge): Draft =>
  Array.from({ length: hiddenCount(c) }, () => null);
/** Adds a pointer segment (x = window index, y = value) to the draft (see #231). */
export const drawSegment = (
  c: Challenge,
  draft: Draft,
  p0: { x: number; y: number } | null,
  p1: { x: number; y: number },
) => drawForecast(c, draft, p0, p1);
/** The full curve once the last year is drawn; gaps join linearly from the first point. */
export const completeDraft = (c: Challenge, draft: Draft, first: number) =>
  completeForecast(c, draft, first);

/* ---------- reference curves (used by the computer and on the reveal) ---------- */

export type Strategy = 'flat' | 'world' | 'peers' | 'blend';
export const STRATEGIES: Strategy[] = ['flat', 'world', 'peers', 'blend'];
const relative = (ind: Indicator) =>
  (ind.format === 'money' || ind.format === 'count') && !ind.signed;

/** Applies a reference path's changes (ratios for money and counts, differences otherwise) to `start`. */
function follow(ind: Indicator, start: number, path: number[]): number[] {
  const p0 = path[0]!;
  return path.slice(1).map((v) => (relative(ind) && p0 > 0 ? start * (v / p0) : start + (v - p0)));
}

/**
 * The curve a strategy draws for a chart — never reading the country's hidden years:
 * - flat: the first value all along;
 * - world: the world's changes applied to the country's first value;
 * - peers: the average path of the eight countries whose first-year value on this indicator is
 *   closest to this country's (the country itself excluded), applied to its first value;
 * - blend: the average of world and peers.
 */
export function strategyCurve(data: StatsData, c: Challenge, st: Strategy): number[] {
  const ser = seriesAt(data, c.s);
  const ind = ser.indicator;
  const start = ser.values[c.from]!;
  const n = hiddenCount(c);
  const flat = Array.from({ length: n }, () => start);
  if (st === 'flat') return flat;
  const wv = worldValues(data, c);
  const world = wv.every((v) => v !== null) ? follow(ind, start, wv as number[]) : flat;
  if (st === 'world') return world.map((v) => clampTo(c, v));
  const y0 = ser.start + c.from;
  const peers: { gap: number; path: number[] }[] = [];
  const indI = data.indicators.indexOf(ind.code);
  data.series.forEach(([ii, ent, st0, vals], i) => {
    if (ii !== indI || i === c.s || data.entities[ent]![4] === 1) return;
    const a = y0 - st0;
    const b = a + n;
    if (a < 0 || b >= vals.length) return;
    const v0 = vals[a]!;
    const gap =
      relative(ind) && v0 > 0 && start > 0 ? Math.abs(Math.log(v0 / start)) : Math.abs(v0 - start);
    peers.push({ gap, path: vals.slice(a, b + 1) });
  });
  peers.sort((p, q) => p.gap - q.gap);
  const near = peers.slice(0, 8);
  const peer = near.length
    ? Array.from(
        { length: n },
        (_, k) => near.reduce((acc, p) => acc + follow(ind, start, p.path)[k]!, 0) / near.length,
      )
    : world;
  if (st === 'peers') return peer.map((v) => clampTo(c, v));
  return peer.map((v, k) => clampTo(c, (v + world[k]!) / 2));
}

/* ---------- sessions ---------- */

export interface Round {
  c: Challenge;
  pred: number[] | null;
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
const dailySeed = (day: number) => (Math.imul(day + 173, 2246822519) ^ 0x7d2a_31c4) >>> 0;

function addRound(s: Session, data: StatsData, avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.rounds.map((r) => r.c.s)]);
  const topic = s.mode === 'daily' ? STAT_TOPICS[s.rounds.length % STAT_TOPICS.length]! : s.topic;
  const c = pickChallenge(data, rng, s.difficulty, topic, used);
  const rounds = [...s.rounds, { c, pred: null, score: null }];
  return { ...s, rng: rng.state, rounds: s.mode === 'daily' ? rounds : rounds.slice(-KEEP_ROUNDS) };
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
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}
export const newDaily = (data: StatsData, day: number) =>
  addRound(base('daily', day, 'normal', 'all', DAILY_ROUNDS, dailySeed(day)), data, new Set());
export const newEndless = (
  data: StatsData,
  seed: number,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, d, topic, limit, seed), data, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).pred === null;

export function submit(s: Session, data: StatsData, pred: readonly number[]): Session {
  if (!awaiting(s)) throw new Error('No chart is waiting for a drawing');
  const c = current(s).c;
  if (pred.length !== hiddenCount(c) || !pred.every((v) => Number.isFinite(v)))
    throw new Error('A value is needed for every year');
  const p = pred.map((v) => clampTo(c, v));
  const score = scoreDrawing(c, p, actual(data, c).slice(1));
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { c, pred: p, score }],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}
export function next(s: Session, data: StatsData, avoid: ReadonlySet<number> = new Set()): Session {
  if (s.status !== 'playing' || current(s).pred === null) throw new Error('Nothing to advance');
  return addRound(s, data, avoid);
}
export function finish(s: Session): Session {
  const rounds = current(s).pred === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}
export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 80 ? '🟩' : n >= 50 ? '🟨' : n >= 25 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds
    .filter((r) => r.score !== null)
    .map((r) => sq(r.score!))
    .join('')}`;
}

/** Name of the country and title of the indicator, for labels. */
export const describe = (data: StatsData, c: Challenge) => {
  const ser = seriesAt(data, c.s);
  return {
    indicator: INDICATOR_BY_CODE.get(ser.indicator.code)!,
    entity: entityAt(data, data.series[c.s]![1]),
  };
};

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, data?: StatsData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const okC = (c: Challenge) =>
    typeof c === 'object' &&
    c !== null &&
    [c.s, c.w, c.from, c.to, c.cut, c.lo, c.hi].every(isNum) &&
    c.cut === c.from + 1 &&
    c.to > c.from &&
    c.hi > c.lo &&
    (!data ||
      (c.s < data.series.length && c.w < data.series.length && c.to < data.series[c.s]![3].length));
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
        okC(r.c) &&
        (r.pred === null
          ? r.score === null
          : Array.isArray(r.pred) &&
            r.pred.length === r.c.to - r.c.cut + 1 &&
            r.pred.every(isNum) &&
            isNum(r.score)),
    )
  );
}
