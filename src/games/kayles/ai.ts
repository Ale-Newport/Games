/** Computer opponents for Kayles (Grundy-value solver at three accuracies). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { KaylesState } from './engine';
import { KaylesSolverAgent } from './solver';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<KaylesState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Knocks pins at random.', es: 'Derriba bolos al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'solver',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Knows the winning knock but plays it only 30% of the time.',
      es: 'Conoce el golpe ganador pero solo lo juega el 30% de las veces.',
    },
    create: () => new KaylesSolverAgent('easy', 'Easy', 0.3),
  },
  {
    id: 'medium',
    kind: 'solver',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Plays the winning knock 75% of the time.',
      es: 'Juega el golpe ganador el 75% de las veces.',
    },
    create: () => new KaylesSolverAgent('medium', 'Medium', 0.75),
  },
  {
    id: 'hard',
    kind: 'solver',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Perfect play from the Grundy values; stalls when it is losing.',
      es: 'Juego perfecto con los valores de Grundy; alarga la partida cuando va perdiendo.',
    },
    create: () => new KaylesSolverAgent('hard', 'Hard', 1),
  },
];
