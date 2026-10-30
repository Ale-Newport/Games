/** The AI environment: one game per episode, two seats. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidSenet, legalActions, newSenet, type SenetGame } from './match';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function senetOutcome(g: SenetGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.winner === 0 ? [1, -1] : [-1, 1],
    winners: [g.winner],
    draw: false,
    scores: [g.pos.off[0], g.pos.off[1]],
    reason: 'borne-off',
  };
}

export const senetEnv: GameEnvironment<SenetGame, string, SenetGame, undefined> = {
  id: 'senet',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    // Throws come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => newSenet(seed >>> 0),
  reset: (seed) => newSenet(seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: senetOutcome,
  getReward: (g, seat) => senetOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSenet(parsed)) throw new Error('Invalid Senet state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<SenetGame, string> = {
  env: senetEnv as unknown as AiBundle<SenetGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
