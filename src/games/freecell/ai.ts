/**
 * FreeCell agents. Every card is face up, so the planner is a real solver: a best-first search over
 * positions (columns and cells in any order count as the same position), with safe plays to the
 * foundations made automatically, scoring cards home, cards buried above the next card each suit
 * needs, and free space. It replays the winning line it finds; otherwise it plays toward the best
 * position seen. The greedy player follows fixed priorities.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { rankOf, suitOf } from '../shared/cards/cards';
import {
  homeCount,
  legalFreeCellMoves,
  moveFreeCell,
  safeAutoMove,
  sequenceStart,
  type FreeCellState,
} from './engine';

/** Position key: columns and cells sorted, so equivalent arrangements are searched once. */
export function freeCellKey(s: FreeCellState): string {
  const cols = s.columns.map((p) => p.join('.')).sort();
  const cells = s.cells.filter((c) => c !== -1).sort((a, b) => a - b);
  return `${s.foundations.map((f) => f.length).join(',')}|${cells.join(',')}|${cols.join('/')}`;
}

export function freeCellHeuristic(s: FreeCellState): number {
  // The next rank each suit needs (suits by their foundation, if started).
  const next = [1, 1, 1, 1];
  for (const f of s.foundations) if (f.length) next[suitOf(f[0]!)] = f.length + 1;
  let buried = 0;
  let disorder = 0;
  for (const p of s.columns) {
    p.forEach((c, k) => {
      if (rankOf(c) === next[suitOf(c)]) buried += p.length - 1 - k;
    });
    disorder += sequenceStart(p);
  }
  const free = s.cells.filter((c) => c === -1).length;
  const empty = s.columns.filter((p) => p.length === 0).length;
  return 30 * homeCount(s) - 4 * buried - 1 * disorder + 3 * free + 6 * empty;
}

/** Plays safe foundation moves after `s` (part of every search step). */
function settle(s: FreeCellState, path: string[]): FreeCellState {
  for (let m = safeAutoMove(s); m; m = safeAutoMove(s)) {
    s = moveFreeCell(s, m);
    path.push(m);
  }
  return s;
}

/** Search moves: one free cell is as good as another, so only the first empty one is tried. */
function searchMoves(s: FreeCellState): string[] {
  const firstFree = s.cells.indexOf(-1);
  const firstEmpty = s.columns.findIndex((p) => p.length === 0);
  return legalFreeCellMoves(s).filter((m) => {
    const [, to] = m.split('>') as [string, string];
    if (to[0] === 'r') return Number(to.slice(1)) === firstFree;
    if (to[0] === 'c' && s.columns[Number(to.slice(1))]!.length === 0)
      return Number(to.slice(1)) === firstEmpty;
    return true;
  });
}

export function solveFreeCell(
  root: FreeCellState,
  budget: number,
  deadline = Infinity,
  avoid: ReadonlySet<string> = new Set(),
): { path: string[]; won: boolean; nodes: number } {
  interface Node {
    s: FreeCellState;
    parent: Node | null;
    moves: string[];
    depth: number;
    score: number;
    h: number;
  }
  const seen = new Set<string>(avoid);
  seen.add(freeCellKey(root));
  const h0 = freeCellHeuristic(root);
  const rootNode: Node = { s: root, parent: null, moves: [], depth: 0, score: h0, h: h0 };
  let best = rootNode;
  const heap: Node[] = [rootNode];
  const push = (n: Node) => {
    heap.push(n);
    let i = heap.length - 1;
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (heap[up]!.score >= n.score) break;
      heap[i] = heap[up]!;
      i = up;
    }
    heap[i] = n;
  };
  const pop = (): Node => {
    const first = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        const sc = (k: number) => (k === i ? last.score : heap[k]!.score);
        if (l < heap.length && heap[l]!.score > sc(m)) m = l;
        if (r < heap.length && heap[r]!.score > sc(m)) m = r;
        if (m === i) break;
        heap[i] = heap[m]!;
        i = m;
      }
      heap[i] = last;
    }
    return first;
  };
  const line = (n: Node) => {
    const out: string[][] = [];
    for (let c: Node | null = n; c && c.parent; c = c.parent) out.push(c.moves);
    return out.reverse().flat();
  };
  let nodes = 0;
  while (heap.length && nodes < budget) {
    if (nodes % 128 === 0 && performance.now() > deadline) break;
    const node = pop();
    for (const m of searchMoves(node.s)) {
      const moves = [m];
      const s = settle(moveFreeCell(node.s, m), moves);
      const key = freeCellKey(s);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes++;
      const h = freeCellHeuristic(s);
      const child: Node = {
        s,
        parent: node,
        moves,
        depth: node.depth + 1,
        score: h - 2 * (node.depth + 1),
        h,
      };
      if (homeCount(s) === 52) return { path: line(child), won: true, nodes };
      if (h > best.h) best = child;
      push(child);
    }
  }
  return { path: line(best), won: false, nodes };
}

