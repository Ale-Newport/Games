/**
 * The AI environment: one word per episode (config `{ lang, level, category }`). The word is hidden
 * from the observation (only its pattern of guessed letters shows) until the game ends; each action
 * is an unused letter.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, hangmanActions } from './ai';
import {
  guess,
  isValidHangmanState,
  livesLeft,
  newHangman,
  pattern,
  type Category,
  type HangmanState,
  type Lang,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface HangmanConfig {
  lang?: Lang;
  level?: string;
  category?: Category | 'any';
}

export function hangmanOutcome(s: HangmanState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? livesLeft(s) : 0],
    reason: won ? 'solved' : 'hanged',
  };
}

export const hangmanEnv: GameEnvironment<HangmanState, string, HangmanState, HangmanConfig> = {
  id: 'hangman',
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
  createInitialState: (config, seed) =>
    newHangman(config?.lang ?? 'en', config?.level ?? 'normal', config?.category ?? 'any', seed),
  reset: (seed) => newHangman('en', 'normal', 'any', seed),
  getObservation: (s) => (s.status === 'playing' ? { ...s, word: pattern(s) } : s),
  getLegalActions: (s) => hangmanActions(s),
  applyAction: (s, a) => {
    if (!hangmanActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return guess(s, a);
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: hangmanOutcome,
  getReward: (s) => hangmanOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidHangmanState(parsed)) throw new Error('Invalid hangman state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<HangmanState, string> = {
  env: hangmanEnv as unknown as AiBundle<HangmanState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
