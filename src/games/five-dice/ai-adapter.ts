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
import { FIVE_DICE } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface FiveDiceConfig {
  players?: number;
}

export function fiveDiceOutcome(g: DiceGame): Outcome | null {
  if (g.phase !== 'over') return null;
  const win = winners(FIVE_DICE, g);
  return {
    returns: g.cards.map((_, p) =>
      g.players === 1 ? 1 : win.includes(p) ? (win.length > 1 ? 0.5 : 1) : 0,
    ),
    winners: win.length === 1 ? win : [],
    draw: win.length > 1,
    scores: totals(FIVE_DICE, g),
    reason: 'card-full',
  };
}

export const fiveDiceEnv: GameEnvironment<DiceGame, string, DiceGame, FiveDiceConfig> = {
  id: 'five-dice',
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
  getLegalActions: (g) => legalActions(FIVE_DICE, g),
  applyAction: (g, a) => {
    if (!legalActions(FIVE_DICE, g).includes(a))
      throw new IllegalActionError(`Illegal action ${a}`);
    return act(FIVE_DICE, g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: fiveDiceOutcome,
  getReward: (g, seat) => fiveDiceOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidDiceGame(FIVE_DICE, parsed)) throw new Error('Invalid Five Dice state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<DiceGame, string> = {
  env: fiveDiceEnv as unknown as AiBundle<DiceGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
