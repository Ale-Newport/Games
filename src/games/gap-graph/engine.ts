/**
 * Gap Graph rules (pure). Two kinds of chart over the World Bank indicators, in turn:
 * - a line: one country over 12–20 years with three years in the middle hidden — the year that
 *   strays most from a straight line between its neighbours is always one of them;
 * - bars: eight countries in one year with three bars hidden.
 * The player sets each hidden value; each scores 100 · e^(−d / 0.1), d = error as a share of the
 * chart height, and the chart scores their average. Sessions: a five-chart daily or an endless
 * run by topic and difficulty. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { valueOf } from '../plot-the-point/engine';
import {
  INDICATOR_BY_CODE,
  TOPICS as STAT_TOPICS,
  type StatTopic,
} from '../shared/stats/indicators';
import { niceRange, seriesAt, seriesWhere, type StatsData } from '../shared/stats/stats';

export type Topic = 'all' | StatTopic;
export const TOPICS: Topic[] = ['all', ...STAT_TOPICS];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
export type Kind = 'line' | 'bars';
export const GAPS = 3;
export const BARS = 8;
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;
/** Most volatile indicators allowed per level (1 smooth … 3 volatile). */
const VOLATILITY: Record<Difficulty, 1 | 2 | 3> = { easy: 1, normal: 2, hard: 3 };
/** Bar charts: countries drawn from the N most populous. */
const POPULOUS: Record<Difficulty, number> = { easy: 40, normal: 90, hard: 400 };

export interface Chart {
  kind: Kind;
  code: string;
  /** Line: the country (entity index) and the first year; bars: the year. */
  entity: number;
  year: number;
  /** Line: number of years; bars: the countries, in display order. */
  length: number;
  countries: number[];
  /** Indices (years from `year`, or bar positions) that are hidden. */
  gaps: number[];
  lo: number;
  hi: number;
}

/* ---------- reading values ---------- */

/** The chart's values in order: years of the line, or one per bar. */
export function values(data: StatsData, c: Chart): number[] {
  if (c.kind === 'line')
    return Array.from({ length: c.length }, (_, k) => valueOf(data, c.code, c.entity, c.year + k)!);
  return c.countries.map((e) => valueOf(data, c.code, e, c.year)!);
}
export const truth = (data: StatsData, c: Chart) => {
  const v = values(data, c);
  return c.gaps.map((g) => v[g]!);
};

/** Countries by population, largest first (the better-known ones). */
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

/** An axis padded 5 % on each side with nice bounds (never below zero for non-negative data). */
function axis(vals: number[], signed: boolean, max?: number): [number, number] {
  const lo0 = Math.min(...vals);
  const hi0 = Math.max(...vals);
  const pad = (hi0 - lo0 || Math.abs(hi0) || 1) * 0.05;
  let [lo, hi] = niceRange(lo0 - pad, hi0 + pad, 5);
  if (!signed && lo0 >= 0) lo = Math.max(0, lo);
  if (max !== undefined) hi = Math.min(hi, max);
  return [lo, hi];
}

/** How far each inner year strays from the straight line between its neighbours, as a share of the axis. */
export function bends(vals: number[]): number[] {
  return vals.map((v, k) =>
    k === 0 || k === vals.length - 1 ? 0 : Math.abs(v - (vals[k - 1]! + vals[k + 1]!) / 2),
  );
}

/* ---------- picking charts ---------- */

function pickLine(
  data: StatsData,
  rng: Rng,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<string>,
): Chart | null {
  const ids = seriesWhere(
    data,
    `gg:line:${d}:${topic}`,
    (ind, len) =>
      len >= 12 && ind.volatility <= VOLATILITY[d] && (topic === 'all' || ind.topic === topic),
  ).filter((i) => data.entities[data.series[i]![1]]![4] === 0);
  const rank = new Map(byPopulation(data).map((e, i) => [e, i]));
  const pool = ids.filter((i) => rank.get(data.series[i]![1])! < POPULOUS[d]);
  const list = pool.length ? pool : ids;
  for (let attempt = 0; attempt < 40; attempt++) {
    const s = seriesAt(data, rng.pick(list));
    const len = Math.min(s.values.length, 12 + rng.int(9));
    const from = rng.int(s.values.length - len + 1);
    const vals = s.values.slice(from, from + len);
    const key = `line:${s.indicator.code}:${s.entity.iso3}`;
    if (avoid.has(key)) continue;
    const [lo, hi] = axis(vals, !!s.indicator.signed, s.indicator.max);
    if (!(hi > lo)) continue;
    // The year that strays most from a straight line, plus two other inner years, at least 2 apart.
    const b = bends(vals);
    const inner = vals.map((_, k) => k).filter((k) => k > 0 && k < len - 1);
    const top = inner.reduce((a, k) => (b[k]! > b[a]! ? k : a), inner[0]!);
    const gaps = [top];
    for (const k of rng.shuffle(inner)) {
      if (gaps.length === GAPS) break;
      if (gaps.every((g) => Math.abs(g - k) >= 2)) gaps.push(k);
    }
    if (gaps.length < GAPS) continue;
    gaps.sort((x, y) => x - y);
    const ent = data.series[s.index]![1];
    return {
      kind: 'line',
      code: s.indicator.code,
      entity: ent,
      year: s.start + from,
      length: len,
      countries: [],
      gaps,
      lo,
      hi,
    };
  }
  return null;
}

