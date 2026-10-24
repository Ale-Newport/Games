/**
 * Computer opponents for Bao: alpha-beta (generic agent with a transposition table) on seed counts —
 * every seed is either yours or your opponent's — with front-row seeds (the ones that capture and
 * can be captured) counted a bit more, and a bonus for capturing moves available.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { RING, type BaoState } from './engine';

export function evaluateBao(s: BaoState, player: PlayerId): number {
  const me = player as 0 | 1;
  const side = (seat: number) => {
    let total = 0;
    let front = 0;
    for (let i = 0; i < RING; i++) {
      const x = s.pits[seat * RING + i]!;
      total += x;
      if (i < 8 && x > 0) front++;
    }
    return total + 0.8 * front;
  };
  return Math.tanh((side(me) - side(1 - me)) / 20);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<BaoState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateBao(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<BaoState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Sows from any pit, either way.',
      es: 'Siembra desde cualquier casilla, en cualquier sentido.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Looks one move ahead; a random move 25% of the time.',
      es: 'Mira una jugada; jugada al azar el 25% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 1), 0.25, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: { en: 'Alpha-beta three moves ahead.', es: 'Alfa-beta a tres jugadas.' },
    create: () => search('medium', 'Medium', 3),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening for about a second.',
      es: 'Profundización iterativa durante un segundo.',
    },
    create: () => search('hard', 'Hard', 30, 1000),
  },
];
