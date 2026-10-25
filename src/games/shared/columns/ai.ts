/**
 * Agents for the column patiences. They never peek: face-down cards and the stock are unknown in
 * the masked view. The planner searches best-first over every move (a deal or a card turned up
 * ends a line, since what comes next is unknown), never stepping back into a recent position of the
 * game so it cannot loop, and scores cards home, cards turned up, empty columns and cards resting in sequence.
 * When nothing improves it deals (or turns the stock). The greedy player follows fixed priorities.
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import {
  faceDown,
  homeCount,
  legalColumnsMoves,
  moveColumns,
  stacks,
  type ColumnsState,
  type ColumnsVariant,
} from './engine';

export const UNKNOWN = -2;

export function maskColumns(s: ColumnsState): ColumnsState {
  return {
    ...s,
    stock: s.stock.map(() => UNKNOWN),
    columns: s.columns.map((p, i) => p.map((c, k) => (k < s.down[i]! ? UNKNOWN : c))),
  };
}

export function columnsKey(s: ColumnsState): string {
  return `${s.stock.length}|${s.waste.join(',')}|${s.foundations.map((f) => f.length).join(',')}|${s.runs.length}|${s.columns.map((p, i) => `${s.down[i]}:${p.join('.')}`).join('/')}`;
}

export function columnsHeuristic(v: ColumnsVariant, s: ColumnsState): number {
  let ordered = 0;
  s.columns.forEach((p, i) => {
    for (let k = s.down[i]! + 1; k < p.length; k++) if (stacks(v, p[k - 1]!, p[k]!)) ordered++;
  });
  const empty = s.columns.filter((p) => p.length === 0).length;
  return 20 * homeCount(s) - 8 * faceDown(s) + 3 * empty + ordered;
}

export function planColumns(
  v: ColumnsVariant,
  root: ColumnsState,
  budget: number,
  deadline = Infinity,
  avoid: ReadonlySet<string> = new Set(),
): { path: string[]; gain: number; nodes: number } {
  interface Node {
    s: ColumnsState;
    parent: Node | null;
    move: string;
    depth: number;
    h: number;
  }
  // Real progress: cards home, cards turned up or columns emptied (not just tidier columns).
  // In same-suit games the runs being built are progress too.
  const inSuit = (x: ColumnsState) => {
    if (v.build !== 'suit') return 0;
    let n = 0;
    x.columns.forEach((p, i) => {
      for (let k = x.down[i]! + 1; k < p.length; k++) if (stacks(v, p[k - 1]!, p[k]!)) n++;
    });
    return n;
  };
  const progress = (x: ColumnsState) =>
    20 * homeCount(x) -
    25 * faceDown(x) +
    3 * x.columns.filter((p) => p.length === 0).length +
    4 * inSuit(x);
  let found = false;
  const seen = new Set<string>([columnsKey(root)]);
  const h0 = columnsHeuristic(v, root);
  const rootNode: Node = { s: root, parent: null, move: '', depth: 0, h: h0 };
  let best = rootNode;
  const queue: Node[] = [rootNode];
  let nodes = 0;
  while (queue.length && nodes < budget) {
    if (nodes % 128 === 0 && performance.now() > deadline) break;
    // Breadth first: the shortest line to real progress is preferred over a longer, richer one
    // (long reshuffles tend to bury cards that are still needed).
    const node = queue.shift()!;
    if (found && node.depth >= best.depth) break;
    for (const m of legalColumnsMoves(v, node.s)) {
      if (m === 'deal') continue;
      const s = moveColumns(v, node.s, m);
      const key = columnsKey(s);
      // Recently played positions are off limits as a first step, so the agent cannot go round in
      // circles; deeper in the search any position may be passed through once.
      if (seen.has(key) || (node === rootNode && avoid.has(key))) continue;
      seen.add(key);
      nodes++;
      const child: Node = {
        s,
        parent: node,
        move: m,
        depth: node.depth + 1,
        h: columnsHeuristic(v, s),
      };
      // The first depth with real progress settles it: its best line wins.
      if (
        progress(s) > progress(root) &&
        (!found || (child.depth === best.depth && progress(s) > progress(best.s)))
      ) {
        if (!found || child.depth === best.depth) best = child;
        found = true;
      }
      if (faceDown(s) < faceDown(node.s)) continue; // an unknown card turned up
      queue.push(child);
    }
  }
  const path: string[] = [];
  for (let c: Node | null = best; c && c.parent; c = c.parent) path.push(c.move);
  return { path: path.reverse(), gain: progress(best.s) - progress(root), nodes };
}

export class ColumnsPlannerAgent implements Agent<ColumnsState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  /** The most recent positions of the game (oldest first). */
  private recent: string[] = [];
  private game = -1;

  constructor(
    private readonly v: ColumnsVariant,
    private readonly budget: number,
    meta: { id: string; label: string },
  ) {
    this.id = meta.id;
    this.label = meta.label;
  }

  selectAction(
    _env: GameEnvironment<ColumnsState, string>,
    s: ColumnsState,
    _p: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (this.game !== s.seed || s.history.length === 0) {
      this.game = s.seed;
      this.recent = [];
    }
    const view = maskColumns(s);
    this.recent.push(columnsKey(view));
    if (this.recent.length > 40) this.recent.shift();
    const avoid = new Set(this.recent);
    const deadline = ctx.timeLimitMs ? performance.now() + ctx.timeLimitMs : Infinity;
    const found = planColumns(this.v, view, this.budget, deadline, avoid);
    this.lastStats = { nodes: found.nodes };
    const legal = legalColumnsMoves(this.v, s);
    if (found.path.length && found.gain > 0 && legal.includes(found.path[0]!))
      return found.path[0]!;
    if (legal.includes('deal')) return 'deal';
    // Nothing to gain in sight: fall back on the greedy priorities, avoiding recent positions.
    return greedyColumnsMove(this.v, s, avoid, ctx);
  }
}

