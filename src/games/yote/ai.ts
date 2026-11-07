/**
 * Computer opponents for Yoté: alpha-beta (generic agent with a transposition table; the bonus
 * removal after a capture is a second move by the same player) on material (board + hand) and
 * mobility, with pieces in hand worth a little more (they can be dropped anywhere later).
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { COLS, ROWS, type YoteState } from './engine';

const at = (board: readonly number[], r: number, c: number) =>
  r >= 0 && r < ROWS && c >= 0 && c < COLS ? board[r * COLS + c]! : -1;

export function evaluateYote(s: YoteState, player: PlayerId): number {
  const me = (player as number) + 1;
  let score = 11 * (s.hands[me - 1]! - s.hands[2 - me]!);
  s.board.forEach((x, p) => {
    if (!x) return;
    const r = Math.floor(p / COLS);
    const c = p % COLS;
    let room = 0;
    let threatened = false;
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const ahead = at(s.board, r + dr, c + dc);
      if (ahead === 0) room++;
      // An enemy on one side with an empty square on the other can jump this piece.
      if (ahead === 3 - x && at(s.board, r - dr, c - dc) === 0) threatened = true;
    }
    const value = 10 + 0.4 * room - (threatened ? 3 : 0);
    score += x === me ? value : -value;
  });
  return Math.tanh(score / 40);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<YoteState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateYote(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<YoteState, string>[] = [
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
      en: 'Looks two moves ahead; a random move 25% of the time.',
      es: 'Mira dos jugadas; jugada al azar el 25% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 2), 0.25, { id: 'easy', label: 'Easy' }),
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
