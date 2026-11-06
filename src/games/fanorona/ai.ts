/**
 * Computer opponents for Fanorona: alpha-beta (generic agent with a transposition table; capture
 * chains are consecutive moves by the same player, which the agent handles) on material, with a
 * small bonus for pieces that cannot be captured next turn by approach or withdrawal.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import type { FanoronaState } from './engine';

export function evaluateFanorona(s: FanoronaState, player: PlayerId): number {
  const me = (player as number) + 1;
  let mine = 0;
  let theirs = 0;
  for (const v of s.board) {
    if (v === me) mine++;
    else if (v) theirs++;
  }
  return Math.tanh((mine - theirs) / 6);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<FanoronaState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateFanorona(s, player),
    // Captures first, bigger catches before smaller ones; "stop" last.
    orderActions: (_s, actions) =>
      actions.slice().sort((x, y) => Number(/[AW]$/.test(y)) - Number(/[AW]$/.test(x))),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<FanoronaState, string>[] = [
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