/** Fixed priorities among moves that do not return to an avoided position. */
export function greedyColumnsMove(
  v: ColumnsVariant,
  s: ColumnsState,
  avoid: ReadonlySet<string>,
  ctx: DecisionContext,
): string {
  const legal = legalColumnsMoves(v, s);
  const fresh = legal.filter(
    (m) => m === 'deal' || !avoid.has(columnsKey(maskColumns(moveColumns(v, s, m)))),
  );
  if (!fresh.length) return ctx.rng.pick(legal);
  const score = (m: string) => {
    if (m === 'deal') return 1;
    if (m.includes('>f')) return 100;
    const [from] = m.split('>') as [string];
    if (from === 'w') return 40;
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
    if (k === s.down[i] && k > 0) return 60;
    return 5;
  };
  return fresh.reduce((a, b) => (score(b) > score(a) ? b : a));
}

/** Fixed priorities: cards home, moves that turn a card up, waste to columns, others, then deal. */
export class ColumnsGreedyAgent implements Agent<ColumnsState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  private seen = new Set<string>();
  constructor(private readonly v: ColumnsVariant) {}
  selectAction(
    _env: GameEnvironment<ColumnsState, string>,
    s: ColumnsState,
    _p: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (s.history.length === 0) this.seen.clear();
    this.seen.add(columnsKey(maskColumns(s)));
    return greedyColumnsMove(this.v, s, this.seen, ctx);
  }
}

export function columnsPresets(
  v: ColumnsVariant,
  budget = 6000,
): AgentPreset<ColumnsState, string>[] {
  return [
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
        en: 'Fixed priorities: cards home, turn cards up, then deal.',
        es: 'Prioridades fijas: cartas a casa, destapar cartas y luego repartir.',
      },
      create: () => new ColumnsGreedyAgent(v),
    },
    {
      id: 'planner',
      kind: 'search',
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches ahead over the cards it can see (never peeking at face-down cards).',
        es: 'Busca por delante con las cartas que ve (sin mirar las cartas boca abajo).',
      },
      create: () => new ColumnsPlannerAgent(v, budget, { id: 'planner', label: 'Planner' }),
    },
  ];
}
