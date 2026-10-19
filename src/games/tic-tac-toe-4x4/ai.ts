/** Computer opponents for Tic-Tac-Toe 4×4 (generic agents + the shared exact solver). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import { MnkSolverAgent, centerFirst, lineHeuristic } from '../shared/mnk/agents';
import type { MnkState } from '../shared/mnk/engine';
import { T4 } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'perfect'] as const;

const search = (maxDepth: number, id: string) =>
  new AlphaBetaAgent<MnkState, number>({
    maxDepth,
    id,
    label: `Alpha-Beta (${maxDepth} plies)`,
    evaluate: lineHeuristic(T4),
    orderActions: centerFirst(T4),
  });

export const AGENT_PRESETS: AgentPreset<MnkState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Picks any empty cell uniformly at random.',
      es: 'Elige cualquier casilla libre al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Two-ply alpha-beta with an open-line heuristic, but plays a random move 45% of the time.',
      es: 'Alfa-beta a dos jugadas con una heurística de líneas abiertas, pero juega al azar el 45% de las veces.',
    },
    create: () => new EpsilonAgent(search(2, 'ab-2ply'), 0.45, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Four-ply alpha-beta with the open-line heuristic; random move 8% of the time. Deep double threats can beat it.',
      es: 'Alfa-beta a cuatro jugadas con la heurística de líneas abiertas; jugada al azar el 8% de las veces. Las amenazas dobles profundas pueden vencerlo.',
    },
    create: () => new EpsilonAgent(search(4, 'ab-4ply'), 0.08, { id: 'medium', label: 'Medium' }),
  },
  {
    id: 'perfect',
    kind: 'solver',
    label: { en: 'Perfect', es: 'Perfecto' },
    description: {
      en: 'Exact bitboard solver: only plays moves that keep the game-theoretic value, preferring the ones that set traps. Never loses.',
      es: 'Solucionador exacto con bitboards: solo juega movimientos que conservan el valor teórico, prefiriendo los que tienden trampas. Nunca pierde.',
    },
    create: () => new MnkSolverAgent(T4, { id: 'perfect', label: 'Perfect', bookMarks: 2 }),
  },
];
