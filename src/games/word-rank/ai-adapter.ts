/**
 * The AI environment: one secret word per episode (config `{ secret?, limit? }`). Actions:
 * `g:<word index>` guesses a vocabulary word, `hint` reveals a word halfway to the secret,
 * `give-up` ends. Reward: 1 for finding the word, scaled down by the guesses it took.
 * The 30,000-word vector table is loaded before the bundle is returned.
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
import { climberMove, type RankAction } from './ai';
import {
  MAX_GUESSES,
  giveUp,
  guess,
  isValidState,
  newGame,
  randomGame,
  takeHint,
  type RankState,
} from './engine';
import { SECRETS } from './secrets';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const vectors = await loadVectors();

export interface RankConfig {
  secret?: string;
  limit?: number;
}

export function rankActions(s: RankState): RankAction[] {
  if (s.status !== 'playing') return [];
  const guessed = new Set(s.guesses.map((g) => g.word));
  const out: RankAction[] = [];
  for (let i = 0; i < vectors.words.length; i++) if (!guessed.has(i)) out.push(`g:${i}`);
  out.push('hint', 'give-up');
  return out;
}

export function applyRank(s: RankState, a: RankAction): RankState {
  if (s.status !== 'playing') throw new IllegalActionError('Game over');
  if (a === 'hint') return takeHint(vectors, s);
  if (a === 'give-up') return giveUp(s);
  const m = /^g:(\d+)$/.exec(a);
  const w = m ? Number(m[1]) : -1;
  if (w < 0 || w >= vectors.words.length || s.guesses.some((g) => g.word === w))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  return guess(vectors, s, w);
}

function outcome(s: RankState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 / (1 + Math.log10(s.guesses.length + s.hints * 5)) : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? s.guesses.length : 0],
    reason: s.status,
  };
}

export const env: GameEnvironment<RankState, RankAction, RankState, RankConfig> = {
  id: 'word-rank',
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
  getLegalActions: rankActions,
  applyAction: applyRank,
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Word Rank state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => (a.startsWith('g:') ? vectors.words[Number(a.slice(2))]! : a),
};

class Climber implements Agent<RankState, RankAction> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly hints: boolean,
  ) {}
  selectAction(
    _e: GameEnvironment<RankState, RankAction>,
    s: RankState,
    _p: number,
    ctx: DecisionContext,
  ) {
    return climberMove(vectors, s, ctx.rng, this.hints);
  }
}

export const AGENT_PRESETS: AgentPreset<RankState, RankAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any word.', es: 'Prueba cualquier palabra.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'climber',
    kind: 'heuristic',
    label: { en: 'Meaning climber', es: 'Escalador de significados' },
    description: {
      en: 'Guesses words close in meaning to its best guess so far.',
      es: 'Prueba palabras de significado cercano a su mejor intento.',
    },
    create: () => new Climber('climber', 'Meaning climber', false),
  },
  {
    id: 'climber-hints',
    kind: 'heuristic',
    label: { en: 'Climber with hints', es: 'Escalador con pistas' },
    description: {
      en: 'Climbs by meaning and takes a hint when stuck.',
      es: 'Escala por significado y pide pista cuando se atasca.',
    },
    create: () => new Climber('climber-hints', 'Climber with hints', true),
  },
];

export const bundle: AiBundle<RankState, RankAction> = {
  env: env as unknown as AiBundle<RankState, RankAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
