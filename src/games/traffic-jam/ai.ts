/**
 * Traffic Jam agents: a random slide, a greedy driver (the slide leaving the fewest vehicles
 * between the red car and the exit, never undoing its last slide), and the breadth-first solver
 * (fewest moves).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { EXIT_ROW, SIZE, grid, slides, solve, type JamState } from './engine';

export const MOVE_LIMIT = 150;

export const jamActions = (s: JamState) =>
  s.solved || s.moves >= MOVE_LIMIT
    ? []
    : slides(s.puzzle.vehicles, s.pos).map(([i, to]) => `${i}:${to}`);

/** Vehicles standing between the red car and the exit. */
export function blockers(s: Pick<JamState, 'puzzle' | 'pos'>, pos = s.pos): number {
  const g = grid(s.puzzle.vehicles, pos);
  let n = 0;
  for (let k = pos[0]! + 2; k < SIZE; k++) if (g[EXIT_ROW * SIZE + k]! >= 0) n++;
  return n;
}

export function greedyMove(s: JamState, rng: Rng): string {
  const last = s.history[s.history.length - 1];
  let best: string[] = [];
  let score = Infinity;
  for (const [i, to] of slides(s.puzzle.vehicles, s.pos)) {
    const pos = [...s.pos];
    pos[i] = to;
    if (last && pos.join() === last.join()) continue;
    const sc = blockers(s, pos) * 10 - (i === 0 ? to : 0);
    if (sc < score) {
      score = sc;
      best = [`${i}:${to}`];
    } else if (sc === score) best.push(`${i}:${to}`);
  }
  return best.length ? rng.pick(best) : rng.pick(jamActions(s));
}

const plans = new Map<string, [number, number][]>();
export function solverMove(s: JamState): string {
  const key = `${s.level}:${s.seed}:${s.pos.join(',')}`;
  let plan = plans.get(key);
  if (!plan) {
    plan = solve(s.puzzle.vehicles, s.pos) ?? [];
    if (plans.size > 500) plans.clear();
    let pos = [...s.pos];
    plan.forEach((m, k) => {
      plans.set(`${s.level}:${s.seed}:${pos.join(',')}`, plan!.slice(k));
      pos = [...pos];
      pos[m[0]] = m[1];
    });
  }
  const [i, to] = plan[0] ?? slides(s.puzzle.vehicles, s.pos)[0]!;
  return `${i}:${to}`;
}

class JamAgent implements Agent<JamState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: JamState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<JamState, string>,
    s: JamState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.pick(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<JamState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Slides any vehicle anywhere it can go.',
      es: 'Desliza cualquier vehículo a donde pueda ir.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy driver', es: 'Conductor voraz' },
    description: {
      en: 'Clears the red car’s row first: the slide leaving the fewest vehicles in the way.',
      es: 'Despeja primero la fila del coche rojo: el deslizamiento que deja menos vehículos en medio.',
    },
    create: () => new JamAgent('greedy', 'Greedy driver', greedyMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'Breadth-first search over positions: always the fewest moves.',
      es: 'Búsqueda en anchura sobre las posiciones: siempre el menor número de movimientos.',
    },
    create: () => new JamAgent('solver', 'Solver', (s) => solverMove(s)),
  },
];
