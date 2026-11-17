/**
 * The AI environment: the agent is the red operative. Spymaster clues for both teams and the blue
 * operative come from the vector bots (normal skill). Actions: `g:<index>` touches a word, `pass`
 * ends the turn after a guess. Reward 1 for a red win, 0 otherwise. Config `{ skill? }` sets the
 * blue spymaster's skill.
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
import { SKILLS, operativeGuess, spymasterClue } from './bots';
import { giveClue, guess, isValidState, newGame, pass, type CodeState } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const vectors = await loadVectors();

export type CodeAction = `g:${number}` | 'pass';
export interface CodeConfig {
  skill?: keyof typeof SKILLS;
}

/** Runs bot moves (clues, the blue operative) until it is the red operative's turn to touch. */
export function settle(s: CodeState, skill: keyof typeof SKILLS = 'normal'): CodeState {
  let n = s;
  for (let guard = 0; guard < 200 && n.status === 'playing'; guard++) {
    if (n.phase === 'clue') {
      const c = spymasterClue(vectors, n, n.turn, SKILLS[n.turn === 'red' ? 'normal' : skill]);
      n = giveClue(n, c.word, c.number);
      continue;
    }
    if (n.turn === 'red') return n;
    const g = operativeGuess(vectors, n, 0.2);
    n = g === null ? pass(n) : guess(n, g);
  }
  return n;
}

export const codeActions = (s: CodeState): CodeAction[] =>
  s.status !== 'playing' || s.phase !== 'guess' || s.turn !== 'red'
    ? []
    : [
        ...s.words.flatMap((_, i) => (s.revealed[i] ? [] : [`g:${i}` as CodeAction])),
        ...(s.guessedThisTurn > 0 ? (['pass'] as CodeAction[]) : []),
      ];

function outcome(s: CodeState): Outcome | null {
  if (s.status !== 'over') return null;
  const won = s.winner === 'red';
  return {
    returns: [won ? 1 : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? 1 : 0],
    reason: s.reason ?? 'over',
  };
}

export const env: GameEnvironment<CodeState, CodeAction, CodeState, CodeConfig> = {
  id: 'code-words',
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
  createInitialState: (c, seed) => settle(newGame(seed), c?.skill),
  reset: (seed) => settle(newGame(seed)),
  getObservation: (s) =>
    s.status === 'playing'
      ? { ...s, roles: s.roles.map((r, i) => (s.revealed[i] ? r : 'bystander')) }
      : s,
  getLegalActions: codeActions,
  applyAction: (s, a) => {
    if (!codeActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    return settle(a === 'pass' ? pass(s) : guess(s, Number(a.slice(2))));
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status === 'over',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Code Words state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

class Operative implements Agent<CodeState, CodeAction> {
  readonly id = 'vector-operative';
  readonly label = 'Vector operative';
  selectAction(
    _e: GameEnvironment<CodeState, CodeAction>,
    s: CodeState,
    _p: number,
    _c: DecisionContext,
  ): CodeAction {
    const g = operativeGuess(vectors, s, 0.2);
    return g === null && s.guessedThisTurn > 0 ? 'pass' : `g:${g ?? s.revealed.indexOf(false)}`;
  }
}

export const AGENT_PRESETS: AgentPreset<CodeState, CodeAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Touches any word.', es: 'Toca cualquier palabra.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'vector-operative',
    kind: 'heuristic',
    label: { en: 'Vector operative', es: 'Agente vectorial' },
    description: {
      en: 'Touches the words most similar in meaning to the clue.',
      es: 'Toca las palabras de significado más parecido a la pista.',
    },
    create: () => new Operative(),
  },
];

export const bundle: AiBundle<CodeState, CodeAction> = {
  env: env as unknown as AiBundle<CodeState, CodeAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
