/**
 * Computer opponents for Clobber. Raw mobility is useless here — every touching White–Black pair
 * gives one move to each side — and alpha-beta on heuristics barely beat random play in the
 * bench (14–6 at depth 4), while plain Monte Carlo tree search did far better, so the levels are
 * MCTS-based; Hard switches to exact alpha-beta once few moves remain.
 */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { MctsAgent } from '../../ai/agents/mcts-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { movesOf, type ClobberState } from './engine';

export function evaluateClobber(s: ClobberState, player: PlayerId): number {
  const me = (player as number) + 1;
  // Every touching White–Black pair gives one move to each side, so raw mobility is always equal.
  // What differs is how many stones each side still has in contact with the enemy: each is a
  // separate source of future moves.
  const active = [0, 0, 0];
  const seen = [new Set<number>(), new Set<number>(), new Set<number>()];
  for (const color of [1, 2]) for (const [p] of movesOf(s.board, color)) seen[color]!.add(p);
  active[1] = seen[1]!.size;
  active[2] = seen[2]!.size;
  const tempo = s.toMove + 1 === me ? 0.5 : -0.5;
  return Math.tanh((active[me]! - active[3 - me]! + tempo) / 6);
}

/**
 * Hard: MCTS while the position is open, exact alpha-beta once few moves remain (the active-stone
 * evaluation only orders the search there; terminal results decide).
 */
export class ClobberHardAgent implements Agent<ClobberState, string> {
  readonly id = 'hard';
  readonly label = 'Hard';
  private readonly tree = mcts('hard-mcts', 'Hard MCTS', 100_000, 1500);
  private readonly exact = search('hard-exact', 'Hard exact', 60, 1500);

  selectAction(
    env: GameEnvironment<ClobberState, string>,
    state: ClobberState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const moves = env.getLegalActions(state, player).length;
    return (moves <= 10 ? this.exact : this.tree).selectAction(env, state, player, ctx);
  }
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<ClobberState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateClobber(s, player),
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const mcts = (id: string, label: string, iterations: number, timeLimitMs?: number) =>
  new MctsAgent<ClobberState, string>({ id, label, iterations, timeLimitMs });

export const AGENT_PRESETS: AgentPreset<ClobberState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Plays any legal capture.', es: 'Juega cualquier captura legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'mcts',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'A short Monte Carlo search (60 games); a random move 20% of the time.',
      es: 'Búsqueda Monte Carlo corta (60 partidas); jugada al azar el 20% de las veces.',
    },
    create: () =>
      new EpsilonAgent(mcts('easy-core', 'Easy core', 60), 0.2, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'mcts',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Monte Carlo tree search with 600 simulated games.',
      es: 'Búsqueda en árbol Monte Carlo con 600 partidas simuladas.',
    },
    create: () => mcts('medium', 'Medium', 600),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Monte Carlo tree search for about 1.5 s, then exact search near the end.',
      es: 'Búsqueda en árbol Monte Carlo durante 1,5 s y búsqueda exacta cerca del final.',
    },
    create: () => new ClobberHardAgent(),
  },
];
