import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyBreakthroughAction,
  createBreakthroughState,
  isValidBreakthroughState,
  legalBreakthroughActions,
  type BreakthroughState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function breakthroughOutcome(s: BreakthroughState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

/** Index: from·6 + step, step 0–2 = up-left/up/up-right (White), 3–5 = down-left/down/down-right. */
export const breakthroughCodec = {
  size: 64 * 6,
  encode(a: string): number {
    const [f, t] = a.split('-').map(Number) as [number, number];
    return f * 6 + (t < f ? 0 : 3) + ((t % 8) - (f % 8) + 1);
  },
  decode(i: number): string {
    const f = Math.floor(i / 6);
    const step = i % 6;
    return `${f}-${f + (step < 3 ? -8 : 8) + (step % 3) - 1}`;
  },
};

export const breakthroughEnv: GameEnvironment<BreakthroughState, string> = {
  id: 'breakthrough',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: breakthroughCodec.size,
    observationShape: [2, 8, 8],
  },
  createInitialState: () => createBreakthroughState(),
  reset: () => createBreakthroughState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalBreakthroughActions(s),
  applyAction: (s, a) => applyBreakthroughAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: breakthroughOutcome,
  getReward: (s, p) => breakthroughOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidBreakthroughState(parsed)) throw new Error('Invalid breakthrough state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
  encodeAction: breakthroughCodec.encode,
  decodeAction: (i) => breakthroughCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    const mine = player === 0 ? 1 : 2;
    const data = new Array<number>(128).fill(0);
    s.board.forEach((v, p) => {
      if (v === mine) data[p] = 1;
      else if (v !== 0) data[64 + p] = 1;
    });
    return { shape: [2, 8, 8], data };
  },
};

export const bundle: AiBundle<BreakthroughState, string> = {
  env: breakthroughEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
