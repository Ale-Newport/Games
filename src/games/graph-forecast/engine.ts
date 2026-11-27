/**
 * Graph Forecast rules (pure). A round shows a window of a real World Bank series with its last
 * years hidden; the player draws how it continues, and the drawing is scored against the real
 * values. Sessions are the five-graph daily challenge or an endless run. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { blendForecast, type Method } from '../shared/stats/forecast';
import type { StatTopic } from '../shared/stats/indicators';
import {
  niceRange,
  seriesAt,
  seriesWhere,
  type Series,
  type StatsData,
} from '../shared/stats/stats';

export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
export type Topic = StatTopic | 'all';
export const TOPICS: Topic[] = [
  'all',
  'economy',
  'people',
  'health',
  'environment',
  'technology',
  'society',
];

export const DAILY_ROUNDS = 5;
/** Rounds kept in an endless session's history (older ones only count in the totals). */
const KEEP_ROUNDS = 12;

interface Level {
  /** Window length range in years. */
  window: [number, number];
  /** Share of the window that is hidden. */
  hidden: number;
  /** Most volatile indicators allowed (1 smooth … 3 volatile). */
  volatility: 1 | 2 | 3;
}
export const LEVELS: Record<Difficulty, Level> = {
  easy: { window: [20, 30], hidden: 0.2, volatility: 1 },
  normal: { window: [20, 40], hidden: 0.3, volatility: 2 },
  hard: { window: [25, 60], hidden: 0.4, volatility: 3 },
};

/** One graph: series `s`, window values[from..to], hidden from `cut` on, y axis [lo, hi]. */
export interface Challenge {
  s: number;
  from: number;
  to: number;
  cut: number;
  lo: number;
  hi: number;
}

export interface Round {
  c: Challenge;
  /** The player's forecast for each hidden year (null until submitted). */
  pred: number[] | null;
  score: number | null;
  /** The computer forecaster's leading method and its score on the same graph. */
  cpuMethod: Method | null;
  cpu: number | null;
}

export interface Session {
  mode: 'daily' | 'endless';
  /** Daily challenge number (days since 2026-01-01), or -1. */
  day: number;
  difficulty: Difficulty;
  topic: Topic;
  /** Rounds in the session; 0 = endless. */
  limit: number;
  rng: RngState;
  rounds: Round[];
  /** Rounds scored and their total (all rounds, including trimmed history). */
  count: number;
  total: number;
  status: 'playing' | 'done';
}

const EPOCH = Date.UTC(2026, 0, 1);
/** Daily challenge number for a local date (0 = 1 January 2026). */
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 1, 2654435761) ^ 0x2310_f0ca) >>> 0;

/** Series that can be played at a difficulty and topic. */
export function pool(data: StatsData, difficulty: Difficulty, topic: Topic): number[] {
  const lv = LEVELS[difficulty];
  return seriesWhere(
    data,
    `gf:${difficulty}:${topic}`,
    (ind, len) =>
      len >= lv.window[0] &&
      ind.volatility <= lv.volatility &&
      (topic === 'all' || ind.topic === topic),
  );
}

export const windowValues = (series: Series, c: Challenge) => series.values.slice(c.from, c.to + 1);
export const visibleValues = (series: Series, c: Challenge) => series.values.slice(c.from, c.cut);
export const hiddenValues = (series: Series, c: Challenge) => series.values.slice(c.cut, c.to + 1);
export const hiddenCount = (c: Challenge) => c.to - c.cut + 1;
export const yearOf = (series: Series, index: number) => series.start + index;

/**
 * Picks a graph: a random playable series (avoiding `avoid` while possible), a window of it (half
 * the time ending at the latest year) and a y axis padded by a random amount on each side so the
 * real extremes never sit predictably on the frame.
 */
