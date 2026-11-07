import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  applyAccordionMove,
  dealAccordion,
  isValidAccordionState,
  legalAccordionMoves,
  pilesLeft,
  type AccordionState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function accordionOutcome(s: AccordionState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : 1 - pilesLeft(s) / 52],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export const accordionEnv: GameEnvironment<AccordionState, string> = {
  id: 'accordion',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (_config, seed) => dealAccordion(seed >>> 0),
  reset: (seed) => dealAccordion(seed >>> 0),
  // The stock's order is hidden: only how many cards are left.
  getObservation: (s) => ({ ...s, stock: s.stock.map(() => -2) }),
  getLegalActions: (s, player) =>
    player !== undefined && player !== 0 ? [] : legalAccordionMoves(s),
  applyAction: (s, a) => applyAccordionMove(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
  isTerminal: (s) => s.result !== null,
  getOutcome: accordionOutcome,
  getReward: (s) => accordionOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidAccordionState(parsed)) throw new Error('Invalid accordion state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.stock.length}|${s.piles.map((p) => p.join('.')).join('/')}`,
  actionToString: (a) => a,
};

export const bundle: AiBundle<AccordionState, string> = {
  env: accordionEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
