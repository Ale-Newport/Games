/** Computer opponents for Chomp (exact solver at three accuracies). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { ChompState } from './engine';
import { ChompSolverAgent } from './solver';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<ChompState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Bites anywhere at random.', es: 'Muerde en cualquier sitio al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'solver',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Knows the winning bite but takes it only 30% of the time.',
      es: 'Conoce el mordisco ganador pero solo lo da el 30% de las veces.',
    },
    create: () => new ChompSolverAgent('easy', 'Easy', 0.3),
  },
  {
    id: 'medium',
    kind: 'solver',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Takes the winning bite 75% of the time.',
      es: 'Da el mordisco ganador el 75% de las veces.',
    },
    create: () => new ChompSolverAgent('medium', 'Medium', 0.75),
  },
  {
    id: 'hard',
    kind: 'solver',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Perfect play from an exact solver; nibbles when it is losing.',
      es: 'Juego perfecto con un solucionador exacto; mordisquea cuando va perdiendo.',
    },
    create: () => new ChompSolverAgent('hard', 'Hard', 1),
  },
];
