/**
 * The AI environment: a whole East-only game per episode, four seats. The current player is
 * whoever decides now (the turn player, or a seat deciding on a claim). Returns rank by final
 * points: 1, 1/3, −1/3, −1 (ties share).
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  act,
  decider,
  isValidRiichi,
  legalActions,
  newRiichi,
  observe,
  type RiichiGame,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const RANK = [1, 1 / 3, -1 / 3, -1];

export function riichiOutcome(g: RiichiGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  const returns = g.scores.map((s) => {
    const above = g.scores.filter((x) => x > s).length;
    const same = g.scores.filter((x) => x === s).length;
    return RANK.slice(above, above + same).reduce((a, b) => a + b, 0) / same;
  });
  return { returns, winners: [g.winner], draw: false, scores: g.scores, reason: 'east-round' };
}

export const riichiEnv: GameEnvironment<RiichiGame, string, RiichiGame, Record<string, never>> = {
  id: 'riichi-mahjong',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 4,
    maxPlayers: 4,
    // The walls come from the seed: transitions are deterministic once it is fixed.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: true,
  },
  createInitialState: (_config, seed) => newRiichi(seed >>> 0),
  reset: (seed) => newRiichi(seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g, seat) =>
    g.phase === 'over' || (seat !== undefined && seat !== decider(g) && g.phase !== 'handOver')
      ? []
      : legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) =>
    g.phase === 'over' ? NO_PLAYER : g.phase === 'handOver' ? g.dealer : decider(g),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: riichiOutcome,
  getReward: (g, seat) => riichiOutcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidRiichi(parsed)) throw new Error('Invalid riichi state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<RiichiGame, string> = {
  env: riichiEnv as unknown as AiBundle<RiichiGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
