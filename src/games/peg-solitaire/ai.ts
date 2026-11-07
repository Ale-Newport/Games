/**
 * Peg Solitaire agents: a random jump, a greedy player (the jump keeping the most jumps available
 * next, pegs nearer the centre breaking ties), and the solver (depth-first search remembering dead
 * positions; greedy when its budget runs out).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  geometry,
  jump,
  legalJumps,
  nextJump,
  pegsOf,
  shapeOf,
  type Jump,
  type PegState,
} from './engine';

export const jumpKey = (j: Jump) => `${j[0]}-${j[2]}`;

export function pegActions(s: PegState): string[] {
  return s.status === 'playing' ? legalJumps(shapeOf(s), pegsOf(s)).map(jumpKey) : [];
}

export function greedyMove(s: PegState, rng: Rng): string {
  const shape = shapeOf(s);
  const g = geometry(shape);
  const p = pegsOf(s);
  const cx = (g.width - 1) / 2;
  const cy = (g.height - 1) / 2;
  let best: Jump[] = [];
  let score = -Infinity;
  for (const j of legalJumps(shape, p)) {
    const q = jump(p, j);
    const cell = g.cellOf[j[2]]!;
    const d = Math.abs((cell % g.width) - cx) + Math.abs(Math.floor(cell / g.width) - cy);
    const sc = legalJumps(shape, q).length * 10 - d;
    if (sc > score) {
      score = sc;
      best = [j];
    } else if (sc === score) best.push(j);
  }
  return jumpKey(rng.pick(best));
}

export function solverMove(s: PegState, rng: Rng): string {
  const r = nextJump(s);
  return r.jump ? jumpKey(r.jump) : greedyMove(s, rng);
}

class PegAgent implements Agent<PegState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: PegState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<PegState, string>,
    s: PegState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.pick(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<PegState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Makes any legal jump.', es: 'Hace cualquier salto legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy', es: 'Voraz' },
    description: {
      en: 'Keeps the most jumps available, landing nearer the centre.',
      es: 'Conserva el mayor número de saltos posibles, cayendo más cerca del centro.',
    },
    create: () => new PegAgent('greedy', 'Greedy', greedyMove),
  },
  {
    id: 'solver',
    kind: 'search',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'Depth-first search that remembers dead positions: finds a way to one peg when there is one.',
      es: 'Búsqueda en profundidad que recuerda las posiciones sin salida: encuentra el camino a una clavija si existe.',
    },
    create: () => new PegAgent('solver', 'Solver', solverMove),
  },
];
