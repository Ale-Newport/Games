/**
 * The AI environment: one secret word per episode (config `{ secret?, limit? }`). Actions:
 * `g:<word index>` guesses a vocabulary word, `give-up` ends. Reward on finding the word:
 * 1 / (1 + log10(guesses)). The vector table is loaded before the bundle is returned.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { loadVectors } from '../shared/semantic/semantic';
import { warmerMove, type WarmAction } from './ai';
import {
  MAX_GUESSES,
  giveUp,
  guess,
  isValidState,
  newGame,
  randomGame,
  type WarmState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { SECRETS } from './secrets';

export const vectors = await loadVectors();

export interface WarmConfig {
  secret?: string;
  limit?: number;
}

export function warmActions(s: WarmState): WarmAction[] {
  if (s.status !== 'playing') return [];
  const guessed = new Set(s.guesses.map((g) => g.word));
  const out: WarmAction[] = [];
  for (let i = 0; i < vectors.words.length; i++) if (!guessed.has(i)) out.push(`g:${i}`);
  out.push('give-up');
  return out;
}

export function applyWarm(s: WarmState, a: WarmAction): WarmState {
  if (s.status !== 'playing') throw new IllegalActionError('Game over');
  if (a === 'give-up') return giveUp(s);
  const m = /^g:(\d+)$/.exec(a);
  const w = m ? Number(m[1]) : -1;
  if (w < 0 || w >= vectors.words.length || s.guesses.some((g) => g.word === w))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  return guess(vectors, s, w);
}

function outcome(s: WarmState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 / (1 + Math.log10(s.guesses.length)) : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? s.guesses.length : 0],
    reason: s.status,
  };
}

export const env: GameEnvironment<WarmState, WarmAction, WarmState, WarmConfig> = {
  id: 'word-warmth',
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
  createInitialState: (c, seed) =>
    c?.secret && SECRETS.includes(c.secret)
      ? newGame(c.secret, null, c.limit ?? MAX_GUESSES)
      : randomGame(seed, c?.limit ?? MAX_GUESSES),
  reset: (seed) => randomGame(seed),
  getObservation: (s) => (s.status === 'playing' ? { ...s, secret: '?' } : s),
  getLegalActions: warmActions,
  applyAction: applyWarm,
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Word Warmth state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => (a.startsWith('g:') ? vectors.words[Number(a.slice(2))]! : a),
};

class Warmer implements Agent<WarmState, WarmAction> {
  readonly id = 'warmer';
  readonly label = 'Hill climber';
  selectAction(
    _e: GameEnvironment<WarmState, WarmAction>,
    s: WarmState,
    _p: number,
    ctx: DecisionContext,
  ) {
    return warmerMove(vectors, s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<WarmState, WarmAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any word.', es: 'Prueba cualquier palabra.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'warmer',
    kind: 'heuristic',
    label: { en: 'Hill climber', es: 'Escalador' },
    description: {
      en: 'Guesses the nearest neighbours of its warmest guesses.',
      es: 'Prueba los vecinos más cercanos de sus intentos más cálidos.',
    },
    create: () => new Warmer(),
  },
];

export const bundle: AiBundle<WarmState, WarmAction> = {
  env: env as unknown as AiBundle<WarmState, WarmAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
