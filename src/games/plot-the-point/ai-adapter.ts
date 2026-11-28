/**
 * The AI environment: a session of charts (config `{ difficulty, rounds }`, default five Normal
 * charts). Mystery countries are placed one at a time: action a puts the next one at the centre
 * of cell (a mod 25, a div 25) of a 25 × 25 grid over the plot; the last placement scores the
 * chart. Observations hold what the player sees — the visible countries' positions, the mystery
 * countries' names — never the mystery positions.
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
import raw from '../shared/stats/wdi.json';
import type { StatsData } from '../shared/stats/stats';
import {
  current,
  isSession,
  layout,
  newEndless,
  next,
  norm,
  PAIRS,
  submit,
  type Difficulty,
  type Session,
} from './engine';
import { centroidPlacements, computerPlacements } from './neighbours';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const DATA = raw as unknown as StatsData;
export const GRID = 25;

export interface State {
  s: Session;
  /** Placements made so far on the current chart. */
  pending: [number, number][];
}
export interface Config {
  difficulty?: Difficulty;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  x: string;
  y: string;
  year: number;
  /** Visible countries: [entity, x, y] in plot units. */
  context: [number, number, number][];
  targets: number[];
  placed: [number, number][];
}

export function observe(st: State): Observation {
  const c = current(st.s).c;
  const l = layout(DATA, c);
  return {
    round: st.s.count,
    total: st.s.total,
    x: PAIRS[c.pair]!.x,
    y: PAIRS[c.pair]!.y,
    year: c.year,
    context: l.points
      .filter((p) => !c.targets.includes(p.ent))
      .map((p) => [p.ent, norm(p.x, l.x), norm(p.y, l.y)]),
    targets: [...c.targets],
    placed: st.pending.map((p) => [...p] as [number, number]),
  };
}

export const cellCentre = (a: number): [number, number] => [
  ((a % GRID) + 0.5) / GRID,
  (Math.floor(a / GRID) + 0.5) / GRID,
];
export const cellOf = ([x, y]: [number, number]) =>
  Math.min(GRID - 1, Math.floor(y * GRID)) * GRID + Math.min(GRID - 1, Math.floor(x * GRID));

const done = (st: State) => st.s.status === 'done';
function outcome(st: State): Outcome | null {
  if (!done(st)) return null;
  return {
    returns: [st.s.total],
    winners: [0],
    draw: false,
    scores: [st.s.total],
    reason: 'complete',
  };
}

export const env: GameEnvironment<State, number, Observation, Config> = {
  id: 'plot-the-point',
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
  createInitialState: (c, seed) => ({
    s: newEndless(DATA, seed >>> 0, c?.difficulty ?? 'normal', new Set(), c?.rounds ?? 5),
    pending: [],
  }),
  reset: (seed) => ({ s: newEndless(DATA, seed >>> 0, 'normal', new Set(), 5), pending: [] }),
  getObservation: (st) => observe(st),
  getLegalActions: (st) => (done(st) ? [] : Array.from({ length: GRID * GRID }, (_, i) => i)),
  applyAction: (st, a) => {
    if (done(st) || !Number.isInteger(a) || a < 0 || a >= GRID * GRID)
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const pending = [...st.pending, cellCentre(a)];
    if (pending.length < current(st.s).c.targets.length) return { s: st.s, pending };
    const scored = submit(st.s, DATA, pending);
    return { s: scored.status === 'done' ? scored : next(scored, DATA), pending: [] };
  },
  getCurrentPlayer: (st) => (done(st) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (st) => outcome(st)?.returns[0] ?? 0,
  serializeState: (st) => JSON.stringify(st),
  deserializeState: (d) => {
    const parsed = JSON.parse(d) as State;
    if (!isSession(parsed?.s) || !Array.isArray(parsed.pending))
      throw new Error('Invalid Plot the Point state');
    return parsed;
  },
  cloneState: (st) => structuredClone(st),
  actionToString: (a) => `cell ${a % GRID},${Math.floor(a / GRID)}`,
};

/** Places each mystery country where a placement strategy puts it. */
class Strategy implements Agent<State, number> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly place: (c: Parameters<typeof computerPlacements>[1]) => [number, number][],
  ) {}
  selectAction(_e: GameEnvironment<State, number>, st: State) {
    const all = this.place(current(st.s).c);
    return cellOf(all[st.pending.length]!);
  }
}

export const AGENT_PRESETS: AgentPreset<State, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Anywhere on the chart.', es: 'En cualquier punto de la gráfica.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'centroid',
    kind: 'heuristic',
    label: { en: 'Middle of the crowd', es: 'En medio del grupo' },
    description: {
      en: 'Puts every mystery country at the centre of the visible ones.',
      es: 'Pone cada país misterioso en el centro de los visibles.',
    },
    create: () =>
      new Strategy('centroid', 'Middle of the crowd', (c) => centroidPlacements(DATA, c)),
  },
  {
    id: 'neighbours',
    kind: 'search',
    label: { en: 'Similar countries', es: 'Países parecidos' },
    description: {
      en: 'Finds the five visible countries most alike on other indicators and places it among them.',
      es: 'Busca los cinco países visibles más parecidos en otros indicadores y lo coloca entre ellos.',
    },
    create: () =>
      new Strategy('neighbours', 'Similar countries', (c) => computerPlacements(DATA, c)),
  },
];

export const bundle: AiBundle<State, number> = {
  env: env as unknown as AiBundle<State, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
