/** The AI environment: one board per episode (config `{ board }`), ending won or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, pegActions } from './ai';
import {
  count,
  isValidPegState,
  legalJumps,
  newPegGame,
  pegsOf,
  play,
  shapeOf,
  type PegState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface PegConfig {
  board?: string;
}

export function pegOutcome(s: PegState): Outcome | null {
  if (s.status === 'playing') return null;
  const left = count(pegsOf(s));
  return {
    returns: [s.status === 'won' ? 1 : 0],
    winners: s.status === 'won' ? [0] : [],
    draw: false,
    scores: [-left],
    reason: s.status,
  };
}

export const pegEnv: GameEnvironment<PegState, string, PegState, PegConfig> = {
  id: 'peg-solitaire',
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
  createInitialState: (config) => newPegGame(config?.board ?? 'english'),
  reset: () => newPegGame('english'),
  getObservation: (s) => s,
  getLegalActions: (s) => pegActions(s),
  applyAction: (s, a) => {
    const j = legalJumps(shapeOf(s), pegsOf(s)).find((x) => `${x[0]}-${x[2]}` === a);
    if (!j || s.status !== 'playing') throw new IllegalActionError(`Illegal action ${a}`);
    return play(s, j);
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: pegOutcome,
  getReward: (s) => pegOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidPegState(parsed)) throw new Error('Invalid peg solitaire state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<PegState, string> = {
  env: pegEnv as unknown as AiBundle<PegState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
