/**
 * The AI environment plays one deal per episode (auction and play, nobody vulnerable): four seats
 * in two partnerships; on dummy's turn the declarer acts. Each seat's return is its side's points
 * on the deal minus the other side's, in hundreds.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyBridgeAction,
  controllerOf,
  createBridge,
  isValidBridgeState,
  legalBridgeActions,
  partnerOf,
  sideOf,
  type BridgeState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function bridgeOutcome(s: BridgeState): Outcome | null {
  if (s.phase !== 'done' || !s.result) return null;
  const [a, b] = s.result.points;
  const returns = [0, 1, 2, 3].map((seat) => (sideOf(seat) === 0 ? a - b : b - a) / 100);
  const winners = a === b ? [] : [0, 1, 2, 3].filter((seat) => sideOf(seat) === (a > b ? 0 : 1));
  return {
    returns,
    winners,
    draw: a === b,
    scores: [a, b, a, b],
    reason: s.result.passedOut ? 'passed-out' : 'deal',
  };
}

export const bridgeEnv: GameEnvironment<BridgeState, string> = {
  id: 'contract-bridge',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 4,
    maxPlayers: 4,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => createBridge(seed >>> 0),
  reset: (seed) => createBridge(seed >>> 0),
  getObservation: (s, player) => {
    const dummy = s.contract ? partnerOf(s.contract.declarer) : -1;
    const sees = (i: number) =>
      i === player ||
      (i === dummy && (s.dummyShown || player === s.contract!.declarer)) ||
      (player === dummy && i === s.contract?.declarer);
    return { ...s, hands: s.hands.map((h, i) => (sees(i) ? h : h.map(() => -1))) };
  },
  getLegalActions: (s, player) =>
    s.phase === 'done' || (player !== undefined && player !== controllerOf(s))
      ? []
      : legalBridgeActions(s),
  applyAction: applyBridgeAction,
  getCurrentPlayer: (s) => (s.phase === 'done' ? NO_PLAYER : controllerOf(s)),
  isTerminal: (s) => s.phase === 'done',
  getOutcome: bridgeOutcome,
  getReward: (s, p) => bridgeOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidBridgeState(parsed)) throw new Error('Invalid bridge state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<BridgeState, string> = { env: bridgeEnv, agents: AGENT_PRESETS };
export default bundle;
