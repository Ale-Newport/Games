/**
 * Computer opponents for Paper Soccer: alpha-beta (generic agent with a transposition table) over
 * single lines — a bounce simply gives the same player the next ply. The evaluation is the ball's
 * position up the field toward the goal being attacked, a pull toward the middle where the goal
 * mouth is, and a bonus for having the move.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { DY, H, W, pointX, pointY, type PaperSoccerState } from './engine';

export function evaluatePaperSoccer(s: PaperSoccerState, player: PlayerId): number {
  const x = pointX(s.ball);
  const y = pointY(s.ball);
  // Orange (seat 0) attacks the top: rows toward y = −1 are good for it.
  const advance = (H / 2 - y) / (H / 2 + 1);
  const off = Math.abs(x - W / 2) / (W / 2);
  // Being off-center matters most near a goal: it blocks the shot (or the danger).
  const forOrange =
    advance * (1 - 0.35 * off * Math.abs(advance)) + (s.toMove === 0 ? 0.08 : -0.08);
  const v = Math.tanh(1.6 * forOrange);
  return player === 0 ? v : -v;
}

/** Lines toward the goal being attacked first. */
function order(s: PaperSoccerState, actions: string[]): string[] {
  const sign = s.toMove === 0 ? -1 : 1;
  return [...actions].sort((a, b) => sign * (DY[Number(b)]! - DY[Number(a)]!));
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<PaperSoccerState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluatePaperSoccer(s, player),
    orderActions: order,
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<PaperSoccerState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Draws any legal line.', es: 'Traza cualquier línea legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Looks two lines ahead; a random line 25% of the time.',
      es: 'Mira dos líneas; línea al azar el 25% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 2), 0.25, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: { en: 'Alpha-beta five lines ahead.', es: 'Alfa-beta a cinco líneas.' },
    create: () => search('medium', 'Medium', 5),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Iterative deepening for about a second.',
      es: 'Profundización iterativa durante un segundo.',
    },
    create: () => search('hard', 'Hard', 40, 1000),
  },
];
