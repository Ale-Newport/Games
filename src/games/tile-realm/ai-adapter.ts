/**
 * The AI environment: one game per episode, 2–5 seats (config `{ players }`, 2 by default). An
 * action places the tile in hand and optionally stands a warden: code = (((x + 70) · 141 + (y + 70))
 * · 4 + rotation) · 9 + (warden feature + 1, or 0 for none). Observations show the board, wardens,
 * scores, the tile in hand and how many of each tile type are left — not the bag order.
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
  isValidRealm,
  legalActions,
  newRealm,
  type Action,
  type Realm,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { TILE_TYPES } from './tiles';

export interface Config {
  players?: number;
}

const SPAN = 141;
const OFF = 70;
export const ACTION_SPACE = SPAN * SPAN * 4 * 9;

export const encode = (a: Action) =>
  (((a.x + OFF) * SPAN + (a.y + OFF)) * 4 + a.r) * 9 + (a.warden === null ? 0 : a.warden + 1);
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= ACTION_SPACE) return null;
  const w = n % 9;
  const rest = Math.floor(n / 9);
  const r = rest % 4;
  const xy = Math.floor(rest / 4);
  return {
    t: 'place',
    x: Math.floor(xy / SPAN) - OFF,
    y: (xy % SPAN) - OFF,
    r,
    warden: w === 0 ? null : w - 1,
  };
}

export interface Observation {
  seat: number;
  board: Realm['board'];
  wardens: Realm['wardens'];
  scores: number[];
  turn: number;
  current: number | null;
  /** Tiles left of each type. */
  left: number[];
}
export function observe(g: Realm, seat: number): Observation {
  const left = TILE_TYPES.map((_, i) => g.bag.filter((t) => t === i).length);
  return {
    seat,
    board: g.board,
    wardens: g.wardens,
    scores: g.scores,
    turn: g.turn,
    current: g.current,
    left,
  };
}

export function outcome(g: Realm): Outcome | null {
  if (g.phase !== 'over') return null;
  const n = g.winners.length;
  return {
    returns: g.scores.map((_, p) => (g.winners.includes(p) ? 1 / n : 0)),
    winners: g.winners,
    draw: n > 1,
    scores: g.scores,
    reason: 'tiles-out',
  };
}

export const env: GameEnvironment<Realm, number, Observation, Config> = {
  id: 'tile-realm',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 5,
    // The bag order comes from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newRealm([2, 3, 4, 5].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newRealm(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g) => legalActions(g).map(encode),
  applyAction: (g, n) => {
    const a = decode(n);
    if (!a || !isLegal(g, a)) throw new IllegalActionError(`Illegal action ${String(n)}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: outcome,
  getReward: (g, seat) => outcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isValidRealm(parsed)) throw new Error('Invalid Tile Realm state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Realm, Action>): Agent<Realm, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Realm, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Realm, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Realm, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Realm, Action>) },
);

export const bundle: AiBundle<Realm, number> = {
  env: env as unknown as AiBundle<Realm, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
