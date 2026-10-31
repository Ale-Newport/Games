/** The AI environment: one game per episode, 1–4 seats (config `{ players }`, 2 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import {
  act,
  isValidDiceGame,
  legalActions,
  newDiceGame,
  totals,
  winners,
  type DiceGame,
} from '../shared/scorecard/game';
import { AGENT_PRESETS } from './ai';
import { GENERALA } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface GeneralaConfig {
  players?: number;
}

export function generalaOutcome(g: DiceGame): Outcome | null {
  if (g.phase !== 'over') return null;
  const win = winners(GENERALA, g);
  return {
    returns: g.cards.map((_, p) =>
      g.players === 1 ? 1 : win.includes(p) ? (win.length > 1 ? 0.5 : 1) : 0,
    ),
    winners: win.length === 1 ? win : [],
    draw: win.length > 1,
    scores: totals(GENERALA, g),
    reason: g.instant !== null ? 'served-generala' : 'card-full',
  };
}

export const generalaEnv: GameEnvironment<DiceGame, string, DiceGame, GeneralaConfig> = {
  id: 'generala',
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
    newDiceGame(
      [1, 2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2,
      seed >>> 0,
    ),
  reset: (seed) => newDiceGame(2, seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(GENERALA, g),
  applyAction: (g, a) => {
    if (!legalActions(GENERALA, g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(GENERALA, g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: generalaOutcome,
  getReward: (g, seat) => generalaOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidDiceGame(GENERALA, parsed)) throw new Error('Invalid Generala state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<DiceGame, string> = {
  env: generalaEnv as unknown as AiBundle<DiceGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
