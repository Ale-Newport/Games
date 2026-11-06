/** Computer opponents for Ultimate Tic-Tac-Toe, built from the generic agents. */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { MctsAgent } from '../../ai/agents/mcts-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { UtttState } from './engine';
import { evaluateUttt } from './heuristic';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const alphaBeta = (maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<UtttState, number>({
    maxDepth,
    timeLimitMs,
    id: `ab-${maxDepth}`,
    label: `Alpha-Beta (${maxDepth} plies)`,
    evaluate: (_env, s, player) => evaluateUttt(s, player),
  });

export const AGENT_PRESETS: AgentPreset<UtttState, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Picks any legal cell uniformly at random.',
      es: 'Elige cualquier casilla legal al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Two-ply alpha-beta with the Ultimate heuristic; plays a random move 35% of the time.',
      es: 'Alfa-beta a dos jugadas con la heurística de Ultimate; juega al azar el 35% de las veces.',
    },
    create: () => new EpsilonAgent(alphaBeta(2), 0.35, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Alpha-beta with iterative deepening up to four plies (150 ms budget) and the Ultimate heuristic.',
      es: 'Alfa-beta con profundización iterativa hasta cuatro jugadas (150 ms) y la heurística de Ultimate.',
    },
    create: () => {
      const agent = alphaBeta(4, 150);
      return Object.assign(agent, { id: 'medium', label: 'Medium' });
    },
  },
  {
    id: 'hard',
    kind: 'mcts',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Monte Carlo Tree Search (UCT): up to 20,000 random-playout simulations within 600 ms per move.',
      es: 'Búsqueda de árbol Monte Carlo (UCT): hasta 20.000 simulaciones por jugada en 600 ms.',
    },
    create: () =>
      new MctsAgent<UtttState, number>({
        iterations: 20000,
        timeLimitMs: 600,
        id: 'hard',
        label: 'Hard',
      }),
  },
];
