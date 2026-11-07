/**
 * Pyramid agents. The pyramid is face up but the stock is not: until the waste has been turned back
 * once, the planner treats stock cards as unknown, so a draw that turns up an unknown card ends a
 * line. It searches best-first for the most pyramid cards removed, preferring free cards that
 * uncover others, and replays a clearing line once it finds one. The greedy player removes what it
 * can (pyramid pairs first) and otherwise draws.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import {
  isFree,
  legalPyramidMoves,
  movePyramid,
  removedCount,
  rowOf,
  type PyramidState,
} from './engine';

export const HIDDEN = -1;

/** The stock is unknown until it has been seen once (after the first recycle every card has been). */
export function maskPyramid(s: PyramidState): PyramidState {
  return { ...s, stock: s.recycles === 0 ? s.stock.map(() => HIDDEN - 1) : s.stock.slice() };
}

export function pyramidKey(s: PyramidState): string {
  return `${s.pyramid.map((c) => (c === -1 ? '' : c)).join(',')}|${s.stock.join(',')}|${s.waste.join(',')}|${s.recycles}`;
}

export function pyramidHeuristic(s: PyramidState): number {
  let free = 0;
  for (let i = 0; i < 28; i++) if (isFree(s, i)) free++;
  // Cards removed high in the pyramid are worth more: they are the hardest to reach.
  let depth = 0;
  s.pyramid.forEach((c, i) => {
    if (c === -1) depth += 6 - rowOf(i);
  });
  return 20 * removedCount(s) + 2 * depth + free - 3 * s.recycles;
}

export function planPyramid(
  root: PyramidState,
  budget: number,
  deadline = Infinity,
): { path: string[]; won: boolean; nodes: number } {
  interface Node {
    s: PyramidState;
    parent: Node | null;
    move: string;
    h: number;
  }
  const seen = new Set<string>([pyramidKey(root)]);
  const rootNode: Node = { s: root, parent: null, move: '', h: pyramidHeuristic(root) };
  let best = rootNode;
  const queue: Node[] = [rootNode];
  let nodes = 0;
  const line = (n: Node) => {
    const out: string[] = [];
    for (let c: Node | null = n; c && c.parent; c = c.parent) out.push(c.move);
    return out.reverse();
  };
  while (queue.length && nodes < budget) {
    if (nodes % 128 === 0 && performance.now() > deadline) break;
    let bi = 0;
    for (let q = 1; q < queue.length; q++) if (queue[q]!.h > queue[bi]!.h) bi = q;
    const node = queue.splice(bi, 1)[0]!;
    for (const m of legalPyramidMoves(node.s)) {
      const s = movePyramid(node.s, m);
      const key = pyramidKey(s);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes++;
      const child: Node = { s, parent: node, move: m, h: pyramidHeuristic(s) };
      if (s.pyramid.every((c) => c === -1)) return { path: line(child), won: true, nodes };
      if (child.h > best.h) best = child;
      // A draw that turns up an unknown card: nothing can be planned beyond it.
      if (m === 'draw' && (s.waste[s.waste.length - 1] ?? 0) < -1) continue;
      queue.push(child);
    }
  }
  return { path: line(best), won: false, nodes };
}

export class PyramidPlannerAgent implements Agent<PyramidState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private plan: { at: number; moves: string[] } | null = null;

  constructor(
    private readonly budget: number,
    meta: { id: string; label: string },
  ) {
    this.id = meta.id;
    this.label = meta.label;
  }

  selectAction(
    _env: GameEnvironment<PyramidState, string>,
    s: PyramidState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = legalPyramidMoves(s);
    if (this.plan && this.plan.at === s.history.length && this.plan.moves.length) {
      const m = this.plan.moves.shift()!;
      this.plan.at++;
      if (legal.includes(m)) return m;
    }
    this.plan = null;
    const deadline = ctx.timeLimitMs ? performance.now() + ctx.timeLimitMs : Infinity;
    const found = planPyramid(maskPyramid(s), this.budget, deadline);
    this.lastStats = { nodes: found.nodes, value: found.won ? 1 : 0 };
    if (found.won && found.path.length > 1)
      this.plan = { at: s.history.length + 1, moves: found.path.slice(1) };
    const first = found.path[0];
    if (first && legal.includes(first)) return first;
    return legal.includes('draw') ? 'draw' : ctx.rng.pick(legal);
  }
}

/** Removes pyramid pairs first (deepest first), then pairs with the waste, then draws. */
export class PyramidGreedyAgent implements Agent<PyramidState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  selectAction(_env: GameEnvironment<PyramidState, string>, s: PyramidState): string {
    const legal = legalPyramidMoves(s);
    const score = (m: string) => {
      if (m === 'draw') return 0;
      return m
        .split('+')
        .reduce((a, at) => a + (at === 'w' ? 5 : 10 + (6 - rowOf(Number(at.slice(1))))), 0);
    };
    let best = legal[0]!;
    for (const m of legal) if (score(m) > score(best)) best = m;
    return best;
  }
}

export const AGENT_PRESETS: AgentPreset<PyramidState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Plays any legal move.', es: 'Juega cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy', es: 'Codicioso' },
    description: {
      en: 'Removes pyramid pairs first, then pairs with the waste, then draws.',
      es: 'Quita primero parejas de la pirámide, luego con el descarte, y si no roba.',
    },
    create: () => new PyramidGreedyAgent(),
  },
  {
    id: 'planner',
    kind: 'search',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Searches ahead over the cards it can see (the stock stays unknown until seen).',
      es: 'Busca por delante con las cartas que ve (el mazo es desconocido hasta verlo).',
    },
    create: () => new PyramidPlannerAgent(20_000, { id: 'planner', label: 'Planner' }),
  },
];
