/** The AI environment: one game per episode, 1–4 seats (config `{ players }`, 2 by default). */
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
  decider,
  isValidRows,
  legalActions,
  newRows,
  sheetScore,
  type RowsGame,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface RowsConfig {
  players?: number;
}

export function rowsOutcome(g: RowsGame): Outcome | null {
  if (g.phase !== 'over') return null;
  const scores = g.sheets.map(sheetScore);
  const top = Math.max(...scores);
  const winners = scores.flatMap((s, p) => (s === top ? [p] : []));
  const solo = g.players === 1;
  return {
    // Solo, the return grows with the score (about 0 at −20, 1 at 160).
    returns: solo
      ? [Math.max(0, Math.min(1, (scores[0]! + 20) / 180))]
      : scores.map((_, p) => (winners.includes(p) ? 1 / winners.length : 0)),
    winners: winners.length === 1 ? winners : [],
    draw: !solo && winners.length > 1,
    scores,
    reason: g.locked.filter(Boolean).length >= 2 ? 'two-locks' : 'four-penalties',
  };
}

export const rowsEnv: GameEnvironment<RowsGame, string, RowsGame, RowsConfig> = {
  id: 'qwixx',
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
    newRows([1, 2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newRows(2, seed >>> 0),
  getObservation: (g) => g,
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : decider(g)),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: rowsOutcome,
  getReward: (g, seat) => rowsOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidRows(parsed)) throw new Error('Invalid Colour Rows state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<RowsGame, string> = {
  env: rowsEnv as unknown as AiBundle<RowsGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
