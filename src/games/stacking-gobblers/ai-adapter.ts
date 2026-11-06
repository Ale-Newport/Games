import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyGobbleAction,
  createGobbleState,
  isValidGobbleState,
  legalGobbleActions,
  ownerOf,
  sizeOf,
  type GobbleState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function gobbleOutcome(s: GobbleState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'line',
  };
}

/** Index: reserve size s onto cell c → (s − 1)·9 + c; move from f to c → 27 + 9f + c. */
export const gobbleCodec = {
  size: 27 + 81,
  encode(a: string): number {
    const m = /^(R[1-3]|[0-8])>([0-8])$/.exec(a);
    if (!m) throw new Error(`Malformed move ${a}`);
    const to = Number(m[2]);
    if (m[1]!.startsWith('R')) return (Number(m[1]!.slice(1)) - 1) * 9 + to;
    return 27 + Number(m[1]) * 9 + to;
  },
  decode(i: number): string {
    if (i < 27) return `R${Math.floor(i / 9) + 1}>${i % 9}`;
    return `${Math.floor((i - 27) / 9)}>${(i - 27) % 9}`;
  },
};

export const gobbleEnv: GameEnvironment<GobbleState, string> = {
  id: 'stacking-gobblers',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: gobbleCodec.size,
    observationShape: [6, 3, 3],
  },
  createInitialState: () => createGobbleState(),
  reset: () => createGobbleState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalGobbleActions(s),
  applyAction: (s, a) => applyGobbleAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: gobbleOutcome,
  getReward: (s, p) => gobbleOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidGobbleState(parsed)) throw new Error('Invalid state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => s.keys[s.keys.length - 1]!,
  encodeAction: gobbleCodec.encode,
  decodeAction: (i) => gobbleCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // Planes: own piece of size 1/2/3 anywhere in the stack, then the opponent's.
    const data = new Array<number>(54).fill(0);
    s.board.forEach((stack, c) => {
      for (const p of stack) data[((ownerOf(p) === player ? 0 : 3) + sizeOf(p) - 1) * 9 + c] = 1;
    });
    return { shape: [6, 3, 3], data };
  },
};

export const bundle: AiBundle<GobbleState, string> = { env: gobbleEnv, agents: AGENT_PRESETS };
export default bundle;
