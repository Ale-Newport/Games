import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyQuartoAction,
  createQuartoState,
  isValidQuartoState,
  legalQuartoActions,
  parseAction,
  type QuartoState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function quartoOutcome(s: QuartoState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw') return { returns: [0, 0], winners: [], draw: true, reason: 'full' };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'quarto',
  };
}

/** Index: give p → p; place c (nothing to give) → 16 + c; place c and give p → 32 + 16c + p. */
export const quartoCodec = {
  size: 32 + 256,
  encode(a: string): number {
    const m = parseAction(a);
    if (!m) throw new Error(`Malformed Quarto action ${a}`);
    if (m.cell < 0) return m.give;
    if (m.give < 0) return 16 + m.cell;
    return 32 + m.cell * 16 + m.give;
  },
  decode(i: number): string {
    if (i < 16) return `give:${i}`;
    if (i < 32) return String(i - 16);
    return `${Math.floor((i - 32) / 16)}:give:${(i - 32) % 16}`;
  },
};

export const quartoEnv: GameEnvironment<QuartoState, string> = {
  id: 'quarto',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: quartoCodec.size,
    observationShape: [9, 4, 4],
  },
  createInitialState: () => createQuartoState(),
  reset: () => createQuartoState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalQuartoActions(s),
  applyAction: (s, a) => applyQuartoAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: quartoOutcome,
  getReward: (s, p) => quartoOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidQuartoState(parsed)) throw new Error('Invalid quarto state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join(',')}|${s.inHand}|${s.toMove}`,
  encodeAction: quartoCodec.encode,
  decodeAction: (i) => quartoCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s) => {
    // Planes: occupied, then each trait set / not set for placed pieces, and the piece in hand.
    const data = new Array<number>(9 * 16).fill(0);
    s.board.forEach((p, c) => {
      if (p < 0) return;
      data[c] = 1;
      for (let t = 0; t < 4; t++) data[(1 + t * 2 + ((p >> t) & 1)) * 16 + c] = 1;
    });
    return { shape: [9, 4, 4], data };
  },
};

export const bundle: AiBundle<QuartoState, string> = { env: quartoEnv, agents: AGENT_PRESETS };
export default bundle;
