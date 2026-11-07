/** The AI environment: one board per episode (config `{ level }`), all off or out of presses. */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, MOVE_LIMIT, lightsActions } from './ai';
import { isValidLightsState, newLights, pressCell, type LightsState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface LightsConfig {
  level?: string;
}

export function lightsOutcome(s: LightsState): Outcome | null {
  if (!s.solved && s.presses.length < MOVE_LIMIT) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.presses.length : -s.lights.filter(Boolean).length],
    reason: s.solved ? 'dark' : 'move-limit',
  };
}

export const lightsEnv: GameEnvironment<LightsState, string, LightsState, LightsConfig> = {
  id: 'lights-out',
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
  createInitialState: (config, seed) => newLights(config?.level ?? 'classic', seed >>> 0),
  reset: (seed) => newLights('classic', seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => lightsActions(s),
  applyAction: (s, a) => {
    if (!lightsActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return pressCell(s, Number(a.slice(2)));
  },
  getCurrentPlayer: (s) => (lightsOutcome(s) ? NO_PLAYER : 0),
  isTerminal: (s) => lightsOutcome(s) !== null,
  getOutcome: lightsOutcome,
  getReward: (s) => lightsOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidLightsState(parsed)) throw new Error('Invalid lights out state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<LightsState, string> = {
  env: lightsEnv as unknown as AiBundle<LightsState, string>['env'],
  agents: AGENT_PRESETS,
  exactOracleId: 'solver',
};
export default bundle;
