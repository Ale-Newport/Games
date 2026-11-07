/**
 * Computer opponents for Lines of Action: alpha-beta (generic agent with a transposition table) on
 * the classic concentration heuristic — how tightly your pieces gather around their center of
 * mass — plus fewer groups, central placement and a little mobility.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { N, groups, loaTargets, parseMove, type LoaState } from './engine';

/** Minimal total distance n pieces could have to their center (a tight blob). */
const MIN_SPREAD = [0, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16];

function side(board: number[], seat: 0 | 1): number {
  const me = seat + 1;
  let n = 0;
  let sx = 0;
  let sy = 0;
  board.forEach((v, c) => {
    if (v !== me) return;
    n++;
    sx += c % N;
    sy += Math.floor(c / N);
  });
  if (n <= 1) return 10;
  const cx = sx / n;
  const cy = sy / n;
  let spread = 0;
  let central = 0;
  let mobility = 0;
  board.forEach((v, c) => {
    if (v !== me) return;
    const x = c % N;
    const y = Math.floor(c / N);
    spread += Math.max(Math.abs(x - cx), Math.abs(y - cy));
    central += 3.5 - Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
    mobility += loaTargets(board, c).length;
  });
  const excess = spread - (MIN_SPREAD[n] ?? 16);
  return -excess * 1.0 - (groups(board, seat) - 1) * 1.5 + central * 0.15 + mobility * 0.05;
}

export function evaluateLoa(s: LoaState, player: PlayerId): number {
  const me = player as 0 | 1;
  return Math.tanh((side(s.board, me) - side(s.board, (1 - me) as 0 | 1)) / 12);
}

/** Captures first, then moves toward the center. */
function order(_s: LoaState, actions: string[]): string[] {
  return actions
    .map((a) => {
      const [, t] = parseMove(a);
      const x = t % N;
      const y = Math.floor(t / N);
      return { a, k: _s.board[t] ? 10 : -Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5)) };
    })
    .sort((p, q) => q.k - p.k)
    .map((p) => p.a);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<LoaState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateLoa(s, player),
    orderActions: order,
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<LoaState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Plays any legal move.', es: 'Juega cualquier jugada legal.' },
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
    create: () => search('hard', 'Hard', 20, 1000),
  },
];
