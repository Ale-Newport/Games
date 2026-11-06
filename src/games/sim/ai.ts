/** Computer opponents for Sim (exact solver at three accuracies). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { SimState } from './engine';
import { SimSolverAgent } from './solver';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<SimState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Colors any line, even a losing one.',
      es: 'Colorea cualquier línea, aunque pierda.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'solver',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Never closes its own triangle; the winning line only 30% of the time.',
      es: 'Nunca cierra su propio triángulo; la línea ganadora solo el 30% de las veces.',
    },
    create: () => new SimSolverAgent('easy', 'Easy', 0.3),
  },
  {
    id: 'medium',
    kind: 'solver',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Plays the winning line 75% of the time.',
      es: 'Juega la línea ganadora el 75% de las veces.',
    },
    create: () => new SimSolverAgent('medium', 'Medium', 0.75),
  },
  {
    id: 'hard',
    kind: 'solver',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Perfect play from an exact solver; makes you work for it when it is losing.',
      es: 'Juego perfecto con un solucionador exacto; te lo pone difícil cuando va perdiendo.',
    },
    create: () => new SimSolverAgent('hard', 'Hard', 1),
  },
];
