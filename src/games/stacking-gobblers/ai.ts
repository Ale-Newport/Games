/** Computer opponents for nesting tic-tac-toe (alpha-beta with a line evaluation). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { LINES3, ownerOf, sizeOf, type GobbleState } from './engine';

/** Visible two-in-a-rows (weighted by how hard the third cell is to block) and big pieces in hand. */
export function evaluateGobble(s: GobbleState, player: PlayerId): number {
  const me = player as 0 | 1;
  let score = 0;
  for (const line of LINES3) {
    let mine = 0;
    let theirs = 0;
    for (const c of line) {
      const t = s.board[c]![s.board[c]!.length - 1];
      if (t === undefined) continue;
      if (ownerOf(t) === me) mine++;
      else theirs++;
    }
    if (mine === 2 && theirs === 0) score += 20;
    if (theirs === 2 && mine === 0) score -= 20;
  }
  for (const seat of [0, 1] as const) {
    const sign = seat === me ? 1 : -1;
    score += sign * (s.reserve[seat][3]! * 6 + s.reserve[seat][2]! * 3);
    // A large visible piece cannot be covered.
    for (const stack of s.board) {
      const t = stack[stack.length - 1];
      if (t !== undefined && ownerOf(t) === seat && sizeOf(t) === 3) score += sign * 4;
    }
  }
  if (s.board[4]!.length && ownerOf(s.board[4]![s.board[4]!.length - 1]!) === me) score += 5;
  return Math.tanh(score / 60);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<GobbleState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateGobble(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<GobbleState, string>[] = [
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
      en: 'Iterative deepening with a transposition table for about one second.',
      es: 'Profundización iterativa con tabla de transposición durante un segundo.',
    },
    create: () => search('hard', 'Hard', 20, 1000),
  },
];
