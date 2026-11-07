/** The AI environment: one game per episode (config `{ variant, players }`; Choice for two by default). */
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
  isValidSnakes,
  legalActions,
  newSnakes,
  type SnakesGame,
  type Variant,
} from './match';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface SnakesConfig {
  variant?: Variant;
  players?: number;
}

export function snakesOutcome(g: SnakesGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.pos.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: [...g.pos],
    reason: 'reached-100',
  };
}

export const snakesEnv: GameEnvironment<SnakesGame, string, SnakesGame, SnakesConfig> = {
  id: 'snakes-and-ladders',
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
    newSnakes(
      config?.variant === 'classic' ? 'classic' : 'choice',
      [2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2,
      seed >>> 0,
    ),
  reset: (seed) => newSnakes('choice', 2, seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: snakesOutcome,
  getReward: (g, seat) => snakesOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSnakes(parsed)) throw new Error('Invalid Snakes and Ladders state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<SnakesGame, string> = {
  env: snakesEnv as unknown as AiBundle<SnakesGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
