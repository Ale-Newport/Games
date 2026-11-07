/** GameEnvironment factory for the column patiences. */
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../../ai/protocols/types';
import { columnsKey, maskColumns } from './ai';
import {
  applyColumnsMove,
  dealColumns,
  homeCount,
  isValidColumnsState,
  legalColumnsMoves,
  totalCards,
  type ColumnsState,
  type ColumnsVariant,
} from './engine';

export function createColumnsEnv(
  v: ColumnsVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<ColumnsState, string> {
  const outcome = (s: ColumnsState): Outcome | null => {
    if (!s.result) return null;
    const won = s.result === 'won';
    return {
      returns: [won ? 1 : homeCount(s) / totalCards(v)],
      winners: won ? [0] : [],
      draw: false,
      reason: s.result,
    };
  };
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
    createInitialState: (_config, seed) => dealColumns(v, seed >>> 0),
    reset: (seed) => dealColumns(v, seed >>> 0),
    getObservation: (s) => maskColumns(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== 0 ? [] : legalColumnsMoves(v, s),
    applyAction: (s, a) => applyColumnsMove(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
    isTerminal: (s) => s.result !== null,
    getOutcome: outcome,
    getReward: (s) => outcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidColumnsState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: columnsKey,
    actionToString: (a) => a,
  };
}
