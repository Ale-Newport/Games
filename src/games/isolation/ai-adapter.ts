import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyIsolationAction,
  createIsolationState,
  isValidIsolationState,
  legalIsolationActions,
  type IsolationState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function isolationOutcome(s: IsolationState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'isolated',
  };
}

/** Index: move to t → t; remove t → 49 + t. */
export const isolationCodec = {
  size: 98,
  encode: (a: string): number => (a.startsWith('m') ? 0 : 49) + Number(a.slice(1)),
  decode: (i: number): string => (i < 49 ? `m${i}` : `x${i - 49}`),
};

export const isolationEnv: GameEnvironment<IsolationState, string> = {
  id: 'isolation',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: isolationCodec.size,
    observationShape: [3, 7, 7],
  },
  createInitialState: () => createIsolationState(),
  reset: () => createIsolationState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalIsolationActions(s),
  applyAction: (s, a) => applyIsolationAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: isolationOutcome,
  getReward: (s, p) => isolationOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidIsolationState(parsed)) throw new Error('Invalid isolation state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.tiles.join('')}|${s.pawns.join(',')}|${s.toMove}${s.phase[0]}`,
  encodeAction: isolationCodec.encode,
  decodeAction: (i) => isolationCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // Planes: tiles present, own pawn, opponent pawn.
    const data = new Array<number>(147).fill(0);
    s.tiles.forEach((v, p) => (data[p] = v));
    data[49 + s.pawns[player as 0 | 1]] = 1;
    data[98 + s.pawns[1 - (player as number)]!] = 1;
    return { shape: [3, 7, 7], data };
  },
};

export const bundle: AiBundle<IsolationState, string> = {
  env: isolationEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
