/** Computer opponents for Reversi 6×6 (shared Reversi search agent, tuned for the small board). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { ReversiState } from '../shared/reversi/engine';
import { ReversiSearchAgent } from '../shared/reversi/search';
import { R6 } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<ReversiState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Plays any legal move at random.',
      es: 'Juega cualquier jugada legal al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'One-move positional lookahead; random move 30% of the time.',
      es: 'Mira una jugada con valoración posicional; juega al azar el 30% de las veces.',
    },
    create: () =>
      new ReversiSearchAgent(R6, {
        id: 'easy',
        label: 'Easy',
        maxDepth: 1,
        endgameEmpties: 0,
        randomness: 0.3,
      }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Three-move search; plays the last 8 squares perfectly.',
      es: 'Búsqueda de tres jugadas; juega perfecto las últimas 8 casillas.',
    },
    create: () =>
      new ReversiSearchAgent(R6, { id: 'medium', label: 'Medium', maxDepth: 3, endgameEmpties: 8 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening up to 14 moves in 800 ms; plays the last 18 squares perfectly.',
      es: 'Profundización iterativa hasta 14 jugadas en 800 ms; juega perfecto las últimas 18 casillas.',
    },
    create: () =>
      new ReversiSearchAgent(R6, {
        id: 'hard',
        label: 'Hard',
        maxDepth: 14,
        endgameEmpties: 18,
        timeLimitMs: 800,
      }),
  },
];
