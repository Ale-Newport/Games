/** Computer opponents for Dots and Boxes. */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { DotsState } from './engine';
import { DotsSearchAgent, GreedyDotsAgent } from './search';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<DotsState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Draws any line at random.', es: 'Traza cualquier línea al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Takes boxes and avoids giving them away while it can; a random line 15% of the time.',
      es: 'Toma cajas y evita regalarlas mientras puede; línea al azar el 15% de las veces.',
    },
    create: () => new GreedyDotsAgent('easy', 'Easy', false, 0.15),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Greedy, and when forced it gives away the smallest chain.',
      es: 'Codicioso y, cuando no queda otra, regala la cadena más corta.',
    },
    create: () => new GreedyDotsAgent('medium', 'Medium', true),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Searches chains and double-dealing for about a second.',
      es: 'Busca cadenas y dobles cesiones durante un segundo.',
    },
    create: () => new DotsSearchAgent('hard', 'Hard', { maxDepth: 60, timeLimitMs: 1000 }),
  },
];
