/** Computer opponents for Quarto. */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { QuartoState } from './engine';
import { QuartoSearchAgent } from './search';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<QuartoState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Places and gives at random.', es: 'Coloca y entrega al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Takes an immediate win and avoids giving one away; a random move 30% of the time.',
      es: 'Aprovecha una victoria inmediata y evita regalarla; jugada al azar el 30% de las veces.',
    },
    create: () =>
      new QuartoSearchAgent({ id: 'easy', label: 'Easy', maxDepth: 1, randomness: 0.3 }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Searches two full turns (place and give) ahead.',
      es: 'Busca dos turnos completos (colocar y entregar) por delante.',
    },
    create: () => new QuartoSearchAgent({ id: 'medium', label: 'Medium', maxDepth: 2 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening alpha-beta for about one second per move.',
      es: 'Alfa-beta con profundización iterativa durante un segundo por jugada.',
    },
    create: () =>
      new QuartoSearchAgent({ id: 'hard', label: 'Hard', maxDepth: 16, timeLimitMs: 1000 }),
  },
];
