/** GameEnvironment factory for the up-or-down solitaires. */
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../../ai/protocols/types';
import { maskUpDown, upDownKey } from './ai';
import {
  applyUpDownMove,
  clearedCount,
  dealUpDown,
  isValidUpDownState,
  legalUpDownMoves,
  type UpDownLayout,
  type UpDownState,
} from './engine';

export function upDownOutcome(s: UpDownState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : clearedCount(s) / s.tableau.length],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export function createUpDownEnv(
  L: UpDownLayout,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<UpDownState, string> {
  return {
    ...info,
    info: {
      kind: 'turn-based',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: true,
      zeroSum: false,
    },
    createInitialState: (_config, seed) => dealUpDown(L, seed >>> 0),
    reset: (seed) => dealUpDown(L, seed >>> 0),
    getObservation: (s) => maskUpDown(L, s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== 0 ? [] : legalUpDownMoves(L, s),
    applyAction: (s, a) => applyUpDownMove(L, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
    isTerminal: (s) => s.result !== null,
    getOutcome: upDownOutcome,
    getReward: (s) => upDownOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidUpDownState(L, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: upDownKey,
    actionToString: (a) => a,
  };
}
