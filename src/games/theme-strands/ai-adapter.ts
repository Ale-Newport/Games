/**
 * The AI environment: one puzzle per episode (config `{ puzzle?, lang? }`). Actions: `p:<cells>`
 * traces a path that spells a dictionary word or an answer (cells comma-separated), `hint` uses a
 * hint. Reward on finishing: 1 minus 0.1 per hint (at least 0.2). Dictionaries load first.
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
import { findPaths } from './ai';
import { loadDictionary } from './dictionary';
import {
  WORDS_PER_HINT,
  isValidState,
  newGame,
  puzzleById,
  puzzlesFor,
  submitPath,
  takeHint,
  type StrandsState,
} from './engine';
import { PUZZLES } from './puzzles';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DICTS = { en: await loadDictionary('en'), es: await loadDictionary('es') };
const dictOf = (s: StrandsState) => DICTS[puzzleById(s.puzzleId).lang];

export type StrandsAction = `p:${string}` | 'hint';

export function strandsActions(s: StrandsState): StrandsAction[] {
  if (s.status !== 'playing') return [];
  const dict = dictOf(s);
  const out: StrandsAction[] = findPaths(s, dict)
    .filter((path) => {
      const r = submitPath(s, path, (w) => dict.has(w)).result;
      return r !== 'already' && r !== 'not-a-word' && r !== 'invalid';
    })
    .map((path) => `p:${path.join(',')}` as StrandsAction);
  if (s.progress >= WORDS_PER_HINT) out.push('hint');
  return out;
}

export function applyStrands(s: StrandsState, a: StrandsAction): StrandsState {
  if (!strandsActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  if (a === 'hint') return takeHint(s);
  const dict = dictOf(s);
  return submitPath(s, a.slice(2).split(',').map(Number), (w) => dict.has(w)).state;
}

function outcome(s: StrandsState): Outcome | null {
  if (s.status !== 'won') return null;
  return {
    returns: [Math.max(0.2, 1 - 0.1 * s.hintsUsed)],
    winners: [0],
    draw: false,
    scores: [s.hintsUsed],
    reason: 'won',
  };
}

export const env: GameEnvironment<
  StrandsState,
  StrandsAction,
  StrandsState,
  { puzzle?: string; lang?: 'en' | 'es' }
> = {
  id: 'theme-strands',
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
    newGame(
      c?.puzzle
        ? puzzleById(c.puzzle)
        : new Rng(seed >>> 0).pick(c?.lang ? puzzlesFor(c.lang) : PUZZLES),
    ),
  reset: (seed) => newGame(new Rng(seed >>> 0).pick(PUZZLES)),
  getObservation: (s) => s,
  getLegalActions: strandsActions,
  applyAction: applyStrands,
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status === 'won',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Theme Strands state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

/** Longest new word first; a hint whenever one is ready. */
export function finderMove(s: StrandsState): StrandsAction {
  const legal = strandsActions(s);
  if (legal.includes('hint') && !s.hint) return 'hint';
  if (s.hint) {
    const p = puzzleById(s.puzzleId);
    const path = p.paths[s.hint.word]!;
    const a = `p:${path.join(',')}` as StrandsAction;
    if (legal.includes(a)) return a;
  }
  const paths = legal.filter((a) => a !== 'hint');
  paths.sort((a, b) => b.split(',').length - a.split(',').length);
  return paths[0] ?? 'hint';
}

class Finder implements Agent<StrandsState, StrandsAction> {
  readonly id = 'finder';
  readonly label = 'Word finder';
  selectAction(
    _e: GameEnvironment<StrandsState, StrandsAction>,
    s: StrandsState,
    _p: number,
    _c: DecisionContext,
  ) {
    return finderMove(s);
  }
}

export const AGENT_PRESETS: AgentPreset<StrandsState, StrandsAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Traces any word it can find.',
      es: 'Traza cualquier palabra que encuentre.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'finder',
    kind: 'search',
    label: { en: 'Word finder', es: 'Buscapalabras' },
    description: {
      en: 'Searches the grid with a dictionary, longest words first, using hints.',
      es: 'Busca en la cuadrícula con un diccionario, primero las palabras largas, y usa pistas.',
    },
    create: () => new Finder(),
  },
];

export const bundle: AiBundle<StrandsState, StrandsAction> = {
  env: env as unknown as AiBundle<StrandsState, StrandsAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