export function pickChallenge(
  data: StatsData,
  rng: Rng,
  difficulty: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
): Challenge {
  const lv = LEVELS[difficulty];
  let ids = pool(data, difficulty, topic);
  if (!ids.length) ids = pool(data, difficulty, 'all');
  const fresh = avoid.size ? ids.filter((i) => !avoid.has(i)) : ids;
  if (fresh.length) ids = fresh;
  for (let attempt = 0; ; attempt++) {
    const s = rng.pick(ids);
    const series = seriesAt(data, s);
    const len = series.values.length;
    const L = rng.range(lv.window[0], Math.max(lv.window[0], Math.min(lv.window[1], len)));
    const to = rng.chance(0.5) ? len - 1 : rng.range(L - 1, len - 1);
    const from = to - L + 1;
    const h = Math.max(4, Math.round(L * lv.hidden));
    const cut = to - h + 1;
    const w = series.values.slice(from, to + 1);
    const lo = Math.min(...w);
    const hi = Math.max(...w);
    const scale = Math.max(Math.abs(lo), Math.abs(hi));
    // A window where the line barely moves is not a fair graph; try another (bounded).
    if (attempt < 200 && (hi - lo < 0.03 * scale || hi === lo)) continue;
    const span = hi - lo || Math.abs(hi) || 1;
    let aLo = lo - span * (0.12 + rng.float() * 0.45);
    let aHi = hi + span * (0.12 + rng.float() * 0.45);
    const ind = series.indicator;
    if (!ind.signed && lo >= 0) aLo = Math.max(0, aLo);
    if (ind.max !== undefined && hi <= ind.max) aHi = Math.min(ind.max, aHi);
    [aLo, aHi] = niceRange(aLo, aHi);
    if (!ind.signed && lo >= 0) aLo = Math.max(0, aLo);
    if (ind.max !== undefined && hi <= ind.max) aHi = Math.min(ind.max, aHi);
    return { s, from, to, cut, lo: aLo, hi: aHi };
  }
}

/**
 * Round score 0–100 from the mean distance between forecast and reality, measured as a share of
 * the chart height: 1 % off → 90, 5 % → 61, 10 % → 37, 25 % → 8.
 */
export function scoreForecast(
  c: Challenge,
  pred: readonly number[],
  actual: readonly number[],
): number {
  const span = c.hi - c.lo;
  let err = 0;
  for (let i = 0; i < actual.length; i++) err += Math.abs(pred[i]! - actual[i]!);
  const share = err / actual.length / span;
  return Math.round(100 * Math.exp(-share / 0.1));
}

export const clampTo = (c: Challenge, v: number) => Math.min(c.hi, Math.max(c.lo, v));

/**
 * The computer's forecast: a blend of eight simple methods weighted by how well each one would
 * have predicted the visible data's own recent past. It never sees the hidden years.
 */
export function computerForecast(series: Series, c: Challenge): { method: Method; pred: number[] } {
  const { pred, lead } = blendForecast(visibleValues(series, c), hiddenCount(c), c.hi - c.lo);
  return { method: lead, pred: pred.map((v) => clampTo(c, v)) };
}

/* ---------- drawing → prediction ---------- */

/** A forecast being drawn: one value (or null) per hidden year. */
export type Draft = (number | null)[];

export const emptyDraft = (c: Challenge): Draft =>
  Array.from({ length: hiddenCount(c) }, () => null);

/**
 * Adds one pointer segment, in data coordinates (x = window index as a float, y = value), to the
 * draft: every hidden year it crosses takes the interpolated value, and the year nearest the
 * segment's end takes its end value (so slow, vertical strokes still register).
 */
export function drawSegment(
  c: Challenge,
  draft: Draft,
  p0: { x: number; y: number } | null,
  p1: { x: number; y: number },
): Draft {
  const out = draft.slice();
  const first = c.cut - c.from;
  const set = (x: number, y: number) => {
    const i = x - first;
    if (i >= 0 && i < out.length) out[i] = clampTo(c, y);
  };
  if (p0) {
    const a = Math.min(p0.x, p1.x);
    const b = Math.max(p0.x, p1.x);
    for (let x = Math.ceil(a); x <= Math.floor(b); x++) {
      const k = p1.x === p0.x ? 1 : (x - p0.x) / (p1.x - p0.x);
      set(x, p0.y + (p1.y - p0.y) * k);
    }
  }
  set(Math.round(p1.x), p1.y);
  return out;
}

/**
 * The full forecast from a draft, or null while the last hidden year is missing. Years before the
 * first drawn one are joined to the last visible point; gaps in between are joined linearly.
 */
