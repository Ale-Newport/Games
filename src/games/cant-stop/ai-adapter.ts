/** The AI environment: one game per episode, 2–4 seats (config `{ players }`, 2 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import { act, isValidSummit, legalActions, newSummit, type SummitGame } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface SummitConfig {
  players?: number;
}

export function summitOutcome(g: SummitGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.marks.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: g.marks.map((_, p) => Object.values(g.claimed).filter((x) => x === p).length),
    reason: 'three-summits',
  };
}

export const summitEnv: GameEnvironment<SummitGame, string, SummitGame, SummitConfig> = {
  id: 'cant-stop',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // Dice come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) =>
    newSummit([2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newSummit(2, seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: summitOutcome,
  getReward: (g, seat) => summitOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSummit(parsed)) throw new Error('Invalid Summit Rush state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<SummitGame, string> = {
  env: summitEnv as unknown as AiBundle<SummitGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
