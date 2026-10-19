/** Computer opponents for Pente: generic alpha-beta pruned to capture-aware candidate moves. */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PenteState } from './engine';
import { evaluatePente, penteCandidates } from './heuristic';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const search = (
  id: string,
  label: string,
  maxDepth: number,
  breadth: number,
  timeLimitMs?: number,
) =>
  new AlphaBetaAgent<PenteState, number>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    transpositions: false,
    evaluate: (_env, s, player) => evaluatePente(s, player),
    // Candidate generation doubles as pruning: only the most promising points are searched.
    orderActions: (s) => penteCandidates(s, breadth),
  });

export const AGENT_PRESETS: AgentPreset<PenteState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Plays any legal point at random.',
      es: 'Juega cualquier punto legal al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'One-move lookahead with the capture-aware evaluation; random move 30% of the time.',
      es: 'Mira una jugada adelante con la evaluación de capturas; juega al azar el 30% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 1, 12), 0.3, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Alpha-beta two moves deep over the ten best points.',
      es: 'Alfa-beta de dos jugadas sobre los diez mejores puntos.',
    },
    create: () => search('medium', 'Medium', 2, 10),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative-deepening alpha-beta up to five moves over the ten best points (900 ms).',
      es: 'Alfa-beta con profundización iterativa hasta cinco jugadas sobre los diez mejores puntos (900 ms).',
    },
    create: () => search('hard', 'Hard', 5, 10, 900),
  },
];
