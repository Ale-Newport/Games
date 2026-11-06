/** Computer opponents for Pentago. */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PentagoState } from './engine';
import { PentagoSearchAgent } from './search';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<PentagoState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Places and twists at random.', es: 'Coloca y gira al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Picks the best-looking move; a random move 20% of the time.',
      es: 'Elige la jugada que mejor pinta; jugada al azar el 20% de las veces.',
    },
    create: () =>
      new PentagoSearchAgent({ id: 'easy', label: 'Easy', maxDepth: 1, randomness: 0.2 }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Checks the best reply to its 8 most promising moves; a random move 10% of the time.',
      es: 'Comprueba la mejor respuesta a sus 8 jugadas más prometedoras; jugada al azar el 10% de las veces.',
    },
    create: () =>
      new PentagoSearchAgent({
        id: 'medium',
        label: 'Medium',
        maxDepth: 2,
        beam: 8,
        randomness: 0.1,
      }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening over the 16 best moves per position for about 2 s.',
      es: 'Profundización iterativa sobre las 16 mejores jugadas de cada posición durante 2 s.',
    },
    create: () =>
      new PentagoSearchAgent({
        id: 'hard',
        label: 'Hard',
        maxDepth: 6,
        beam: 14,
        timeLimitMs: 1800,
      }),
  },
];
