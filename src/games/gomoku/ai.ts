/** Computer opponents for Gomoku (shared five-in-a-row agent at four strengths). */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import { FiveInRowAgent } from '../shared/five/agent';
import type { MnkState } from '../shared/mnk/engine';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
const SIZE = 15;

export const AGENT_PRESETS: AgentPreset<MnkState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Plays any empty point at random.',
      es: 'Juega en cualquier punto libre al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Greedy attack/defense scoring, choosing among its top five moves and often playing a random nearby point.',
      es: 'Puntuación voraz de ataque y defensa, elige entre sus cinco mejores jugadas y a menudo juega un punto cercano al azar.',
    },
    create: () =>
      new FiveInRowAgent({
        id: 'easy',
        label: 'Easy',
        size: SIZE,
        depth: 1,
        breadth: 12,
        spread: 5,
        randomness: 0.3,
      }),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Greedy: plays the point with the best combined attack and defense window score.',
      es: 'Voraz: juega el punto con mejor puntuación combinada de ataque y defensa.',
    },
    create: () =>
      new FiveInRowAgent({ id: 'medium', label: 'Medium', size: SIZE, depth: 1, breadth: 12 }),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Alpha-beta search four moves deep over the eight most promising points.',
      es: 'Búsqueda alfa-beta de cuatro jugadas sobre los ocho puntos más prometedores.',
    },
    create: () =>
      new FiveInRowAgent({
        id: 'hard',
        label: 'Hard',
        size: SIZE,
        depth: 4,
        breadth: 8,
        timeLimitMs: 600,
      }),
  },
  {
    id: 'expert',
    kind: 'search',
    label: { en: 'Expert', es: 'Experto' },
    description: {
      en: 'Iterative deepening to six moves over the six most promising points (800 ms).',
      es: 'Profundización iterativa hasta seis jugadas sobre los seis puntos más prometedores (800 ms).',
    },
    create: () =>
      new FiveInRowAgent({
        id: 'expert',
        label: 'Expert',
        size: SIZE,
        depth: 6,
        breadth: 6,
        timeLimitMs: 800,
      }),
  },
];
