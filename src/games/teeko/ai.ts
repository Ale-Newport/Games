/** Computer opponents for Teeko (alpha-beta with a winning-shape evaluation). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { SHAPES, type TeekoState } from './engine';

/** Open shapes (only one color inside), weighted by how many markers they hold. */
export function evaluateTeeko(s: TeekoState, player: PlayerId): number {
  const me = (player as number) + 1;
  const weight = [0, 1, 4, 20, 0];
  let score = 0;
  for (const shape of SHAPES) {
    let mine = 0;
    let theirs = 0;
    for (const p of shape) {
      if (s.board[p] === me) mine++;
      else if (s.board[p] !== 0) theirs++;
    }
    if (!theirs) score += weight[mine]!;
    else if (!mine) score -= weight[theirs]!;
  }
  return Math.tanh(score / 80);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<TeekoState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateTeeko(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<TeekoState, string>[] = [
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
      en: 'Looks two moves ahead; a random move 25% of the time.',
      es: 'Mira dos jugadas por delante; jugada al azar el 25% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 2), 0.25, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: { en: 'Alpha-beta four moves ahead.', es: 'Alfa-beta a cuatro jugadas.' },
    create: () => search('medium', 'Medium', 4),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening with a transposition table for about a second.',
      es: 'Profundización iterativa con tabla de transposición durante un segundo.',
    },
    create: () => search('hard', 'Hard', 20, 1000),
  },
];
