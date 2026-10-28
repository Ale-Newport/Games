/**
 * Number Trail agents: a random step, a greedy walker (toward the next number, preferring cells
 * with the fewest onward ways, as Warnsdorff's rule), and the exact solver (the unique solution).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { canExtend, exits, forcedCell, neighbours, nextNumber, type TrailState } from './engine';

export function trailActions(s: TrailState): string[] {
  if (s.solved) return [];
  const end = s.path[s.path.length - 1]!;
  return neighbours(s.puzzle.size, end)
    .filter((c) => canExtend(s, c))
    .map((c) => `m:${c}`);
}

export function solverMove(s: TrailState): string {
  const p = s.puzzle;
  let i = 0;
  while (i < s.path.length && s.path[i] === p.solution[i]) i++;
  // Off the solution: the exact solver never is, so it only follows it.
  return `m:${p.solution[i] ?? p.solution[p.solution.length - 1]}`;
}

export function greedyMove(s: TrailState): string {
  const acts = trailActions(s);
  const forced = forcedCell(s);
  if (forced !== null && acts.includes(`m:${forced}`)) return `m:${forced}`;
  const p = s.puzzle;
  const target = p.numbers.indexOf(nextNumber(s));
  const on = new Set(s.path);
  const n = p.size;
  const dist = (c: number) =>
    target < 0
      ? 0
      : Math.abs(Math.floor(c / n) - Math.floor(target / n)) + Math.abs((c % n) - (target % n));
  const onward = (c: number) => exits(p, c).filter((x) => !on.has(x)).length;
  let best = acts[0]!;
  let bestScore = Infinity;
  for (const a of acts) {
    const c = Number(a.slice(2));
    const score = onward(c) * 10 + dist(c);
    if (score < bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

class TrailAgent implements Agent<TrailState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: TrailState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<TrailState, string>,
    s: TrailState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<TrailState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Steps to any open neighbour.', es: 'Avanza a cualquier vecina libre.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy walker', es: 'Caminante voraz' },
    description: {
      en: 'Takes forced cells first, then the neighbour with the fewest onward ways, closest to the next number.',
      es: 'Toma primero las casillas forzadas y luego la vecina con menos salidas, más cerca del siguiente número.',
    },
    create: () => new TrailAgent('greedy', 'Greedy walker', greedyMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Search with parity, reachability and forced-cell pruning: follows the unique trail.',
      es: 'Búsqueda con poda por paridad, alcance y casillas forzadas: sigue el único sendero.',
    },
    create: () => new TrailAgent('solver', 'Exact solver', solverMove),
  },
];
