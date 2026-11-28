/**
 * The AI environment: a session of charts (config `{ difficulty, topic, rounds }`, default five
 * Normal charts). The action picks the curve drawn for the current chart — flat, follow the
 * world, similar countries, or a blend — and the reward is the session total (0–100 per chart).
 * Observations hold what a player sees: indicator, country, first year and value, the world's
 * curve and the axis — never the country's later values.
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
import type { StatsData } from '../shared/stats/stats';
import raw from '../shared/stats/wdi.json';
import {
  awaiting,
  current,
  describe,
  hiddenCount,
  isSession,
  newEndless,
  next,
  STRATEGIES,
  strategyCurve,
  submit,
  worldValues,
  yearOf,
  type Difficulty,
  type Session,
  type Strategy,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = raw as unknown as StatsData;

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  indicator: string;
  entity: string;
  firstYear: number;
  first: number;
  world: (number | null)[];
  hidden: number;
  axis: [number, number];
}

export function observe(s: Session): Observation {
  const c = current(s).c;
  const { indicator, entity } = describe(DATA, c);
  return {
    round: s.count,
    total: s.total,
    indicator: indicator.code,
    entity: entity.iso3,
    firstYear: yearOf(DATA, c, 0),
    first: DATA.series[c.s]![3][c.from]!,
    world: worldValues(DATA, c),
    hidden: hiddenCount(c),
    axis: [c.lo, c.hi],
  };
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}
const ACTIONS = STRATEGIES.map((_, i) => i);

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'trend-draw',
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
  getLegalActions: (s) => (done(s) ? [] : ACTIONS),
  applyAction: (s, a) => {
    if (done(s) || !awaiting(s) || !ACTIONS.includes(a))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = submit(s, DATA, strategyCurve(DATA, current(s).c, STRATEGIES[a]!));
    return n.status === 'playing' ? next(n, DATA) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Trend Draw session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => STRATEGIES[a] ?? `action ${a}`,
};

const fixed = (id: string, label: string, st: Strategy): Agent<Session, number> => ({
  id,
  label,
  selectAction: () => STRATEGIES.indexOf(st),
});

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Picks any of the four curves.',
      es: 'Elige cualquiera de las cuatro curvas.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'flat',
    kind: 'heuristic',
    label: { en: 'Flat line', es: 'Línea plana' },
    description: {
      en: 'Keeps the first value all along.',
      es: 'Mantiene el primer valor todo el rato.',
    },
    create: () => fixed('flat', 'Flat line', 'flat'),
  },
  {
    id: 'world',
    kind: 'heuristic',
    label: { en: 'Follow the world', es: 'Sigue al mundo' },
    description: {
      en: 'Applies the world curve’s changes to the country’s first value.',
      es: 'Aplica los cambios de la curva mundial al primer valor del país.',
    },
    create: () => fixed('world', 'Follow the world', 'world'),
  },
  {
    id: 'peers',
    kind: 'search',
    label: { en: 'Similar countries', es: 'Países parecidos' },
    description: {
      en: 'Averages the paths of the eight countries that started at the most similar level on this indicator.',
      es: 'Promedia la evolución de los ocho países que empezaron en el nivel más parecido en este indicador.',
    },
    create: () => fixed('peers', 'Similar countries', 'peers'),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
