/**
 * The AI environment: a session of charts (config `{ difficulty, topic, rounds }`, default five
 * Normal charts, line and bars in turn). Action i·101 + k sets gap i to k % of the chart height;
 * LOCK (303) locks the chart once every gap is set. Observations hold the chart (kind, indicator,
 * country or year, countries, axis), every visible value and the hidden positions — never the
 * hidden values.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { valueOf } from '../plot-the-point/engine';
import { INDICATORS } from '../shared/stats/indicators';
import type { StatsData } from '../shared/stats/stats';
import raw from '../shared/stats/wdi.json';
import {
  allSet,
  byPopulation,
  current,
  GAPS,
  isSession,
  lock,
  newEndless,
  next,
  setGap,
  values,
  type Chart,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = raw as unknown as StatsData;
export const STEPS = 100;
export const LOCK = GAPS * (STEPS + 1);

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  chart: Omit<Chart, never>;
  /** Visible values in chart order, null at the gaps. */
  visible: (number | null)[];
  guesses: (number | null)[];
}

export function observe(s: Session): Observation {
  const r = current(s);
  const v = values(DATA, r.c);
  return {
    round: s.count,
    total: s.total,
    chart: { ...r.c, countries: [...r.c.countries], gaps: [...r.c.gaps] },
    visible: v.map((x, k) => (r.c.gaps.includes(k) ? null : x)),
    guesses: [...r.guesses],
  };
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}
const legal = (s: Session) => {
  if (done(s)) return [];
  const out = Array.from({ length: LOCK }, (_, a) => a);
  if (allSet(current(s))) out.push(LOCK);
  return out;
};

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'gap-graph',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: true,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newEndless(
      DATA,
      seed >>> 0,
      c?.difficulty ?? 'normal',
      c?.topic ?? 'all',
      new Set(),
      c?.rounds ?? 5,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: legal,
  applyAction: (s, a) => {
    if (!legal(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    if (a === LOCK) {
      const n = lock(s, DATA);
      return n.status === 'playing' ? next(n, DATA) : n;
    }
    const c = current(s).c;
    return setGap(
      s,
      Math.floor(a / (STEPS + 1)),
      c.lo + ((a % (STEPS + 1)) / STEPS) * (c.hi - c.lo),
    );
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Gap Graph session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) =>
    a === LOCK ? 'lock' : `gap ${Math.floor(a / (STEPS + 1)) + 1} at ${a % (STEPS + 1)} %`,
};

/* ---------- agents ---------- */

/** Sets each gap to its planned value in turn, then locks. */
function act(o: Observation, plan: number[]): number {
  const c = o.chart;
  for (let i = 0; i < GAPS; i++) {
    const k = Math.round(
      ((Math.min(c.hi, Math.max(c.lo, plan[i]!)) - c.lo) / (c.hi - c.lo)) * STEPS,
    );
    const want = c.lo + (k / STEPS) * (c.hi - c.lo);
    if (o.guesses[i] === null || Math.abs(o.guesses[i]! - want) > 1e-9 * (c.hi - c.lo))
      return i * (STEPS + 1) + k;
  }
  return LOCK;
}

/** Straight lines between the nearest visible years (lines); the mean of the visible bars (bars). */
export function straightPlan(o: Observation): number[] {
  const v = o.visible;
  if (o.chart.kind === 'bars') {
    const seen = v.filter((x): x is number => x !== null);
    const mean = seen.reduce((a, x) => a + x, 0) / seen.length;
    return o.chart.gaps.map(() => mean);
  }
  return o.chart.gaps.map((g) => {
    let a = g - 1;
    while (a >= 0 && v[a] === null) a--;
    let b = g + 1;
    while (b < v.length && v[b] === null) b++;
    if (a < 0) return v[b]!;
    if (b >= v.length) return v[a]!;
    return v[a]! + ((v[b]! - v[a]!) * (g - a)) / (b - a);
  });
}

const feature = (code: string, e: number, year: number): number | null => {
  const v = valueOf(DATA, code, e, year);
  if (v === null) return null;
  const ind = INDICATORS.find((i) => i.code === code)!;
  if (ind.format === 'money' || ind.format === 'count') return v > 0 ? Math.log10(v) : null;
  return v;
};

/**
 * The analyst: straight lines for line charts; for a hidden bar, the five countries most like it
 * on the *other* indicators that year (standardised) give its value on this one — the hidden bars'
 * own values on this indicator are never read.
 */
export function analystPlan(o: Observation): number[] {
  const c = o.chart;
  if (c.kind === 'line') return straightPlan(o);
  const hidden = c.gaps.map((g) => c.countries[g]!);
  const peers = byPopulation(DATA).filter(
    (e) => !hidden.includes(e) && valueOf(DATA, c.code, e, c.year) !== null,
  );
  const codes = INDICATORS.map((i) => i.code).filter((x) => x !== c.code);
  const stats = new Map<string, number>();
  for (const code of codes) {
    const vals = peers.map((e) => feature(code, e, c.year)).filter((v): v is number => v !== null);
    if (vals.length < 30) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    stats.set(code, Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1);
  }
  const fallback = straightPlan(o);
  return hidden.map((t, i) => {
    const near = peers
      .map((e) => {
        let d = 0;
        let n = 0;
        for (const [code, sd] of stats) {
          const a = feature(code, t, c.year);
          const b = feature(code, e, c.year);
          if (a === null || b === null) continue;
          d += ((a - b) / sd) ** 2;
          n++;
        }
        return [e, n >= 5 ? d / n : Infinity] as const;
      })
      .filter(([, d]) => Number.isFinite(d))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
    if (!near.length) return fallback[i]!;
    return near.reduce((a, [e]) => a + valueOf(DATA, c.code, e, c.year)!, 0) / near.length;
  });
}

class Planner implements Agent<Session, number> {
  private cache = new Map<string, number[]>();
  constructor(
    readonly id: string,
    readonly label: string,
    private plan: (o: Observation) => number[],
  ) {}
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    const key = `${s.count}:${o.chart.code}:${o.chart.entity}:${o.chart.year}`;
    let p = this.cache.get(key);
    if (!p) this.cache.set(key, (p = this.plan(o)));
    return act(o, p);
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Random values.', es: 'Valores al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'straight',
    kind: 'heuristic',
    label: { en: 'Straight lines', es: 'Líneas rectas' },
    description: {
      en: 'Joins the visible years with straight lines; gives hidden bars the average of the visible ones.',
      es: 'Une los años visibles con líneas rectas; da a las barras ocultas la media de las visibles.',
    },
    create: () => new Planner('straight', 'Straight lines', straightPlan),
  },
  {
    id: 'analyst',
    kind: 'search',
    label: { en: 'Analyst', es: 'Analista' },
    description: {
      en: 'Straight lines for years; for a hidden bar, the value of the countries most like it on other indicators.',
      es: 'Líneas rectas para los años; para una barra oculta, el valor de los países más parecidos en otros indicadores.',
    },
    create: () => new Planner('analyst', 'Analyst', analystPlan),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
