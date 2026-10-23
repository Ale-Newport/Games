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
  actionOf,
  applySimAction,
  createSimState,
  isValidSimState,
  legalSimActions,
  lineIndex,
  type SimState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function simOutcome(s: SimState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'triangle',
  };
}

/** Index: the line number (pairs in order 0-1, 0-2, …, 4-5). */
export const simCodec = {
  size: LINES.length,
  encode: (a: string): number => {
    const [p, q] = a.split('-').map(Number) as [number, number];
    return lineIndex(p, q);
  },
  decode: (i: number): string => actionOf(i),
};

export const simEnv: GameEnvironment<SimState, string> = {
  id: 'sim',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: simCodec.size,
    observationShape: [2, 15],
  },
  createInitialState: () => createSimState(),
  reset: () => createSimState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalSimActions(s),
  applyAction: (s, a) => applySimAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: simOutcome,
  getReward: (s, p) => simOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSimState(parsed)) throw new Error('Invalid sim state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.lines.join('')}|${s.toMove}`,
  encodeAction: simCodec.encode,
  decodeAction: (i) => simCodec.decode(i),
  actionToString: (a) => a,
  getObservationTensor: (s, player) => {
    // Planes over the 15 lines: the observer's lines, the opponent's lines.
    const data = new Array<number>(30).fill(0);
    s.lines.forEach((v, i) => {
      if (v) data[(v - 1 === player ? 0 : 15) + i] = 1;
    });
    return { shape: [2, 15], data };
  },
};

export const bundle: AiBundle<SimState, string> = { env: simEnv, agents: AGENT_PRESETS };
export default bundle;
