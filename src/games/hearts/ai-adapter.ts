/**
 * The AI environment plays one hand per episode (with a pass to the left): four seats, each
 * scored against the others — the return is (the others' average points − own points) / 26, so
 * the returns sum to zero.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyHeartsAction,
  createHearts,
  isValidHeartsState,
  legalHeartsActions,
  passOptions,
  type HeartsState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function heartsOutcome(s: HeartsState): Outcome | null {
  if (s.phase !== 'done' || !s.handPoints) return null;
  const pts = s.handPoints;
  const total = pts.reduce((a, b) => a + b, 0);
  const returns = pts.map((p) => ((total - p) / 3 - p) / 26);
  const low = Math.min(...pts);
  const winners = pts.flatMap((p, i) => (p === low ? [i] : []));
  return {
    returns,
    winners,
    draw: winners.length === 4,
    scores: pts,
    reason: s.moon !== null ? 'moon' : 'points',
  };
}

export const heartsEnv: GameEnvironment<HeartsState, string> = {
  id: 'hearts',
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
  createInitialState: (_config, seed) => createHearts(seed >>> 0),
  reset: (seed) => createHearts(seed >>> 0),
  // A seat sees its own hand (and the cards it passed); the others' hands are hidden.
  getObservation: (s, player) => ({
    ...s,
    hands: s.hands.map((h, i) => (i === player ? h : h.map(() => -1))),
    passes: s.passes.map((p, i) => (i === player ? p : null)),
    received: s.received.map((r, i) => (i === player ? r : [])),
  }),
  getLegalActions: (s, player) => {
    if (s.phase === 'done' || (player !== undefined && player !== s.toAct)) return [];
    return s.phase === 'pass' ? passOptions(s.hands[s.toAct]!) : legalHeartsActions(s);
  },
  applyAction: applyHeartsAction,
  getCurrentPlayer: (s) => (s.phase === 'done' ? NO_PLAYER : s.toAct),
  isTerminal: (s) => s.phase === 'done',
  getOutcome: heartsOutcome,
  getReward: (s, p) => heartsOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidHeartsState(parsed)) throw new Error('Invalid Hearts state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<HeartsState, string> = { env: heartsEnv, agents: AGENT_PRESETS };
export default bundle;
