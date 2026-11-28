/**
 * Plot the Point rules (pure). A round is a real scatter chart: two World Bank indicators for
 * every country in one year, drawn as reference dots — except a few “mystery” countries, which the
 * player drags to where they think they belong. Each placement scores by its distance to the
 * true position in chart coordinates (the axes the player sees, log or linear). Sessions: a
 * five-chart daily challenge or an endless run. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { INDICATOR_BY_CODE, type Indicator } from '../shared/stats/indicators';
import { entityAt, type StatsData } from '../shared/stats/stats';

export interface Pair {
  x: string;
  y: string;
  xLog: boolean;
  yLog: boolean;
}

/** Indicator pairs that make meaningful scatter charts. */
export const PAIRS: Pair[] = [
  { x: 'NY.GDP.PCAP.KD', y: 'SP.DYN.LE00.IN', xLog: true, yLog: false },
  { x: 'NY.GDP.PCAP.KD', y: 'SP.DYN.TFRT.IN', xLog: true, yLog: false },
  { x: 'NY.GDP.PCAP.KD', y: 'SP.URB.TOTL.IN.ZS', xLog: true, yLog: false },
  { x: 'NY.GDP.PCAP.KD', y: 'IT.NET.USER.ZS', xLog: true, yLog: false },
  { x: 'NY.GDP.PCAP.KD', y: 'EN.GHG.CO2.PC.CE.AR5', xLog: true, yLog: true },
  { x: 'SP.DYN.TFRT.IN', y: 'SP.DYN.IMRT.IN', xLog: false, yLog: true },
  { x: 'SP.DYN.TFRT.IN', y: 'SP.POP.65UP.TO.ZS', xLog: false, yLog: false },
  { x: 'SP.POP.TOTL', y: 'ST.INT.ARVL', xLog: true, yLog: true },
  { x: 'NY.GDP.MKTP.CD', y: 'IS.AIR.PSGR', xLog: true, yLog: true },
  { x: 'SH.XPD.CHEX.GD.ZS', y: 'SP.DYN.LE00.IN', xLog: false, yLog: false },
  { x: 'EG.FEC.RNEW.ZS', y: 'EN.GHG.CO2.PC.CE.AR5', xLog: false, yLog: true },
  { x: 'SL.TLF.CACT.FE.ZS', y: 'SP.DYN.TFRT.IN', xLog: false, yLog: false },
  { x: 'NV.AGR.TOTL.ZS', y: 'SP.URB.TOTL.IN.ZS', xLog: false, yLog: false },
  { x: 'EG.USE.PCAP.KG.OE', y: 'EN.GHG.CO2.PC.CE.AR5', xLog: true, yLog: true },
  { x: 'SP.DYN.CBRT.IN', y: 'SP.DYN.CDRT.IN', xLog: false, yLog: false },
  { x: 'EG.ELC.ACCS.ZS', y: 'SP.DYN.IMRT.IN', xLog: false, yLog: true },
  { x: 'AG.YLD.CREL.KG', y: 'NV.AGR.TOTL.ZS', xLog: true, yLog: false },
  { x: 'NE.EXP.GNFS.ZS', y: 'NE.IMP.GNFS.ZS', xLog: true, yLog: true },
];

export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
/** Mystery countries per chart and the minimum population of the ones chosen. */
export const LEVELS: Record<Difficulty, { targets: number; minPop: number }> = {
  easy: { targets: 3, minPop: 30e6 },
  normal: { targets: 4, minPop: 8e6 },
  hard: { targets: 5, minPop: 0 },
};
export const MIN_COUNTRIES = 60;
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;
/** Distance (chart units, the plot being 1 × 1) at which a placement scores 100/e ≈ 37. */
export const SCALE = 0.15;

/* ---------- data access ---------- */

/** Value lookup: indicator code → entity → [first year, values]. */
const indexCache = new WeakMap<StatsData, Map<string, Map<number, [number, number[]]>>>();
function index(data: StatsData) {
  let m = indexCache.get(data);
  if (m) return m;
  m = new Map();
  for (const [ind, ent, start, values] of data.series) {
    const code = data.indicators[ind]!;
    if (data.entities[ent]![4] === 1) continue; // countries only
    let byEnt = m.get(code);
    if (!byEnt) m.set(code, (byEnt = new Map()));
    byEnt.set(ent, [start, values]);
  }
  indexCache.set(data, m);
  return m;
}

