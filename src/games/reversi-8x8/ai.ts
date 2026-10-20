/** Computer opponents for Reversi 8×8 (shared Reversi search agent). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { ReversiState } from '../shared/reversi/engine';
import { ReversiSearchAgent } from '../shared/reversi/search';
import { R8 } from './rules';

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
      new ReversiSearchAgent(R8, {
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
      en: 'Three-move search with corners, mobility and an exact finish in the last 6 squares.',
      es: 'Búsqueda de tres jugadas con esquinas, movilidad y final exacto en las últimas 6 casillas.',
    },
    create: () =>
      new ReversiSearchAgent(R8, { id: 'medium', label: 'Medium', maxDepth: 3, endgameEmpties: 6 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening up to 12 moves in 700 ms; plays the last 12 squares perfectly.',
      es: 'Profundización iterativa hasta 12 jugadas en 700 ms; juega perfecto las últimas 12 casillas.',
    },
    create: () =>
      new ReversiSearchAgent(R8, {
        id: 'hard',
        label: 'Hard',
        maxDepth: 12,
        endgameEmpties: 12,
        timeLimitMs: 700,
      }),
  },
];
