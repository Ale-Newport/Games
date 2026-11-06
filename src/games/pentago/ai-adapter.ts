import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyPentagoAction,
  createPentagoState,
  isValidPentagoState,
  legalPentagoActions,
  type PentagoState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function pentagoOutcome(s: PentagoState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw') return { returns: [0, 0], winners: [], draw: true, reason: 'draw' };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'five',
  };
}

/** Index: place p and win → p; place p then twist t (0–7: quadrant·2 + clockwise?0:1) → 36 + 8p + t. */
export const pentagoCodec = {
  size: 36 + 36 * 8,
  encode(a: string): number {
    const m = /^(\d{1,2})(?::([0-3])([RL]))?$/.exec(a);
    if (!m) throw new Error(`Malformed Pentago action ${a}`);
    const p = Number(m[1]);
    if (!m[2]) return p;
    return 36 + p * 8 + Number(m[2]) * 2 + (m[3] === 'R' ? 0 : 1);
  },
  decode(i: number): string {
    if (i < 36) return String(i);
    const k = i - 36;
    const t = k % 8;
    return `${Math.floor(k / 8)}:${Math.floor(t / 2)}${t % 2 ? 'L' : 'R'}`;
  },
};

export const pentagoEnv: GameEnvironment<PentagoState, string> = {
  id: 'pentago',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: pentagoCodec.size,
    observationShape: [2, 6, 6],
  },
  createInitialState: () => createPentagoState(),
  reset: () => createPentagoState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalPentagoActions(s),
  applyAction: (s, a) => applyPentagoAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: pentagoOutcome,
  getReward: (s, p) => pentagoOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidPentagoState(parsed)) throw new Error('Invalid pentago state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
  encodeAction: pentagoCodec.encode,
  decodeAction: (i) => pentagoCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    const mine = player === 0 ? 1 : 2;
    const data = new Array<number>(72).fill(0);
    s.board.forEach((v, p) => {
      if (v === mine) data[p] = 1;
      else if (v !== 0) data[36 + p] = 1;
    });
    return { shape: [2, 6, 6], data };
  },
};

export const bundle: AiBundle<PentagoState, string> = { env: pentagoEnv, agents: AGENT_PRESETS };
export default bundle;
