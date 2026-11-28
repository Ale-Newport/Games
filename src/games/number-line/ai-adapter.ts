/**
 * The AI environment: a session of boards (config `{ difficulty, topic, boards }`, default five
 * Normal boards). Action i·201 + k places mystery country i at position k / 200 of the line;
 * LOCK (603) locks the board once all three are placed. Observations hold the indicator, the year,
 * the line, the reference countries with their positions and the mystery countries — never their
 * values.
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
import wdi from '../shared/stats/wdi.json';
import {
  allPlaced,
  byPopulation,
  current,
  isSession,
  lock,
  newEndless,
  next,
  place,
  positionOf,
  TARGETS,
  type Axis,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = wdi as unknown as StatsData;
export const BINS = 200;
export const LOCK = TARGETS * (BINS + 1);

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  boards?: number;
}
export interface Observation {
  board: number;
  total: number;
  code: string;
  year: number;
  axis: Axis;
  refs: { entity: number; position: number }[];
  targets: number[];
  placed: (number | null)[];
}

export function observe(s: Session): Observation {
  const b = current(s);
  return {
    board: s.count,
    total: s.total,
    code: b.code,
    year: b.year,
    axis: { ...b.axis },
    refs: b.refs.map((e) => ({
      entity: e,
      position: positionOf(b.axis, valueOf(DATA, b.code, e, b.year)!),
    })),
    targets: [...b.targets],
    placed: [...b.placed],
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
  if (allPlaced(current(s))) out.push(LOCK);
  return out;
};

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'number-line',
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
      c?.boards ?? 5,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: legal,
  applyAction: (s, a) => {
    if (
      done(s) ||
      !Number.isInteger(a) ||
      a < 0 ||
      a > LOCK ||
      (a === LOCK && !allPlaced(current(s)))
    )
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    if (a === LOCK) {
      const n = lock(s, DATA);
      return n.status === 'playing' ? next(n, DATA) : n;
    }
    return place(s, Math.floor(a / (BINS + 1)), (a % (BINS + 1)) / BINS);
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Number Line session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) =>
    a === LOCK
      ? 'lock'
      : `country ${Math.floor(a / (BINS + 1)) + 1} at ${((a % (BINS + 1)) / BINS).toFixed(3)}`,
};

/* ---------- agents ---------- */

/** Places each country in turn at its planned position, then locks. */
function act(o: Observation, plan: number[]): number {
  for (let i = 0; i < TARGETS; i++) {
    const k = Math.round(Math.min(1, Math.max(0, plan[i]!)) * BINS);
    if (o.placed[i] === null || Math.abs(o.placed[i]! - k / BINS) > 1e-9) return i * (BINS + 1) + k;
  }
  return LOCK;
}

class Middle implements Agent<Session, number> {
  readonly id = 'middle';
  readonly label = 'Middle reference';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    return act(
      o,
      o.targets.map(() => o.refs[1]!.position),
    );
  }
}

/** Feature for similarity: log for money and counts, so ratios count rather than differences. */
function feature(code: string, e: number, year: number): number | null {
  const v = valueOf(DATA, code, e, year);
  if (v === null) return null;
  const ind = INDICATORS.find((i) => i.code === code)!;
  if (ind.format === 'money' || ind.format === 'count') return v > 0 ? Math.log10(v) : null;
  return v;
}

/**
 * Neighbours: for each mystery country, the five countries most like it on the *other*
 * indicators that year (standardised), whose positions on this line are averaged. The board's own
 * indicator is never read for the mystery countries.
 */
export function neighbourPositions(o: Observation): number[] {
  const others = INDICATORS.map((i) => i.code).filter((c) => c !== o.code);
  const peers = byPopulation(DATA).filter(
    (e) => !o.targets.includes(e) && valueOf(DATA, o.code, e, o.year) !== null,
  );
  const stats = new Map<string, { mean: number; sd: number }>();
  for (const code of others) {
    const vals = peers.map((e) => feature(code, e, o.year)).filter((v): v is number => v !== null);
    if (vals.length < 30) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
    stats.set(code, { mean, sd });
  }
  return o.targets.map((t) => {
    const dist = peers
      .map((e) => {
        let d = 0;
        let n = 0;
        for (const [code, st] of stats) {
          const a = feature(code, t, o.year);
          const b = feature(code, e, o.year);
          if (a === null || b === null) continue;
          d += ((a - b) / st.sd) ** 2;
          n++;
        }
        return [e, n >= 5 ? d / n : Infinity] as const;
      })
      .filter(([, d]) => Number.isFinite(d))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
    if (!dist.length) return o.refs[1]!.position;
    return (
      dist.reduce((acc, [e]) => acc + positionOf(o.axis, valueOf(DATA, o.code, e, o.year)!), 0) /
      dist.length
    );
  });
}

class Neighbours implements Agent<Session, number> {
  readonly id = 'neighbours';
  readonly label = 'Similar countries';
  private cache = new Map<string, number[]>();
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    const key = `${o.code}:${o.year}:${o.targets.join(',')}`;
    let plan = this.cache.get(key);
    if (!plan) this.cache.set(key, (plan = neighbourPositions(o)));
    return act(o, plan);
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Random placements.', es: 'Colocaciones al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'middle',
    kind: 'heuristic',
    label: { en: 'Middle reference', es: 'Referencia central' },
    description: {
      en: 'Puts every mystery country on the middle reference.',
      es: 'Pone todos los países misteriosos sobre la referencia central.',
    },
    create: () => new Middle(),
  },
  {
    id: 'neighbours',
    kind: 'search',
    label: { en: 'Similar countries', es: 'Países parecidos' },
    description: {
      en: 'Finds the countries most like each mystery country on other indicators and uses where they sit on this line.',
      es: 'Busca los países más parecidos a cada país misterioso en otros indicadores y usa dónde están en esta línea.',
    },
    create: () => new Neighbours(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
