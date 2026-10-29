/**
 * Sokoban agents: a random step, a greedy keeper (walks to and makes the push that most lowers the
 * boxes' total distance to the nearest goals, avoiding dead cells), and the solver (fewest pushes,
 * then shortest walks).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  DIRS,
  liveCells,
  reachable,
  solvePushes,
  stepPlayer,
  walkTo,
  type Dir,
  type SokobanState,
} from './engine';

export const MOVE_LIMIT = 600;
const ALL = Object.keys(DIRS) as Dir[];

export const sokobanActions = (s: SokobanState) =>
  s.solved || s.moves >= MOVE_LIMIT ? [] : ALL.filter((d) => stepPlayer(s, d) !== s);

const plans = new Map<string, Dir[]>();
const keyOf = (s: SokobanState) => `${s.tier}:${s.index}:${s.boxes.join(',')}|${s.player}`;

/** The solver's whole remaining plan as keeper steps (null when stuck). */
export function solverPlan(s: SokobanState): Dir[] | null {
  const cached = plans.get(keyOf(s));
  if (cached) return cached;
  const w = s.warehouse;
  const pushes = solvePushes(w, s.boxes, s.player);
  if (!pushes) return null;
  const steps: Dir[] = [];
  let boxes = [...s.boxes];
  let player = s.player;
  for (const p of pushes) {
    const behind = p.box - DIRS[p.dir][0] - DIRS[p.dir][1] * w.width;
    steps.push(...(walkTo(w, boxes, player, behind) ?? []), p.dir);
    boxes = boxes.map((b) => (b === p.box ? p.box + DIRS[p.dir][0] + DIRS[p.dir][1] * w.width : b));
    player = p.box;
  }
  if (plans.size > 300) plans.clear();
  let at = s;
  steps.forEach((d, i) => {
    plans.set(keyOf(at), steps.slice(i));
    at = stepPlayer(at, d);
  });
  return steps;
}

export function solverMove(s: SokobanState, rng: Rng): Dir {
  return solverPlan(s)?.[0] ?? rng.pick(sokobanActions(s));
}

/** Sum over boxes of the walking distance to the nearest goal. */
function spread(s: SokobanState, boxes: readonly number[]): number {
  const w = s.warehouse;
  return boxes.reduce((n, b) => {
    let best = Infinity;
    for (const g of w.goals)
      best = Math.min(
        best,
        Math.abs((b % w.width) - (g % w.width)) +
          Math.abs(Math.floor(b / w.width) - Math.floor(g / w.width)),
      );
    return n + best;
  }, 0);
}

export function greedyMove(s: SokobanState, rng: Rng): Dir {
  const w = s.warehouse;
  const live = liveCells(w);
  const area = reachable(w, s.boxes, s.player);
  let best: { walk: Dir[]; dir: Dir } | null = null;
  let score = Infinity;
  for (const b of s.boxes)
    for (const d of ALL) {
      const behind = b - DIRS[d][0] - DIRS[d][1] * w.width;
      const ahead = b + DIRS[d][0] + DIRS[d][1] * w.width;
      if (!area.has(behind) || w.walls[ahead] || s.boxes.includes(ahead) || !live.has(ahead))
        continue;
      const after = s.boxes.map((x) => (x === b ? ahead : x));
      const sc = spread(s, after) + rng.float() * 0.5;
      if (sc < score) {
        score = sc;
        best = { walk: walkTo(w, s.boxes, s.player, behind) ?? [], dir: d };
      }
    }
  if (!best) return rng.pick(sokobanActions(s));
  return best.walk[0] ?? best.dir;
}

class KeeperAgent implements Agent<SokobanState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: SokobanState, rng: Rng) => Dir,
  ) {}
  selectAction(
    _env: GameEnvironment<SokobanState, string>,
    s: SokobanState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.pick(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<SokobanState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Steps in any open direction.',
      es: 'Da un paso en cualquier dirección libre.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy keeper', es: 'Mozo voraz' },
    description: {
      en: 'Makes the push that brings the boxes closest to goals, never onto a dead cell.',
      es: 'Hace el empuje que más acerca las cajas a las metas, nunca a una casilla muerta.',
    },
    create: () => new KeeperAgent('greedy', 'Greedy keeper', greedyMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'Breadth-first search over pushes with dead-cell pruning: fewest pushes.',
      es: 'Búsqueda en anchura sobre los empujes con poda de casillas muertas: mínimo de empujes.',
    },
    create: () => new KeeperAgent('solver', 'Solver', solverMove),
  },
];
