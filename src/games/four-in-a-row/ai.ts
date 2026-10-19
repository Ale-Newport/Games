/** Computer opponents for Four in a Row (shared gravity search, configured per level). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GravityState } from '../shared/gravity/engine';
import { GravitySearchAgent } from '../shared/gravity/search';
import { C4 } from './rules';

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
      en: 'Two-ply negamax that takes wins and blocks threats, but plays a random column 40% of the time.',
      es: 'Negamax a dos jugadas que gana y bloquea amenazas, pero juega una columna al azar el 40% de las veces.',
    },
    create: () =>
      new GravitySearchAgent(C4, { id: 'easy', label: 'Easy', maxDepth: 2, randomness: 0.4 }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Five-ply negamax with a window heuristic and center preference.',
      es: 'Negamax a cinco jugadas con heurística de ventanas y preferencia por el centro.',
    },
    create: () => new GravitySearchAgent(C4, { id: 'medium', label: 'Medium', maxDepth: 5 }),
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
      new GravitySearchAgent(C4, { id: 'hard', label: 'Hard', maxDepth: 20, timeLimitMs: 600 }),
  },
];
