import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  LINES,
  applyDotsAction,
  createDotsState,
  isValidDotsState,
  legalDotsActions,
  type DotsState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function dotsOutcome(s: DotsState): Outcome | null {
  if (!s.result) return null;
  if ('draw' in s.result)
    return { returns: [0, 0], winners: [], draw: true, reason: 'boxes', scores: s.scores };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'boxes',
    scores: s.scores,
  };
}

/** Index: the line number itself (0–39). */
export const dotsCodec = {
  size: LINES,
  encode: (a: number): number => a,
  decode: (i: number): number => i,
};

export const dotsEnv: GameEnvironment<DotsState, number> = {
  id: 'dots-and-boxes',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: dotsCodec.size,
    observationShape: [3, LINES],
  },
  createInitialState: () => createDotsState(),
  reset: () => createDotsState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalDotsActions(s),
  applyAction: (s, a) => applyDotsAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: dotsOutcome,
  getReward: (s, p) => dotsOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidDotsState(parsed)) throw new Error('Invalid dots state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.lines.map((v) => (v ? 1 : 0)).join('')}|${s.toMove}|${s.scores.join(',')}`,
  encodeAction: dotsCodec.encode,
  decodeAction: (i) => dotsCodec.decode(i),
  actionToString: (a) => String(a),
  getObservationTensor: (s, player) => {
    // Planes over the 40 lines: drawn, drawn by the observer, drawn by the opponent.
    const data = new Array<number>(3 * LINES).fill(0);
    s.lines.forEach((v, l) => {
      if (!v) return;
      data[l] = 1;
      data[(v - 1 === player ? 1 : 2) * LINES + l] = 1;
    });
    return { shape: [3, LINES], data };
  },
};

export const bundle: AiBundle<DotsState, number> = { env: dotsEnv, agents: AGENT_PRESETS };
export default bundle;
