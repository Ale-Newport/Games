/** Computer opponents for Isolation (alpha-beta on mobility; one ply = one move or one removal). */
import { AlphaBetaAgent } from '../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { PlayerId } from '../../ai/protocols/types';
import { N, NEIGHBORS, stepsOf, type IsolationState } from './engine';

/** Free tiles reachable in one and two steps from `seat`'s pawn. */
function reach(s: IsolationState, seat: 0 | 1): [number, number] {
  const one = stepsOf(s, seat);
  const two = new Set<number>();
  const other = s.pawns[1 - seat]!;
  for (const q of one)
    for (const r of NEIGHBORS[q]!)
      if (s.tiles[r] === 1 && r !== other && r !== s.pawns[seat]) two.add(r);
  return [one.length, two.size];
}

/**
 * Mobility: own steps minus twice the opponent's (taking moves away matters more), plus the
 * two-step area. Scored for whoever is to act next in a turn (a pending removal favors the mover).
 */
export function evaluateIsolation(s: IsolationState, player: PlayerId): number {
  const me = player as 0 | 1;
  const [m1, m2] = reach(s, me);
  const [o1, o2] = reach(s, (1 - me) as 0 | 1);
  let score = 3 * m1 - 4 * o1 + 0.5 * (m2 - o2);
  if (s.phase === 'remove') score += s.toMove === me ? 2 : -2;
  return Math.tanh(score / 20);
}

const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
  new AlphaBetaAgent<IsolationState, string>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateIsolation(s, player),
    orderActions: (s, actions) => {
      if (s.phase === 'move') {
        // Steps toward open space first.
        const room = (a: string) => NEIGHBORS[Number(a.slice(1))]!.filter((q) => s.tiles[q]).length;
        return actions.slice().sort((x, y) => room(y) - room(x));
      }
      // Removals next to the opponent's pawn first, then by distance to it.
      const target = s.pawns[1 - s.toMove]!;
      const dist = (a: string) => {
        const p = Number(a.slice(1));
        return Math.max(
          Math.abs(Math.floor(p / N) - Math.floor(target / N)),
          Math.abs((p % N) - (target % N)),
        );
      };
      return actions.slice().sort((x, y) => dist(x) - dist(y));
    },
  });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<IsolationState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Moves and removes at random.',
      es: 'Mueve y retira al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'search',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Looks at its own turn only; a random action 25% of the time.',
      es: 'Solo mira su propio turno; acción al azar el 25% de las veces.',
    },
    create: () =>
      new EpsilonAgent(search('easy-core', 'Easy core', 2), 0.25, { id: 'easy', label: 'Easy' }),
  },
  {
    id: 'medium',
    kind: 'search',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      // Six actions: its turn, your reply and its next turn (4 plies played worse than 2 here).
      en: 'Alpha-beta over three turns (its own, yours, its next).',
      es: 'Alfa-beta sobre tres turnos (el suyo, el tuyo y el siguiente).',
    },
    create: () => search('medium', 'Medium', 6),
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
