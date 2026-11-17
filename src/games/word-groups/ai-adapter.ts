/**
 * The AI environment: one puzzle per episode (config `{ puzzle?, lang? }`). Each action submits
 * four of the remaining words (`g:WORD+WORD+WORD+WORD`, sorted). Reward: 1 for solving, minus
 * 0.2 per mistake; 0 when four mistakes end the game.
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
import { Rng } from '../../core/game-engine/random';
import { loadVectors } from '../shared/semantic/semantic';
import { actionOf, clusterMove, combinations, wordsOf, type GroupsAction } from './ai';
import {
  deselectAll,
  isValidState,
  newGame,
  puzzleById,
  puzzlesFor,
  submit,
  toggle,
  type GroupsState,
} from './engine';
import { PUZZLES } from './puzzles';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const vectors = await loadVectors();

export interface GroupsConfig {
  puzzle?: string;
  lang?: 'en' | 'es';
}

export function groupActions(s: GroupsState): GroupsAction[] {
  if (s.status !== 'playing') return [];
  const tried = new Set(s.history.map((h) => actionOf(h)));
  return combinations(s.board, 4)
    .map((c) => actionOf(c))
    .filter((a) => !tried.has(a));
}

export function applyGroups(s: GroupsState, a: GroupsAction): GroupsState {
  if (!groupActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const picked = wordsOf(a).reduce((acc, w) => toggle(acc, w), deselectAll(s));
  return deselectAll(submit(picked).state);
}

function outcome(s: GroupsState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 - 0.2 * s.mistakes : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [s.solved.length],
    reason: s.status,
  };
}

export const env: GameEnvironment<GroupsState, GroupsAction, GroupsState, GroupsConfig> = {
  id: 'word-groups',
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
  createInitialState: (c, seed) => {
    const p = c?.puzzle
      ? puzzleById(c.puzzle)
      : new Rng(seed >>> 0).pick(c?.lang ? puzzlesFor(c.lang) : PUZZLES);
    return newGame(p, seed);
  },
  reset: (seed) => newGame(new Rng(seed >>> 0).pick(PUZZLES), seed),
  getObservation: (s) => s,
  getLegalActions: groupActions,
  applyAction: applyGroups,
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Word Groups state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a.slice(2).replaceAll('+', ', '),
};

class Clusterer implements Agent<GroupsState, GroupsAction> {
  readonly id = 'clusterer';
  readonly label = 'Meaning clusterer';
  selectAction(
    _e: GameEnvironment<GroupsState, GroupsAction>,
    s: GroupsState,
    _p: number,
    _ctx: DecisionContext,
  ) {
    return clusterMove(vectors, s);
  }
}

export const AGENT_PRESETS: AgentPreset<GroupsState, GroupsAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Submits any four words.', es: 'Envía cuatro palabras cualesquiera.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'clusterer',
    kind: 'heuristic',
    label: { en: 'Meaning clusterer', es: 'Agrupador por significado' },
    description: {
      en: 'Submits the four words closest in meaning (English vectors; weak on wordplay).',
      es: 'Envía las cuatro palabras de significado más cercano (vectores en inglés; flojo con juegos de palabras).',
    },
    create: () => new Clusterer(),
  },
];

export const bundle: AiBundle<GroupsState, GroupsAction> = {
  env: env as unknown as AiBundle<GroupsState, GroupsAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
