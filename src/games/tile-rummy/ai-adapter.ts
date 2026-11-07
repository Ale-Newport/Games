/**
 * The AI environment: one game per episode, 2–4 seats (config `{ players }`, 2 by default). Legal
 * actions list the plays the move generator finds plus drawing (or passing); any other valid table
 * is accepted too. Returns: the final points scaled by 1/100, clamped to [−1, 1].
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  act,
  decodePlay,
  isValidRummy,
  legalActions,
  newRummy,
  observe,
  playProblem,
  type RummyGame,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface RummyConfig {
  players?: number;
}

export function rummyOutcome(g: RummyGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.result!.map((r) => Math.max(-1, Math.min(1, r / 100))),
    winners: [g.winner],
    draw: false,
    scores: g.result!,
    reason: g.racks[g.winner]!.length === 0 ? 'out' : 'blocked',
  };
}

export const rummyEnv: GameEnvironment<RummyGame, string, RummyGame, RummyConfig> = {
  id: 'tile-rummy',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // The pool order comes from the seed: transitions are deterministic once it is fixed.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (config, seed) =>
    newRummy([2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newRummy(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g, seat) =>
    g.phase === 'over' || (seat !== undefined && seat !== g.turn) ? [] : legalActions(g),
  applyAction: (g, a) => {
    const table = decodePlay(a);
    const ok = table ? playProblem(g, table) === null : legalActions(g).includes(a);
    if (!ok) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: rummyOutcome,
  getReward: (g, seat) => rummyOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidRummy(parsed)) throw new Error('Invalid Tile Rummy state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<RummyGame, string> = {
  env: rummyEnv as unknown as AiBundle<RummyGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
