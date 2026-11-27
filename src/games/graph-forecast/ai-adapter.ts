/**
 * The AI environment: a session of graphs (config `{ difficulty, topic, rounds }`, default five
 * Normal graphs from every topic). The action picks the forecasting method used for the current
 * graph (or `blend`, the computer's weighted combination); the reward is the session total (0–100 per graph). Observations carry the visible part
 * of the series only — the hidden years are never exposed.
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
import { forecast, METHODS, type Method } from '../shared/stats/forecast';
import raw from '../shared/stats/wdi.json';
import { seriesAt, type StatsData } from '../shared/stats/stats';
import {
  clampTo,
  computerForecast,
  current,
  hiddenCount,
  isSession,
  newEndless,
  next,
  submit,
  visibleValues,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const DATA = raw as unknown as StatsData;

/** An action: one forecasting method for the current graph, or the computer's weighted blend. */
export type Choice = Method | 'blend';
export const CHOICES: Choice[] = [...METHODS, 'blend'];

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}

export interface Observation {
  round: number;
  rounds: number;
  total: number;
  indicator: string;
  entity: string;
  /** First visible year and the visible values. */
  firstYear: number;
  visible: number[];
  /** Number of hidden years to forecast. */
  hidden: number;
  axis: [number, number];
}

export function observe(s: Session): Observation {
  const r = current(s);
  const series = seriesAt(DATA, r.c.s);
  return {
    round: s.count,
    rounds: s.limit,
    total: s.total,
    indicator: series.indicator.code,
    entity: series.entity.iso3,
    firstYear: series.start + r.c.from,
    visible: visibleValues(series, r.c),
    hidden: hiddenCount(r.c),
    axis: [r.c.lo, r.c.hi],
  };
}

const done = (s: Session) => s.status === 'done';

function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, Choice, Observation, Config> = {
  id: 'graph-forecast',
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
  getLegalActions: (s) => (done(s) ? [] : [...CHOICES]),
  applyAction: (s, a) => {
    if (done(s) || !CHOICES.includes(a))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const r = current(s);
    const series = seriesAt(DATA, r.c.s);
    const pred =
      a === 'blend'
        ? computerForecast(series, r.c).pred
        : forecast(a, visibleValues(series, r.c), hiddenCount(r.c)).map((v) => clampTo(r.c, v));
    const scored = submit(s, DATA, pred);
    return scored.status === 'done' ? scored : next(scored, DATA);
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Graph Forecast session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

class Fixed implements Agent<Session, Choice> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly method: Choice,
  ) {}
  selectAction() {
    return this.method;
  }
}

export const AGENT_PRESETS: AgentPreset<Session, Choice>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random method', es: 'Método aleatorio' },
    description: {
      en: 'Picks one of the eight forecasting methods (or the blend) at random.',
      es: 'Elige al azar uno de los ocho métodos de pronóstico (o la combinación).',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'flat',
    kind: 'heuristic',
    label: { en: 'Flat line', es: 'Línea plana' },
    description: {
      en: 'Assumes nothing changes: repeats the last visible value.',
      es: 'Supone que nada cambia: repite el último valor visible.',
    },
    create: () => new Fixed('flat', 'Flat line', 'flat'),
  },
  {
    id: 'trend',
    kind: 'heuristic',
    label: { en: 'Recent trend', es: 'Tendencia reciente' },
    description: {
      en: 'Extends the straight line through the last five visible years.',
      es: 'Prolonga la recta de los cinco últimos años visibles.',
    },
    create: () => new Fixed('trend', 'Recent trend', 'linear-5'),
  },
  {
    id: 'forecaster',
    kind: 'search',
    label: { en: 'Forecaster', es: 'Pronosticador' },
    description: {
      en: 'The in-game computer: blends all eight methods, weighting each by how well it predicts the visible years it holds out.',
      es: 'El ordenador del juego: combina los ocho métodos, ponderando cada uno por lo bien que predice los años visibles que reserva.',
    },
    create: () => new Fixed('forecaster', 'Forecaster', 'blend'),
  },
];

export const bundle: AiBundle<Session, Choice> = {
  env: env as unknown as AiBundle<Session, Choice>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
