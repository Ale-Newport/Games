/** The AI environment: one battle per episode, both fleets placed at random from the seed. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidNaval, legalActions, newNaval, observe, type NavalGame } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function navalOutcome(g: NavalGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.winner === 0 ? [1, -1] : [-1, 1],
    winners: [g.winner],
    draw: false,
    scores: [Object.keys(g.shots[0]).length, Object.keys(g.shots[1]).length],
    reason: 'fleet-sunk',
  };
}

export const navalEnv: GameEnvironment<NavalGame, string, NavalGame, Record<string, never>> = {
  id: 'naval-battle',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => newNaval(seed >>> 0),
  reset: (seed) => newNaval(seed >>> 0),
  getObservation: (g, seat) => observe(g, seat === 1 ? 1 : 0),
  getLegalActions: (g, seat) =>
    g.phase === 'over' || (seat !== undefined && seat !== g.turn) ? [] : legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: navalOutcome,
  getReward: (g, seat) => navalOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidNaval(parsed)) throw new Error('Invalid Naval Battle state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<NavalGame, string> = {
  env: navalEnv as unknown as AiBundle<NavalGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