export function completeDraft(c: Challenge, draft: Draft, lastVisible: number): number[] | null {
  if (draft.length !== hiddenCount(c) || draft[draft.length - 1] == null) return null;
  const out: number[] = [];
  let prevI = -1;
  let prevV = lastVisible;
  for (let i = 0; i < draft.length; i++) {
    const v = draft[i];
    if (v == null) continue;
    for (let j = prevI + 1; j < i; j++) out[j] = prevV + ((v - prevV) * (j - prevI)) / (i - prevI);
    out[i] = v;
    prevI = i;
    prevV = v;
  }
  return out.map((v) => clampTo(c, v));
}

/* ---------- sessions ---------- */

function addRound(s: Session, data: StatsData, avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  const used = new Set([...avoid, ...s.rounds.map((r) => r.c.s)]);
  const c = pickChallenge(data, rng, s.difficulty, s.topic, used);
  const rounds = [...s.rounds, { c, pred: null, score: null, cpuMethod: null, cpu: null }];
  return { ...s, rng: rng.state, rounds: rounds.slice(-KEEP_ROUNDS) };
}

export function newDaily(data: StatsData, day: number): Session {
  const s: Session = {
    mode: 'daily',
    day,
    difficulty: 'normal',
    topic: 'all',
    limit: DAILY_ROUNDS,
    rng: new Rng(dailySeed(day)).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
  return addRound(s, data, new Set());
}

export function newEndless(
  data: StatsData,
  seed: number,
  difficulty: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
): Session {
  const s: Session = {
    mode: 'endless',
    day: -1,
    difficulty,
    topic,
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
  return addRound(s, data, avoid);
}

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaitingForecast = (s: Session) => s.status === 'playing' && current(s).pred === null;

/** Scores the forecast for the current graph (and the computer's). Throws on a bad forecast. */
export function submit(s: Session, data: StatsData, pred: readonly number[]): Session {
  if (!awaitingForecast(s)) throw new Error('No graph is waiting for a forecast');
  const r = current(s);
  const series = seriesAt(data, r.c.s);
  if (pred.length !== hiddenCount(r.c) || pred.some((v) => !Number.isFinite(v)))
    throw new Error('A forecast needs one finite value per hidden year');
  const p = pred.map((v) => clampTo(r.c, v));
  const actual = hiddenValues(series, r.c);
  const score = scoreForecast(r.c, p, actual);
  const cpu = computerForecast(series, r.c);
  const done: Round = {
    ...r,
    pred: p,
    score,
    cpuMethod: cpu.method,
    cpu: scoreForecast(r.c, cpu.pred, actual),
  };
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), done],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

/** Deals the next graph after a scored one. */
export function next(s: Session, data: StatsData, avoid: ReadonlySet<number> = new Set()): Session {
  if (s.status !== 'playing' || current(s).pred === null) throw new Error('Nothing to advance');
  return addRound(s, data, avoid);
}

/** Ends an endless session (the current unscored graph, if any, is dropped). */
export function finish(s: Session): Session {
  const rounds = current(s).pred === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

/** Share text: day, total and one square per round by score. */
export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 90 ? '🟩' : n >= 70 ? '🟨' : n >= 40 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => sq(r.score ?? 0)).join('')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
function isChallenge(c: unknown, data?: StatsData): c is Challenge {
  if (typeof c !== 'object' || c === null) return false;
  const x = c as Challenge;
  if (![x.s, x.from, x.to, x.cut, x.lo, x.hi].every(isNum)) return false;
  if (!(x.from < x.cut && x.cut <= x.to && x.lo < x.hi)) return false;
  if (data) {
    const row = data.series[x.s];
    if (!row || x.to >= row[3].length || x.from < 0) return false;
  }
  return true;
}

export function isSession(v: unknown, data?: StatsData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    isNum(s.day) &&
    isNum(s.limit) &&
    isNum(s.count) &&
    isNum(s.total) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        isChallenge(r.c, data) &&
        (r.pred === null ||
          (Array.isArray(r.pred) &&
            r.pred.length === hiddenCount(r.c) &&
            r.pred.every(isNum) &&
            isNum(r.score))),
    )
  );
}
