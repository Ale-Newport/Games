/**
 * Towers of Hanoi agents: a random legal move, a greedy mover (the classic iterative rule for three
 * pegs: move the smallest disk cyclically, then the only other legal move), and the exact solver
 * (a distance table over every position).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { bestMove, legalMoves, specOf, tops, type HanoiState } from './engine';

export const MOVE_LIMIT = 600;

export const hanoiActions = (s: HanoiState) =>
  s.solved || s.moves >= MOVE_LIMIT
    ? []
    : legalMoves(s.position, specOf(s).pegs).map(([a, b]) => `${a}>${b}`);

export function solverMove(s: HanoiState): string {
  const m = bestMove(specOf(s), s.position) ?? legalMoves(s.position, specOf(s).pegs)[0]!;
  return `${m[0]}>${m[1]}`;
}

/**
 * The iterative rule: on even-numbered moves the smallest disk steps one peg round a ring of three
 * pegs (the first, the second and the last; the direction set by the number of disks), on the
 * others make the only legal move not involving it. Optimal on three pegs; on four it simply
 * leaves the third peg unused.
 */
export function cyclicMove(s: HanoiState): string {
  const spec = specOf(s);
  const ring = [0, 1, spec.pegs - 1];
  const top = tops(s.position, spec.pegs);
  const small = ring.indexOf(s.position[0]!);
  const dir = spec.disks % 2 === 0 ? 1 : -1;
  if (s.moves % 2 === 0) return `${ring[small]}>${ring[(small + dir + 3) % 3]}`;
  const [a, b] = ring.filter((_, i) => i !== small) as [number, number];
  const ta = top[a]!;
  const tb = top[b]!;
  if (ta < 0) return `${b}>${a}`;
  if (tb < 0) return `${a}>${b}`;
  return ta < tb ? `${a}>${b}` : `${b}>${a}`;
}

class HanoiAgent implements Agent<HanoiState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: HanoiState) => string,
  ) {}
  selectAction(
    env: GameEnvironment<HanoiState, string>,
    s: HanoiState,
    player: number,
    _ctx: DecisionContext,
  ): string {
    const a = this.pick(s);
    return env.getLegalActions(s, player).includes(a) ? a : solverMove(s);
  }
}

export const AGENT_PRESETS: AgentPreset<HanoiState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Makes any legal move.', es: 'Hace cualquier movimiento legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'cyclic',
    kind: 'heuristic',
    label: { en: 'Cyclic rule', es: 'Regla cíclica' },
    description: {
      en: 'The classic hand rule on three pegs: the smallest disk steps round every other move; otherwise the only other legal move.',
      es: 'La regla clásica a mano con tres varillas: el disco pequeño avanza en círculo cada dos movimientos; si no, el único otro movimiento legal.',
    },
    create: () => new HanoiAgent('cyclic', 'Cyclic rule', cyclicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'A breadth-first distance table over every position: the fewest moves from anywhere.',
      es: 'Una tabla de distancias en anchura sobre todas las posiciones: el mínimo de movimientos desde cualquier sitio.',
    },
    create: () => new HanoiAgent('solver', 'Exact solver', solverMove),
  },
];
