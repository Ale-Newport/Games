/** The AI environment: one game per episode, 1–4 seats (config `{ players }`, 1 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidShut, legalActions, newShut, type ShutGame } from './match';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface ShutConfig {
  players?: number;
}

export function shutOutcome(g: ShutGame): Outcome | null {
  if (g.phase !== 'over') return null;
  const solo = g.players === 1;
  return {
    // Solo: 1 for shutting the box, less the more is left open.
    returns: g.scores.map((s, p) =>
      solo ? 1 - (s ?? 45) / 45 : g.winners.includes(p) ? 1 / g.winners.length : 0,
    ),
    winners: g.winners.length === 1 ? g.winners : [],
    draw: g.winners.length > 1,
    scores: g.scores.map((s) => -(s ?? 45)),
    reason: g.scores.includes(0) ? 'box-shut' : 'stuck',
  };
}

export const shutEnv: GameEnvironment<ShutGame, string, ShutGame, ShutConfig> = {
  id: 'shut-the-box',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 4,
    // Dice come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) =>
    newShut([1, 2, 3, 4].includes(config?.players ?? 1) ? (config?.players ?? 1) : 1, seed >>> 0),
  reset: (seed) => newShut(1, seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: shutOutcome,
  getReward: (g, seat) => shutOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidShut(parsed)) throw new Error('Invalid Shut the Box state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<ShutGame, string> = {
  env: shutEnv as unknown as AiBundle<ShutGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