/** Fixed priorities: safe cards home, cards home, runs onto columns, then a free cell. */
export function scoreFreeCellMove(s: FreeCellState, m: string): number {
  const [from, to] = m.split('>') as [string, string];
  if (m === safeAutoMove(s)) return 100;
  if (to[0] === 'f') return 80;
  const fromColumn = from[0] === 'c' ? s.columns[Number(from.slice(1, 2))]! : null;
  // Emptying a column or uncovering cards beneath a run is worth something.
  const uncovers = fromColumn ? Number(from.split(':')[1] ?? fromColumn.length - 1) : 0;
  if (to[0] === 'c') {
    const target = s.columns[Number(to.slice(1))]!;
    if (from[0] === 'r') return target.length ? 70 : 25;
    return (target.length ? 50 : 15) + (uncovers === 0 ? 8 : 0) - uncovers * 0.1;
  }
  return 5 - uncovers * 0.1; // to a free cell
}

export function greedyFreeCellMove(s: FreeCellState): string {
  const legal = legalFreeCellMoves(s);
  let best = legal[0]!;
  for (const m of legal) if (scoreFreeCellMove(s, m) > scoreFreeCellMove(s, best)) best = m;
  return best;
}

export class FreeCellGreedyAgent implements Agent<FreeCellState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  private seen = new Set<string>();
  selectAction(
    _env: GameEnvironment<FreeCellState, string>,
    s: FreeCellState,
    _p: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (s.history.length === 0) this.seen.clear();
    this.seen.add(freeCellKey(s));
    // The best-scoring move that does not walk back into a position already seen.
    const fresh = legalFreeCellMoves(s).filter(
      (m) => !this.seen.has(freeCellKey(moveFreeCell(s, m))),
    );
    if (!fresh.length) return ctx.rng.pick(legalFreeCellMoves(s));
    let best = fresh[0]!;
    for (const m of fresh) if (scoreFreeCellMove(s, m) > scoreFreeCellMove(s, best)) best = m;
    return best;
  }
}

export class FreeCellSolverAgent implements Agent<FreeCellState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private plan: { at: number; moves: string[] } | null = null;
  private visited = new Set<string>();
  private game = -1;

  constructor(
    private readonly budget: number,
    meta: { id: string; label: string },
  ) {
    this.id = meta.id;
    this.label = meta.label;
  }

  selectAction(
    _env: GameEnvironment<FreeCellState, string>,
    s: FreeCellState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (this.game !== s.seed || s.history.length === 0) {
      this.game = s.seed;
      this.visited.clear();
      this.plan = null;
    }
    if (this.plan && this.plan.at === s.history.length && this.plan.moves.length) {
      const m = this.plan.moves.shift()!;
      this.plan.at++;
      if (legalFreeCellMoves(s).includes(m)) return m;
    }
    this.plan = null;
    this.visited.add(freeCellKey(s));
    const deadline = ctx.timeLimitMs ? performance.now() + ctx.timeLimitMs : Infinity;
    const found = solveFreeCell(s, this.budget, deadline, this.visited);
    this.lastStats = { nodes: found.nodes, value: found.won ? 1 : 0 };
    if (found.won && found.path.length > 1)
      this.plan = { at: s.history.length + 1, moves: found.path.slice(1) };
    const first = found.path[0];
    if (first) return first;
    const legal = legalFreeCellMoves(s);
    return (
      legal.find((m) => !this.visited.has(freeCellKey(moveFreeCell(s, m)))) ?? ctx.rng.pick(legal)
    );
  }
}

export const AGENT_PRESETS: AgentPreset<FreeCellState, string>[] = [
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
      en: 'Fixed priorities: cards home, runs onto columns, free cells last.',
      es: 'Prioridades fijas: cartas a casa, escaleras a columnas y celdas libres al final.',
    },
    create: () => new FreeCellGreedyAgent(),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Solver', es: 'Resolutor' },
    description: {
      en: 'Best-first search for a complete solution (every card is visible in FreeCell).',
      es: 'Búsqueda del mejor primero de una solución completa (en FreeCell todo está a la vista).',
    },
    create: () => new FreeCellSolverAgent(60_000, { id: 'solver', label: 'Solver' }),
  },
];
