/** Computer opponents for Misère Tic-Tac-Toe (generic agents + the shared exact solver). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import { MnkSolverAgent, centerFirst, lineHeuristic } from '../shared/mnk/agents';
import type { MnkState } from '../shared/mnk/engine';
import { MISERE } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'perfect'] as const;

const search = (maxDepth: number, id: string) =>
  new AlphaBetaAgent<MnkState, number>({
    maxDepth,
    id,
    label: `Alpha-Beta (${maxDepth} plies)`,
    evaluate: lineHeuristic(MISERE),
    orderActions: centerFirst(MISERE),
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
      en: 'Two-ply alpha-beta with a misère heuristic; plays a random move 45% of the time.',
      es: 'Alfa-beta a dos jugadas con una heurística de misère; juega al azar el 45% de las veces.',
    },
    create: () => new EpsilonAgent(search(2, 'ab-2ply'), 0.45, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Four-ply alpha-beta with the misère heuristic; random move 10% of the time.',
      es: 'Alfa-beta a cuatro jugadas con la heurística de misère; jugada al azar el 10% de las veces.',
    },
    create: () => new EpsilonAgent(search(4, 'ab-4ply'), 0.1, { id: 'medium', label: 'Medium' }),
  },
  {
    id: 'perfect',
    kind: 'solver',
    label: { en: 'Perfect', es: 'Perfecto' },
    description: {
      en: 'Exact solver for misère play: never loses; among safe moves it prefers the ones its misère heuristic rates best.',
      es: 'Solucionador exacto para misère: nunca pierde; entre las jugadas seguras prefiere las que mejor valora su heurística de misère.',
    },
    create: () => new MnkSolverAgent(MISERE, { id: 'perfect', label: 'Perfect' }),
  },
];
