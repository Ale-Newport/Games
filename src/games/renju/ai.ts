/** Computer opponents for Renju: the five-in-a-row agent, made aware of Black's forbidden points. */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import { FiveInRowAgent, type FiveAgentOptions } from '../shared/five/agent';
import type { MnkState } from '../shared/mnk/engine';
import { isForbiddenForBlack } from './forbidden';
import { SIZE } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;

const forbiddenOnBoard = (board: Int8Array, i: number, mark: number) =>
  mark === 1 && isForbiddenForBlack(board, SIZE, i);
const agent = (o: Omit<FiveAgentOptions, 'size' | 'forbiddenOnBoard'>) =>
  new FiveInRowAgent({ ...o, size: SIZE, forbiddenOnBoard });

export const AGENT_PRESETS: AgentPreset<MnkState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Plays any legal point at random (never a forbidden one).',
      es: 'Juega cualquier punto legal al azar (nunca uno prohibido).',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Greedy attack/defense scoring with plenty of randomness.',
      es: 'Puntuación voraz de ataque y defensa con mucha aleatoriedad.',
    },
    create: () =>
      agent({ id: 'easy', label: 'Easy', depth: 1, breadth: 12, spread: 5, randomness: 0.3 }),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Greedy attack/defense scoring that respects Black’s restrictions.',
      es: 'Puntuación voraz de ataque y defensa que respeta las restricciones de negras.',
    },
    create: () => agent({ id: 'medium', label: 'Medium', depth: 1, breadth: 12 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Alpha-beta four moves deep; never searches forbidden points for Black.',
      es: 'Alfa-beta a cuatro jugadas; nunca considera puntos prohibidos para negras.',
    },
    create: () => agent({ id: 'hard', label: 'Hard', depth: 4, breadth: 8, timeLimitMs: 700 }),
  },
  {
    id: 'expert',
    kind: 'search',
    label: { en: 'Expert', es: 'Experto' },
    description: {
      en: 'Iterative deepening to six moves over the six best points (900 ms).',
      es: 'Profundización iterativa hasta seis jugadas sobre los seis mejores puntos (900 ms).',
    },
    create: () => agent({ id: 'expert', label: 'Expert', depth: 6, breadth: 6, timeLimitMs: 900 }),
  },
];
