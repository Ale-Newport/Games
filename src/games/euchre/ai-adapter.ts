/**
 * The AI environment plays one hand per episode (making trump and play): four seats in two
 * partnerships; each seat's return is its side's points minus the other side's, halved.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyEuchreAction,
  createEuchre,
  isValidEuchreState,
  legalEuchreActions,
  teamOf,
  type EuchreState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function euchreOutcome(s: EuchreState): Outcome | null {
  if (s.phase !== 'done' || !s.result) return null;
  const [a, b] = s.result.points;
  const returns = [0, 1, 2, 3].map((seat) => (teamOf(seat) === 0 ? a - b : b - a) / 2);
  const winners = [0, 1, 2, 3].filter((seat) => teamOf(seat) === (a > b ? 0 : 1));
  return {
    returns,
    winners,
    draw: false,
    scores: [a, b, a, b],
    reason: s.result.euchred ? 'euchre' : 'made',
  };
}

export const euchreEnv: GameEnvironment<EuchreState, string> = {
  id: 'euchre',
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
  createInitialState: (_config, seed) => createEuchre(seed >>> 0),
  reset: (seed) => createEuchre(seed >>> 0),
  getObservation: (s, player) => ({
    ...s,
    hands: s.hands.map((h, i) => (i === player ? h : h.map(() => -1))),
    buried: player === s.dealer ? s.buried : null,
  }),
  getLegalActions: (s, player) =>
    s.phase === 'done' || (player !== undefined && player !== s.toAct) ? [] : legalEuchreActions(s),
  applyAction: applyEuchreAction,
  getCurrentPlayer: (s) => (s.phase === 'done' ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.phase === 'done',
  getOutcome: euchreOutcome,
  getReward: (s, p) => euchreOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidEuchreState(parsed)) throw new Error('Invalid euchre state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<EuchreState, string> = { env: euchreEnv, agents: AGENT_PRESETS };
export default bundle;
