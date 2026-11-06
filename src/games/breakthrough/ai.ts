/** Computer opponents for Breakthrough (alpha-beta on material, advancement and threats). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { N, movesOf, type BreakthroughState } from './engine';

/** Rows advanced from the color's home row (0–7). */
const progress = (p: number, color: number) =>
  color === 1 ? N - 1 - Math.floor(p / N) : Math.floor(p / N);

/**
 * Material, squared advancement, home-row defenders, pawns attacked without a defender, and a
 * decisive bonus when the side to move has a pawn one step from the far row with a free path.
 */
export function evaluateBreakthrough(s: BreakthroughState, player: PlayerId): number {
  const me = (player as number) + 1;
  const mover = s.toMove + 1;
  let score = 0;
  for (let p = 0; p < N * N; p++) {
    const v = s.board[p]!;
    if (v === 0) continue;
    const k = progress(p, v);
    let value = 10 + 0.5 * k * k + (k === 0 ? 2 : 0);
    // Attacked by an enemy pawn diagonally ahead and not covered by a friendly pawn behind.
    const ahead = Math.floor(p / N) + (v === 1 ? -1 : 1);
    const behind = Math.floor(p / N) + (v === 1 ? 1 : -1);
    const c = p % N;
    const at = (r: number, cc: number) =>
      r >= 0 && r < N && cc >= 0 && cc < N ? s.board[r * N + cc] : -1;
    const attacked = at(ahead, c - 1) === 3 - v || at(ahead, c + 1) === 3 - v;
    const defended = at(behind, c - 1) === v || at(behind, c + 1) === v;
    if (attacked && !defended) value -= v === mover ? 2 : 8;
    score += v === me ? value : -value;
  }
  const finisher = movesOf(s.board, mover).some(([, to]) => progress(to, mover) === N - 1);
  if (finisher) return mover === me ? 0.95 : -0.95;
  return Math.tanh(score / 120);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<BreakthroughState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateBreakthrough(s, player),
    // Captures first, then the most advanced destinations.
    orderActions: (s, actions) => {
      const color = s.toMove + 1;
      const key = (a: string) => {
        const to = Number(a.split('-')[1]);
        return (s.board[to] !== 0 ? 100 : 0) + progress(to, color);
      };
      return actions.slice().sort((x, y) => key(y) - key(x));
    },
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<BreakthroughState, string>[] = [
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
    create: () => search('hard', 'Hard', 20, 1000),
  },
];
