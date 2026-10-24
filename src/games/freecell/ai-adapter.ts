import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS, freeCellKey } from './ai';
import {
  applyFreeCellMove,
  dealFreeCell,
  homeCount,
  isValidFreeCellState,
  legalFreeCellMoves,
  type FreeCellState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function freeCellOutcome(s: FreeCellState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : homeCount(s) / 52],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export const freeCellEnv: GameEnvironment<FreeCellState, string> = {
  id: 'freecell',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (_config, seed) => dealFreeCell(seed >>> 0),
  reset: (seed) => dealFreeCell(seed >>> 0),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== 0 ? [] : legalFreeCellMoves(s),
  applyAction: (s, a) => applyFreeCellMove(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
  isTerminal: (s) => s.result !== null,
  getOutcome: freeCellOutcome,
  getReward: (s) => freeCellOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidFreeCellState(parsed)) throw new Error('Invalid freecell state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: freeCellKey,
  actionToString: (a) => a,
};

export const bundle: AiBundle<FreeCellState, string> = { env: freeCellEnv, agents: AGENT_PRESETS };
export default bundle;
