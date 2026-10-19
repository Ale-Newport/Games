/** Computer opponents for Tic-Tac-Toe, built from the generic agents (never from rules code). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { TttState } from './rules';

export type Difficulty = 'easy' | 'medium' | 'perfect';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'perfect'];

const twoPly = () =>
  new AlphaBetaAgent<TttState, number>({
    maxDepth: 2,
    id: 'ab-2ply',
    label: 'Alpha-Beta (2 plies)',
  });

export const AGENT_PRESETS: AgentPreset<TttState, number>[] = [
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
      en: 'Two-ply alpha-beta (wins and blocks immediate threats), but plays a random move 60% of the time.',
      es: 'Alfa-beta a dos jugadas (gana y bloquea amenazas inmediatas), pero juega al azar el 60% de las veces.',
    },
    create: () => new EpsilonAgent(twoPly(), 0.6, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Two-ply alpha-beta with a 15% random move rate. It does not see forks coming.',
      es: 'Alfa-beta a dos jugadas con un 15% de jugadas al azar. No ve venir las horquillas.',
    },
    create: () => new EpsilonAgent(twoPly(), 0.15, { id: 'medium', label: 'Medium' }),
  },
  {
    id: 'perfect',
    kind: 'solver',
    label: { en: 'Perfect', es: 'Perfecto' },
    description: {
      en: 'Full-depth alpha-beta search of the game tree. It never loses and picks at random among equally good moves.',
      es: 'Búsqueda alfa-beta completa del árbol de juego. Nunca pierde; elige al azar entre jugadas igual de buenas.',
    },
    create: () =>
      new AlphaBetaAgent<TttState, number>({ maxDepth: Infinity, id: 'perfect', label: 'Perfect' }),
  },
];

export function presetById(id: string): AgentPreset<TttState, number> {
  const preset = AGENT_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown Tic-Tac-Toe agent ${id}`);
  return preset;
}
