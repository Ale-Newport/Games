/**
 * The AI environment: one code per episode (config `{ variant }`). The code is hidden from the
 * observation until the game ends; each action is a guess, written as its symbols (e.g. `0123`).
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, codeActions, parseCode } from './ai';
import {
  isCode,
  isValidCodeBreakerState,
  makeGuess,
  newCodeBreaker,
  variantOf,
  type CodeBreakerState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface CodeBreakerConfig {
  variant?: string;
}

export function codeBreakerOutcome(s: CodeBreakerState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? variantOf(s).maxGuesses + 1 - s.guesses.length : 0],
    reason: won ? 'cracked' : 'out-of-guesses',
  };
}

const legal = (s: CodeBreakerState, a: string) =>
  s.status === 'playing' && /^\d+$/.test(a) && isCode(variantOf(s), parseCode(a));

export const codeBreakerEnv: GameEnvironment<
  CodeBreakerState,
  string,
  CodeBreakerState,
  CodeBreakerConfig
> = {
  id: 'code-breaker',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (config, seed) => newCodeBreaker(config?.variant ?? 'classic', seed >>> 0),
  reset: (seed) => newCodeBreaker('classic', seed >>> 0),
  getObservation: (s) => (s.status === 'playing' ? { ...s, secret: s.secret.map(() => -1) } : s),
  getLegalActions: (s) => codeActions(s),
  applyAction: (s, a) => {
    if (!legal(s, a)) throw new IllegalActionError(`Illegal action ${a}`);
    return makeGuess(s, parseCode(a));
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: codeBreakerOutcome,
  getReward: (s) => codeBreakerOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidCodeBreakerState(parsed)) throw new Error('Invalid code breaker state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<CodeBreakerState, string> = {
  env: codeBreakerEnv as unknown as AiBundle<CodeBreakerState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
