/**
 * The AI environment plays one hand per episode (player 0 acts first) from the match's opening
 * stacks; the return is the hand's net result in chips (±1 or ±2).
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyKuhnAction,
  createKuhn,
  isValidKuhnState,
  legalKuhnActions,
  type KuhnState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function kuhnOutcome(s: KuhnState): Outcome | null {
  if (!s.result) return null;
  const { winner, won } = s.result;
  const returns = winner === 0 ? [won, -won] : [-won, won];
  return {
    returns,
    winners: [winner],
    draw: false,
    reason: s.result.showdown ? 'showdown' : 'fold',
  };
}

export const kuhnEnv: GameEnvironment<KuhnState, string> = {
  id: 'kuhn-poker',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
    actionSpaceSize: 4,
  },
  createInitialState: (_config, seed) => createKuhn(seed >>> 0),
  reset: (seed) => createKuhn(seed >>> 0),
  // A player sees their own card; the opponent's only after a showdown.
  getObservation: (s, player) => ({
    ...s,
    cards: s.cards.map((c, i) => (i === player || s.result?.showdown ? c : -1)) as [number, number],
  }),
  getLegalActions: (s, player) =>
    s.result || (player !== undefined && player !== s.toAct) ? [] : legalKuhnActions(s),
  applyAction: applyKuhnAction,
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.result !== null,
  getOutcome: kuhnOutcome,
  getReward: (s, p) => kuhnOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidKuhnState(parsed)) throw new Error('Invalid Kuhn poker state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  encodeAction: (a) => ['check', 'bet', 'call', 'fold'].indexOf(a),
  decodeAction: (i) => ['check', 'bet', 'call', 'fold'][i]!,
  actionToString: (a) => a,
};

export const bundle: AiBundle<KuhnState, string> = {
  env: kuhnEnv,
  agents: AGENT_PRESETS,
  exactOracleId: 'hard',
};
export default bundle;