export function valueOf(data: StatsData, code: string, ent: number, year: number): number | null {
  const s = index(data).get(code)?.get(ent);
  if (!s) return null;
  const v = s[1][year - s[0]];
  return v === undefined ? null : v;
}

/** Countries with both values of a pair in a year (positive where the axis is logarithmic). */
export function countriesFor(data: StatsData, pair: Pair, year: number): number[] {
  const xs = index(data).get(pair.x);
  const out: number[] = [];
  if (!xs) return out;
  for (const ent of xs.keys()) {
    const x = valueOf(data, pair.x, ent, year);
    const y = valueOf(data, pair.y, ent, year);
    if (x === null || y === null || (pair.xLog && x <= 0) || (pair.yLog && y <= 0)) continue;
    out.push(ent);
  }
  return out.sort((a, b) => a - b);
}

const yearsCache = new WeakMap<StatsData, Map<number, number[]>>();
/** Years in which a pair has at least MIN_COUNTRIES countries. */
export function yearsFor(data: StatsData, p: number): number[] {
  let m = yearsCache.get(data);
  if (!m) yearsCache.set(data, (m = new Map()));
  const hit = m.get(p);
  if (hit) return hit;
  const out: number[] = [];
  for (let y = 1960; y <= 2025; y++)
    if (countriesFor(data, PAIRS[p]!, y).length >= MIN_COUNTRIES) out.push(y);
  m.set(p, out);
  return out;
}

export const indicatorOf = (code: string): Indicator => INDICATOR_BY_CODE.get(code)!;

/* ---------- charts ---------- */

export interface Chart {
  pair: number;
  year: number;
  /** Entity indices of the mystery countries. */
  targets: number[];
}

export interface Axis {
  lo: number;
  hi: number;
  log: boolean;
}
export interface Layout {
  x: Axis;
  y: Axis;
  /** Every country in the chart with its value pair. */
  points: { ent: number; x: number; y: number }[];
}

const tr = (v: number, log: boolean) => (log ? Math.log10(v) : v);
/** Normalised position (0–1) of a value on an axis. */
export const norm = (v: number, a: Axis) => (tr(v, a.log) - a.lo) / (a.hi - a.lo);
/** Value at a normalised position on an axis. */
export const denorm = (n: number, a: Axis) => {
  const t = a.lo + n * (a.hi - a.lo);
  return a.log ? Math.pow(10, t) : t;
};

export function layout(data: StatsData, c: Chart): Layout {
  const pair = PAIRS[c.pair]!;
  const points = countriesFor(data, pair, c.year).map((ent) => ({
    ent,
    x: valueOf(data, pair.x, ent, c.year)!,
    y: valueOf(data, pair.y, ent, c.year)!,
  }));
  const axis = (vals: number[], log: boolean): Axis => {
    const t = vals.map((v) => tr(v, log));
    const lo = Math.min(...t);
    const hi = Math.max(...t);
    const pad = (hi - lo || 1) * 0.06;
    return { lo: lo - pad, hi: hi + pad, log };
  };
  return {
    x: axis(
      points.map((p) => p.x),
      pair.xLog,
    ),
    y: axis(
      points.map((p) => p.y),
      pair.yLog,
    ),
    points,
  };
}

/** True normalised position of each mystery country. */
export function truth(data: StatsData, c: Chart): [number, number][] {
  const l = layout(data, c);
  return c.targets.map((ent) => {
    const p = l.points.find((q) => q.ent === ent)!;
    return [norm(p.x, l.x), norm(p.y, l.y)];
  });
}

