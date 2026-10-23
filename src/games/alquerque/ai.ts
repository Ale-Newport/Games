/**
 * Computer opponents for Alquerque: alpha-beta (generic agent with a transposition table; forced
 * capture chains are consecutive moves by the same player) on material plus room to move. An early
 * version rewarded advancing, which made it rush to the far row and run out of moves; one counting
 * legal moves read a forced capture as the opponent "having few moves" and offered pieces. Both
 * lost to Random in the bench.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { N, stepFrom, type AlquerqueState } from './engine';

/** Plain steps (no captures, no compulsion) available to `color`: room to move later. */
function steps(board: readonly number[], color: number): number {
  let n = 0;
  board.forEach((x, p) => {
    if (x !== color) return;
    for (let d = 0; d < 8; d++) {
      const t = stepFrom(p, d);
      if (
        t >= 0 &&
        board[t] === 0 &&
        Math.sign(Math.floor(t / N) - Math.floor(p / N)) !== (color === 1 ? 1 : -1)
      )
        n++;
    }
  });
  return n;
}

export function evaluateAlquerque(s: AlquerqueState, player: PlayerId): number {
  const me = (player as number) + 1;
  let material = 0;
  for (const x of s.board) if (x) material += x === me ? 1 : -1;
  // Room to move: pieces never retreat, so running out of moves (and losing) is a real danger.
  return Math.tanh((10 * material + 0.6 * (steps(s.board, me) - steps(s.board, 3 - me))) / 40);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<AlquerqueState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateAlquerque(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<AlquerqueState, string>[] = [
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
    description: { en: 'Alpha-beta four moves ahead.', es: 'Alfa-beta a cuatro jugadas.' },
    create: () => search('medium', 'Medium', 4),
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
