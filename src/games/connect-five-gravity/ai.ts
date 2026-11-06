/** Computer opponents for Connect Five Gravity (shared gravity search, configured per level). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GravityState } from '../shared/gravity/engine';
import { GravitySearchAgent } from '../shared/gravity/search';
import { C5 } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<GravityState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Drops into any open column at random.',
      es: 'Suelta en cualquier columna libre al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Two-ply negamax that takes wins and blocks threats, but drops at random 40% of the time.',
      es: 'Negamax a dos jugadas que gana y bloquea amenazas, pero suelta al azar el 40% de las veces.',
    },
    create: () =>
      new GravitySearchAgent(C5, { id: 'easy', label: 'Easy', maxDepth: 2, randomness: 0.4 }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Four-ply negamax with a five-cell window heuristic.',
      es: 'Negamax a cuatro jugadas con heurística de ventanas de cinco casillas.',
    },
    create: () => new GravitySearchAgent(C5, { id: 'medium', label: 'Medium', maxDepth: 4 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative-deepening negamax with a transposition table, up to 20 plies within 600 ms per move.',
      es: 'Negamax con profundización iterativa y tabla de transposición, hasta 20 jugadas en 600 ms por movimiento.',
    },
    create: () =>
      new GravitySearchAgent(C5, { id: 'hard', label: 'Hard', maxDepth: 20, timeLimitMs: 600 }),
  },
];
