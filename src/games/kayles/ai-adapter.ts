import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  MAX_PINS,
  applyKaylesAction,
  createKaylesState,
  isValidKaylesState,
  legalKaylesActions,
  lengthFor,
  type KaylesState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function kaylesOutcome(s: KaylesState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'last-pin',
  };
}

/** Index: one pin i → i; pins i and i + 1 → MAX_PINS + i. */
export const kaylesCodec = {
  size: 2 * MAX_PINS,
  encode(a: string): number {
    const [i, j] = a.split('-').map(Number) as [number, number | undefined];
    return j === undefined ? i : MAX_PINS + i;
  },
  decode: (n: number): string => (n < MAX_PINS ? String(n) : `${n - MAX_PINS}-${n - MAX_PINS + 1}`),
};

export const kaylesEnv: GameEnvironment<KaylesState, string> = {
  id: 'kayles',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: kaylesCodec.size,
    observationShape: [2, MAX_PINS],
  },
  // The seed picks the row length (rounds in the app draw it at random).
  createInitialState: (_c, seed) => createKaylesState(lengthFor(seed)),
  reset: (seed) => createKaylesState(lengthFor(seed)),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalKaylesActions(s),
  applyAction: (s, a) => applyKaylesAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: kaylesOutcome,
  getReward: (s, p) => kaylesOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidKaylesState(parsed)) throw new Error('Invalid kayles state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.pins.map(Number).join('')}|${s.toMove}`,
  encodeAction: kaylesCodec.encode,
  decodeAction: (i) => kaylesCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s) => {
    // Planes: standing pins, and positions that exist in this round's row.
    const data = new Array<number>(2 * MAX_PINS).fill(0);
    s.pins.forEach((up, i) => {
      data[i] = up ? 1 : 0;
      data[MAX_PINS + i] = 1;
    });
    return { shape: [2, MAX_PINS], data };
  },
};

export const bundle: AiBundle<KaylesState, string> = { env: kaylesEnv, agents: AGENT_PRESETS };
export default bundle;
