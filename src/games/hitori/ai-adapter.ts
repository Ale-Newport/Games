/** The AI environment: one puzzle per episode (config `{ difficulty }`), solved or stuck. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, hitoriActions } from './ai';
import { BLACK, WHITE, isValidHitoriState, newHitori, setMarks, type HitoriState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface HitoriConfig {
  difficulty?: string;
}

export function hitoriOutcome(s: HitoriState): Outcome | null {
  if (!s.solved && hitoriActions(s).length) return null;
  const right = s.marks.filter((m, c) => m && (m === BLACK) === s.puzzle.solution[c]).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [right],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export const hitoriEnv: GameEnvironment<HitoriState, string, HitoriState, HitoriConfig> = {
  id: 'hitori',
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
  createInitialState: (config, seed) => newHitori(config?.difficulty ?? 'easy', seed >>> 0),
  reset: (seed) => newHitori('easy', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => hitoriActions(s),
  applyAction: (s, a) => {
    if (!hitoriActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [cell, mark] = a.split(':') as [string, string];
    return setMarks(s, [{ cell: Number(cell), mark: mark === 'b' ? BLACK : WHITE }]);
  },
  getCurrentPlayer: (s) => (hitoriOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => hitoriOutcome(s) !== null,
  getOutcome: hitoriOutcome,
  getReward: (s) => hitoriOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidHitoriState(parsed)) throw new Error('Invalid hitori state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<HitoriState, string> = {
  env: hitoriEnv as unknown as AiBundle<HitoriState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
