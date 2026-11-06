/**
 * Computer opponents for Konane: alpha-beta (generic agent with a transposition table) on
 * mobility — the number of jumps each side has, which in Konane really differs between the sides —
 * with a small bonus for stones that cannot be jumped next turn.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { jumpsOf, type KonaneState } from './engine';

export function evaluateKonane(s: KonaneState, player: PlayerId): number {
  const me = (player as number) + 1;
  const mine = jumpsOf(s.board, me).length;
  const theirs = jumpsOf(s.board, 3 - me).length;
  return Math.tanh((mine - theirs) / 4);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<KonaneState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateKonane(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<KonaneState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Plays any legal jump.', es: 'Juega cualquier salto legal.' },
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
      en: 'Iterative deepening for about a second; solves the endgame.',
      es: 'Profundización iterativa durante un segundo; resuelve el final.',
    },
    create: () => search('hard', 'Hard', 40, 1000),
  },
];
