/** Computer opponents for Ataxx (alpha-beta on piece difference with clone-first ordering). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { RING1, countsOf, type AtaxxState } from './engine';

/** Piece difference, plus a small bonus for pieces with no empty neighbor (they cannot be taken back as easily). */
export function evaluateAtaxx(s: AtaxxState, player: PlayerId): number {
  const [a, b] = countsOf(s.board);
  let score = (player === 0 ? a - b : b - a) * 10;
  const me = (player as number) + 1;
  s.board.forEach((v, p) => {
    if (v === 0) return;
    const safe = RING1[p]!.every((q) => s.board[q] !== 0);
    if (safe) score += v === me ? 1 : -1;
  });
  return Math.tanh(score / 150);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<AtaxxState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateAtaxx(s, player),
    // Clones (no gaps left behind) first.
    orderActions: (_s, actions) =>
      actions.slice().sort((x, y) => Number(y.startsWith('+')) - Number(x.startsWith('+'))),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<AtaxxState, string>[] = [
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
      en: 'Grabs the most pieces right now; a random move 25% of the time.',
      es: 'Toma las máximas piezas ahora mismo; jugada al azar el 25% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 1), 0.25, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: { en: 'Alpha-beta two moves ahead.', es: 'Alfa-beta a dos jugadas.' },
    create: () => search('medium', 'Medium', 2),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening for about a second.',
      es: 'Profundización iterativa durante un segundo.',
    },
    create: () => search('hard', 'Hard', 12, 1000),
  },
];
