/** The AI environment: one puzzle per episode (config `{ level }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, linkActions, pathOf } from './ai';
import { isSolved, isValidLinkState, joined, newLinks, owners, type LinkState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface LinkConfig {
  level?: string;
}

export function linkOutcome(s: LinkState): Outcome | null {
  if (!s.solved && linkActions(s).length) return null;
  const linked = s.puzzle.pairs.filter((_, k) => joined(s.puzzle, k, s.paths[k]!)).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [linked * 100 + owners(s.puzzle, s.paths).filter((o) => o >= 0).length],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const linkEnv: GameEnvironment<LinkState, string, LinkState, LinkConfig> = {
  id: 'flow',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) => newLinks(config?.level ?? 'easy', seed >>> 0),
  reset: (seed) => newLinks('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => linkActions(s),
  applyAction: (s, a) => {
    if (!linkActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [k, c] = a.split(':').map(Number) as [number, number];
    const paths = s.paths.map((p, j) => (j === k ? [...pathOf(s, k), c] : p));
    return { ...s, paths, solved: isSolved(s.puzzle, paths) };
  },
  getCurrentPlayer: (s) => (linkOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => linkOutcome(s) !== null,
  getOutcome: linkOutcome,
  getReward: (s) => linkOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidLinkState(parsed)) throw new Error('Invalid color links state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<LinkState, string> = {
  env: linkEnv as unknown as AiBundle<LinkState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
