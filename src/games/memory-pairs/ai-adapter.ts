/**
 * The AI environment: one game per episode (config `{ size, players }`: small/medium/large, 1 or 2;
 * small and 2 by default). Faces not yet turned over are hidden from observations. Returns: solo,
 * 2 × pairs / turns − 1 (1 for a perfect game); with two players +1 / −1 (0 each for a tie).
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
  isValidMemory,
  legalActions,
  newMemory,
  observe,
  SIZES,
  winners,
  type MemoryGame,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface MemoryConfig {
  size?: string;
  players?: number;
}

export function memoryOutcome(g: MemoryGame): Outcome | null {
  if (g.phase !== 'over') return null;
  if (g.players === 1) {
    const pairs = g.faces.length / 2;
    return {
      returns: [(2 * pairs) / g.turns[0]! - 1],
      winners: [0],
      draw: false,
      scores: [g.turns[0]!],
      reason: 'cleared',
    };
  }
  const ws = winners(g);
  return {
    returns: ws.length > 1 ? [0, 0] : ws[0] === 0 ? [1, -1] : [-1, 1],
    winners: ws.length > 1 ? [] : ws,
    draw: ws.length > 1,
    scores: g.pairs,
    reason: 'cleared',
  };
}

export const memoryEnv: GameEnvironment<MemoryGame, string, MemoryGame, MemoryConfig> = {
  id: 'memory-pairs',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (config, seed) =>
    newMemory(
      config?.size && SIZES[config.size] ? config.size : 'small',
      config?.players === 1 ? 1 : 2,
      seed >>> 0,
    ),
  reset: (seed) => newMemory('small', 2, seed >>> 0),
  getObservation: (g) => observe(g),
  getLegalActions: (g, seat) =>
    g.phase === 'over' || (seat !== undefined && seat !== g.turn) ? [] : legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: memoryOutcome,
  getReward: (g, seat) => memoryOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidMemory(parsed)) throw new Error('Invalid Memory Pairs state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<MemoryGame, string> = {
  env: memoryEnv as unknown as AiBundle<MemoryGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