function pickBars(
  data: StatsData,
  rng: Rng,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<string>,
): Chart | null {
  const codes = data.indicators.filter((c) => {
    const ind = INDICATOR_BY_CODE.get(c);
    return ind && ind.volatility <= VOLATILITY[d] && (topic === 'all' || ind.topic === topic);
  });
  if (!codes.length) return null;
  const known = byPopulation(data).slice(0, POPULOUS[d]);
  for (let attempt = 0; attempt < 40; attempt++) {
    const code = rng.pick(codes);
    const year = 2000 + rng.int(25);
    const key = `bars:${code}:${year}`;
    if (avoid.has(key)) continue;
    const have = known.filter((e) => valueOf(data, code, e, year) !== null);
    if (have.length < BARS * 2) continue;
    const countries = rng.shuffle(have).slice(0, BARS);
    const vals = countries.map((e) => valueOf(data, code, e, year)!);
    const ind = INDICATOR_BY_CODE.get(code)!;
    // Bars need a common, readable scale: skip charts whose values span more than ×50.
    const pos = vals.filter((v) => v > 0);
    if (pos.length === vals.length && Math.max(...pos) / Math.min(...pos) > 50) continue;
    const [lo, hi] = axis([...vals, ...(ind.signed ? [] : [0])], !!ind.signed, ind.max);
    if (!(hi > lo)) continue;
    const gaps = rng
      .shuffle(countries.map((_, k) => k))
      .slice(0, GAPS)
      .sort((x, y) => x - y);
    return { kind: 'bars', code, entity: -1, year, length: BARS, countries, gaps, lo, hi };
  }
  return null;
}

export const chartKey = (c: Chart) =>
  c.kind === 'line' ? `line:${c.code}:${c.entity}` : `bars:${c.code}:${c.year}`;

export function pickChart(
  data: StatsData,
  rng: Rng,
  kind: Kind,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<string> = new Set(),
): Chart {
  const pick = kind === 'line' ? pickLine : pickBars;
  const c =
    pick(data, rng, d, topic, avoid) ??
    pick(data, rng, d, 'all', avoid) ??
    pick(data, rng, d, 'all', new Set());
  if (!c) throw new Error('No chart could be picked');
  return c;
}

/* ---------- scoring ---------- */

export const clampTo = (c: Chart, v: number) => Math.min(c.hi, Math.max(c.lo, v));
export function scoreGap(c: Chart, guess: number, real: number): number {
  return Math.round(100 * Math.exp(-(Math.abs(guess - real) / (c.hi - c.lo)) / 0.1));
}

/* ---------- sessions ---------- */

export interface Round {
  c: Chart;
  /** The player's value per gap (null until set). */
  guesses: (number | null)[];
  points: number[] | null;
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
const dailySeed = (day: number) => (Math.imul(day + 191, 2654435761) ^ 0x5a91_c3e7) >>> 0;

function addRound(s: Session, data: StatsData, avoid: ReadonlySet<string>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([
    ...(s.mode === 'daily' ? [] : avoid),
    ...s.rounds.map((r) => chartKey(r.c)),
  ]);
  const kind: Kind = s.rounds.length % 2 === 0 ? 'line' : 'bars';
  const topic = s.mode === 'daily' ? STAT_TOPICS[s.rounds.length % STAT_TOPICS.length]! : s.topic;
  const c = pickChart(data, rng, kind, s.difficulty, topic, used);
  const rounds = [...s.rounds, { c, guesses: c.gaps.map(() => null), points: null, score: null }];
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
  avoid: ReadonlySet<string> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, d, topic, limit, seed), data, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).points === null;
const withRound = (s: Session, r: Round): Session => ({
  ...s,
  rounds: [...s.rounds.slice(0, -1), r],
});

export function setGap(s: Session, i: number, v: number): Session {
  if (!awaiting(s)) throw new Error('The chart is locked');
  const r = current(s);
  if (!(i >= 0 && i < r.c.gaps.length) || !Number.isFinite(v)) throw new Error('Bad gap');
  const guesses = [...r.guesses];
  guesses[i] = clampTo(r.c, v);
  return withRound(s, { ...r, guesses });
}
export const allSet = (r: Round) => r.guesses.every((g) => g !== null);

export function lock(s: Session, data: StatsData): Session {
  if (!awaiting(s)) throw new Error('The chart is locked');
  const r = current(s);
  if (!allSet(r)) throw new Error('Set every gap first');
  const real = truth(data, r.c);
  const points = r.guesses.map((g, i) => scoreGap(r.c, g!, real[i]!));
  const score = Math.round(points.reduce((a, x) => a + x, 0) / points.length);
  const count = s.count + 1;
  return {
    ...withRound(s, { ...r, points, score }),
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}
export function next(s: Session, data: StatsData, avoid: ReadonlySet<string> = new Set()): Session {
  if (s.status !== 'playing' || current(s).points === null) throw new Error('Nothing to advance');
  return addRound(s, data, avoid);
}
export function finish(s: Session): Session {
  const rounds = current(s).points === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}
export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 80 ? '🟩' : n >= 50 ? '🟨' : n >= 25 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds
    .filter((r) => r.points)
    .map((r) => r.points!.map(sq).join(''))
    .join('\n')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, data?: StatsData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const okC = (c: Chart) =>
    typeof c === 'object' &&
    c !== null &&
    (c.kind === 'line' || c.kind === 'bars') &&
    INDICATOR_BY_CODE.has(c.code) &&
    [c.entity, c.year, c.length, c.lo, c.hi].every(isNum) &&
    c.hi > c.lo &&
    Array.isArray(c.countries) &&
    Array.isArray(c.gaps) &&
    c.gaps.length === GAPS &&
    c.gaps.every((g) => isNum(g) && g >= 0 && g < c.length) &&
    (!data || values(data, c).every(isNum));
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
        Array.isArray(r.guesses) &&
        r.guesses.length === GAPS &&
        r.guesses.every((g) => g === null || isNum(g)) &&
        (r.points === null ? r.score === null : Array.isArray(r.points) && isNum(r.score)),
    )
  );
}
