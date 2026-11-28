/**
 * The AI environment: one game per episode, 2–5 seats (config `{ players }`, 2 by default). Actions
 * are fixed integers: pick pairing 0–5, march, decline, stop, done, then abandon / take / gamble /
 * place per region. Observations show everything except the generator (die rolls and deck order:
 * only deck sizes).
 */
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { RAW_PRESETS } from './ai';
import {
  act,
  isLegal,
  isValidFading,
  legalActions,
  newFading,
  type Action,
  type Fading,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { REGIONS } from './world';

export interface Config {
  players?: number;
}

const N = REGIONS.length;
export const CODE = {
  pick: 0,
  march: 6,
  decline: 7,
  stop: 8,
  done: 9,
  abandon: 10,
  take: 10 + N,
  gamble: 10 + 2 * N,
  place: 10 + 3 * N,
  size: 10 + 4 * N,
} as const;

export function encode(a: Action): number {
  switch (a.t) {
    case 'pick':
      return CODE.pick + a.i;
    case 'march':
    case 'decline':
    case 'stop':
    case 'done':
      return CODE[a.t];
    case 'abandon':
      return CODE.abandon + a.r;
    case 'take':
      return CODE.take + a.r;
    case 'gamble':
      return CODE.gamble + a.r;
    case 'place':
      return CODE.place + a.r;
  }
}
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n < CODE.march) return { t: 'pick', i: n };
  if (n === CODE.march) return { t: 'march' };
  if (n === CODE.decline) return { t: 'decline' };
  if (n === CODE.stop) return { t: 'stop' };
  if (n === CODE.done) return { t: 'done' };
  if (n < CODE.take) return { t: 'abandon', r: n - CODE.abandon };
  if (n < CODE.gamble) return { t: 'take', r: n - CODE.take };
  if (n < CODE.place) return { t: 'gamble', r: n - CODE.gamble };
  return { t: 'place', r: n - CODE.place };
}

export type Observation = Omit<Fading, 'rng' | 'peopleDeck' | 'traitDeck'> & {
  seat: number;
  decks: [number, number];
};
export function observe(g: Fading, seat: number): Observation {
  const { rng: _r, peopleDeck, traitDeck, ...rest } = g;
  void _r;
  return { ...rest, seat, decks: [peopleDeck.length, traitDeck.length] };
}

export function outcome(g: Fading): Outcome | null {
  if (g.phase.k !== 'over') return null;
  const n = g.winners.length;
  return {
    returns: g.ps.map((_, p) => (g.winners.includes(p) ? 1 / n : 0)),
    winners: g.winners,
    draw: n > 1,
    scores: g.ps.map((x) => x.coins),
    reason: 'rounds-out',
  };
}

export const env: GameEnvironment<Fading, number, Observation, Config> = {
  id: 'fading-empires',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 5,
    // The die and the decks come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newFading([2, 3, 4, 5].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newFading(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g) => legalActions(g).map(encode),
  applyAction: (g, n) => {
    const a = decode(n);
    if (!a || !isLegal(g, a)) throw new IllegalActionError(`Illegal action ${String(n)}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase.k === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase.k === 'over',
  getOutcome: outcome,
  getReward: (g, seat) => outcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isValidFading(parsed)) throw new Error('Invalid Fading Empires state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Fading, Action>): Agent<Fading, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Fading, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Fading, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Fading, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Fading, Action>) },
);

export const bundle: AiBundle<Fading, number> = {
  env: env as unknown as AiBundle<Fading, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
