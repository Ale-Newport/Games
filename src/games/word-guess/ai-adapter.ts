/**
 * The AI environment: one word per episode (config `{ lang, hard }`). The answer is hidden from
 * the observation until the game ends; each action is an accepted five-letter word.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, wordActions } from './ai';
import {
  MAX_GUESSES,
  isValidWordState,
  newWordGame,
  play,
  rejection,
  type Lang,
  type WordState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface WordConfig {
  lang?: Lang;
  hard?: boolean;
}

export function wordOutcome(s: WordState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? MAX_GUESSES + 1 - s.guesses.length : 0],
    reason: won ? 'solved' : 'out-of-guesses',
  };
}

export const wordEnv: GameEnvironment<WordState, string, WordState, WordConfig> = {
  id: 'word-guess',
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
    newWordGame(config?.lang ?? 'en', seed >>> 0, config?.hard ?? false),
  reset: (seed) => newWordGame('en', seed >>> 0),
  getObservation: (s) => (s.status === 'playing' ? { ...s, answer: '?????' } : s),
  getLegalActions: (s) => wordActions(s),
  applyAction: (s, a) => {
    if (s.status !== 'playing' || typeof a !== 'string' || rejection(s, a))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    return play(s, a);
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: wordOutcome,
  getReward: (s) => wordOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidWordState(parsed)) throw new Error('Invalid word guess state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<WordState, string> = {
  env: wordEnv as unknown as AiBundle<WordState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