export function pickChart(
  data: StatsData,
  rng: Rng,
  d: Difficulty,
  avoid: ReadonlySet<string> = new Set(),
): Chart {
  for (let attempt = 0; ; attempt++) {
    const p = rng.int(PAIRS.length);
    const years = yearsFor(data, p);
    if (!years.length) continue;
    const year = rng.pick(years);
    const ents = countriesFor(data, PAIRS[p]!, year);
    if (ents.length < MIN_COUNTRIES) continue;
    const lv = LEVELS[d];
    const pool = ents.filter((e) => (valueOf(data, 'SP.POP.TOTL', e, year) ?? 0) >= lv.minPop);
    if (pool.length < lv.targets * 2) continue;
    const targets = rng
      .shuffle(pool)
      .slice(0, lv.targets)
      .sort((a, b) => a - b);
    const c: Chart = { pair: p, year, targets };
    if (attempt < 50 && avoid.has(chartKey(c))) continue;
    return c;
  }
}

export const chartKey = (c: Chart) => `${c.pair}:${c.year}:${c.targets.join(',')}`;

/** Points for one placement: 100 · e^(−distance / 0.15), the chart being a unit square. */
export function placementScore(guess: [number, number], actual: [number, number]): number {
  const d = Math.hypot(guess[0] - actual[0], guess[1] - actual[1]);
  return Math.round(100 * Math.exp(-d / SCALE));
}

/* ---------- sessions ---------- */

export interface Round {
  c: Chart;
  guesses: [number, number][] | null;
  scores: number[] | null;
  score: number | null;
}

export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
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
const dailySeed = (day: number) => (Math.imul(day + 53, 2654435761) ^ 0x3a7c_11f5) >>> 0;

function addRound(s: Session, data: StatsData, avoid: ReadonlySet<string>): Session {
  const rng = new Rng(s.rng);
  const used = new Set([...avoid, ...s.rounds.map((r) => chartKey(r.c))]);
  const lastPair = s.rounds.length ? s.rounds[s.rounds.length - 1]!.c.pair : -1;
  let c = pickChart(data, rng, s.difficulty, used);
  for (let k = 0; k < 10 && c.pair === lastPair; k++) c = pickChart(data, rng, s.difficulty, used);
  const rounds = [...s.rounds, { c, guesses: null, scores: null, score: null }];
  return { ...s, rng: rng.state, rounds: rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  d: Difficulty,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: d,
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}

export const newDaily = (data: StatsData, day: number) =>
  addRound(base('daily', day, 'normal', DAILY_ROUNDS, dailySeed(day)), data, new Set());
export const newEndless = (
  data: StatsData,
  seed: number,
  d: Difficulty,
  avoid: ReadonlySet<string> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, d, limit, seed), data, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).guesses === null;

/** Scores a full set of placements (normalised [x, y] per mystery country, inside the plot). */
export function submit(s: Session, data: StatsData, guesses: [number, number][]): Session {
  if (!awaiting(s)) throw new Error('No chart is waiting for placements');
  const r = current(s);
  if (guesses.length !== r.c.targets.length) throw new Error('Place every mystery country');
  if (guesses.some((g) => g.length !== 2 || g.some((v) => !(v >= 0 && v <= 1))))
    throw new Error('Placements must lie inside the plot');
  const real = truth(data, r.c);
  const scores = guesses.map((g, i) => placementScore(g, real[i]!));
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...r, guesses, scores, score }],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

export function next(s: Session, data: StatsData, avoid: ReadonlySet<string> = new Set()): Session {
  if (s.status !== 'playing' || current(s).guesses === null) throw new Error('Nothing to advance');
  return addRound(s, data, avoid);
}

export function finish(s: Session): Session {
  const rounds = current(s).guesses === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 80 ? '🟩' : n >= 60 ? '🟨' : n >= 35 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => sq(r.score ?? 0)).join('')}`;
}

export const countryName = (data: StatsData, ent: number, lang: 'en' | 'es') =>
  entityAt(data, ent).name[lang];

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        isNum(r.c?.pair) &&
        r.c.pair >= 0 &&
        r.c.pair < PAIRS.length &&
        isNum(r.c.year) &&
        Array.isArray(r.c.targets) &&
        r.c.targets.length > 0 &&
        r.c.targets.every(isNum) &&
        (r.guesses === null
          ? r.score === null
          : Array.isArray(r.guesses) &&
            r.guesses.length === r.c.targets.length &&
            r.guesses.every(
              (g) =>
                Array.isArray(g) && g.length === 2 && g.every((x) => isNum(x) && x >= 0 && x <= 1),
            ) &&
            isNum(r.score)),
    )
  );
}
