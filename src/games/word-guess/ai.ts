/**
 * Word Guess agents: a random accepted word, a random word that fits every clue, and the solver
 * (the answer-list guess leaving the fewest answers on average).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { bestGuess, candidates, rejection, validWords, type WordState } from './engine';

export function wordActions(s: WordState): string[] {
  if (s.status !== 'playing') return [];
  const words = [...validWords(s.lang)];
  return s.hard ? words.filter((w) => !rejection(s, w)) : words;
}

export const solverMove = (s: WordState) => bestGuess(s).word;

export function consistentMove(s: WordState, rng: Rng): string {
  return rng.pick(candidates(s.lang, s.guesses));
}

class WordAgent implements Agent<WordState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: WordState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<WordState, string>,
    s: WordState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.move(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<WordState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any accepted word.', es: 'Prueba cualquier palabra aceptada.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'consistent',
    kind: 'heuristic',
    label: { en: 'Consistent guesser', es: 'Adivino coherente' },
    description: {
      en: 'Guesses a random answer that fits every clue so far.',
      es: 'Prueba una solución al azar que encaja con todas las pistas.',
    },
    create: () => new WordAgent('consistent', 'Consistent guesser', consistentMove),
  },
  {
    id: 'solver',
    kind: 'search',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'Plays the word that leaves the fewest possible answers on average.',
      es: 'Prueba la palabra que deja menos soluciones posibles de media.',
    },
    create: () => new WordAgent('solver', 'Solver', (s) => solverMove(s)),
  },
];
