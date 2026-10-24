/**
 * Spider agents. They never peek: the planner searches a masked view where face-down cards and the
 * stock are unknown placeholders. A deal turns up ten unknown cards, so the search never looks past
 * one; the planner plays toward the best position its moves can reach (runs removed, cards turned
 * up, empty columns, cards resting on their own suit) and deals when nothing improves, first
 * filling any empty column. The greedy player follows fixed priorities.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { rankOf, suitOf } from '../cards/cards';
import {
  canDeal,
  faceDown,
  legalSpiderMoves,
  moveSpider,
  runStart,
  type SpiderState,
} from './engine';

export const HIDDEN = -1;

export function maskSpider(s: SpiderState): SpiderState {
  return {
    ...s,
    stock: s.stock.map(() => HIDDEN),
    columns: s.columns.map((p, i) => p.map((c, k) => (k < s.down[i]! ? HIDDEN : c))),
  };
}

export function spiderKey(s: SpiderState): string {
  return `${s.stock.length}|${s.completed.length}|${s.columns.map((p, i) => `${s.down[i]}:${p.join('.')}`).join('/')}`;
}

/** Cards resting on the next rank of their own suit, and on any next rank. */
function order(s: SpiderState) {
  let same = 0;
  let any = 0;
  s.columns.forEach((p, i) => {
    for (let k = s.down[i]! + 1; k < p.length; k++) {
      const a = p[k - 1]!;
      const b = p[k]!;
      if (rankOf(b) === rankOf(a) - 1) {
        any++;
        if (suitOf(a) === suitOf(b)) same++;
      }
    }
  });
  return { same, any };
}

export function spiderHeuristic(s: SpiderState): number {
  const { same, any } = order(s);
  const empty = s.columns.filter((p) => p.length === 0).length;
  return 200 * s.completed.length - 12 * faceDown(s) + 6 * empty + 3 * same + 1 * any;
}

/** Moves worth searching: ones that turn a card up, empty a column, or improve the build. */
export function usefulSpiderMoves(s: SpiderState): string[] {
  return legalSpiderMoves(s).filter((m) => {
    if (m === 'deal') return false;
    const [from, to] = m.split('>') as [string, string];
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
    const p = s.columns[i]!;
    const q = s.columns[Number(to.slice(1))]!;
    if (k === s.down[i]) return true; // turns a card up (or empties the column)
    if (q.length === 0) return k === runStart(s, i); // a whole run to an empty column
    const below = p[k - 1]!;
    const onto = q[q.length - 1]!;
    // Splitting a run is useful only to land on the same suit where it now sits on another.
    return (
      (suitOf(onto) === suitOf(p[k]!) && suitOf(below) !== suitOf(p[k]!)) ||
      rankOf(below) !== rankOf(p[k]!) + 1
    );
  });
}

export function planSpider(
  root: SpiderState,
  budget: number,
  deadline = Infinity,
  avoid: ReadonlySet<string> = new Set(),
): { path: string[]; gain: number; nodes: number } {
  interface Node {
    s: SpiderState;
    parent: Node | null;
    move: string;
    depth: number;
    h: number;
  }
  const seen = new Set<string>(avoid);
  seen.add(spiderKey(root));
  const h0 = spiderHeuristic(root);
  const rootNode: Node = { s: root, parent: null, move: '', depth: 0, h: h0 };
  let best = rootNode;
  const queue: Node[] = [rootNode];
  let nodes = 0;
  while (queue.length && nodes < budget) {
    if (nodes % 128 === 0 && performance.now() > deadline) break;
    // Pick the most promising node (a linear scan keeps this simple; queues stay small).
    let bi = 0;
    for (let q = 1; q < queue.length; q++)
      if (queue[q]!.h - queue[q]!.depth > queue[bi]!.h - queue[bi]!.depth) bi = q;
    const node = queue.splice(bi, 1)[0]!;
    for (const m of usefulSpiderMoves(node.s)) {
      const s = moveSpider(node.s, m);
      const key = spiderKey(s);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes++;
      const child: Node = {
        s,
        parent: node,
        move: m,
        depth: node.depth + 1,
        h: spiderHeuristic(s),
      };
      if (child.h > best.h) best = child;
      // Turning up an unknown card ends a line: what comes next cannot be known yet.
      if (faceDown(s) < faceDown(node.s)) continue;
      queue.push(child);
    }
  }
  const path: string[] = [];
  for (let c: Node | null = best; c && c.parent; c = c.parent) path.push(c.move);
  return { path: path.reverse(), gain: best.h - h0, nodes };
}

/** A move into an empty column (needed before dealing): the top card of the tallest column. */
function fillEmpty(s: SpiderState): string | null {
  const empty = s.columns.findIndex((p) => p.length === 0);
  if (empty === -1) return null;
  let from = -1;
  s.columns.forEach((p, i) => {
    if (p.length > 1 && (from === -1 || p.length > s.columns[from]!.length)) from = i;
  });
  return from === -1 ? null : `c${from}:${s.columns[from]!.length - 1}>c${empty}`;
}

export class SpiderPlannerAgent implements Agent<SpiderState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private visited = new Set<string>();
  private game = '';

  constructor(
    private readonly budget: number,
    meta: { id: string; label: string },
  ) {
    this.id = meta.id;
    this.label = meta.label;
  }

  selectAction(
    _env: GameEnvironment<SpiderState, string>,
    s: SpiderState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const game = `${s.seed}/${s.suits}`;
    if (this.game !== game || s.history.length === 0) {
      this.game = game;
      this.visited.clear();
    }
    const view = maskSpider(s);
    this.visited.add(spiderKey(view));
    const deadline = ctx.timeLimitMs ? performance.now() + ctx.timeLimitMs : Infinity;
    const found = planSpider(view, this.budget, deadline, this.visited);
    this.lastStats = { nodes: found.nodes };
    if (found.path.length && found.gain > 0) return found.path[0]!;
    if (canDeal(s)) return 'deal';
    const fill = s.stock.length ? fillEmpty(s) : null;
    if (fill && legalSpiderMoves(s).includes(fill)) return fill;
    const legal = legalSpiderMoves(s);
    const fresh = legal.filter((m) => !this.visited.has(spiderKey(maskSpider(moveSpider(s, m)))));
    return ctx.rng.pick(fresh.length ? fresh : legal);
  }
}

/** Fixed priorities: turn cards up, build on the same suit, build on any suit, deal. */
export class SpiderGreedyAgent implements Agent<SpiderState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  private seen = new Set<string>();
  selectAction(
    _env: GameEnvironment<SpiderState, string>,
    s: SpiderState,
    _p: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (s.history.length === 0) this.seen.clear();
    this.seen.add(spiderKey(s));
    const score = (m: string) => {
      if (m === 'deal') return 1;
      const [from, to] = m.split('>') as [string, string];
      const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
      const q = s.columns[Number(to.slice(1))]!;
      let v = 0;
      if (k === s.down[i] && k > 0) v += 50;
      if (q.length && suitOf(q[q.length - 1]!) === suitOf(s.columns[i]![k]!)) v += 20;
      if (!q.length) v -= 10;
      return v + 5;
    };
    const legal = legalSpiderMoves(s).filter(
      (m) => m === 'deal' || !this.seen.has(spiderKey(moveSpider(s, m))),
    );
    if (!legal.length) {
      const fill = fillEmpty(s);
      return fill && legalSpiderMoves(s).includes(fill) ? fill : ctx.rng.pick(legalSpiderMoves(s));
    }
    let best = legal[0]!;
    for (const m of legal) if (score(m) > score(best)) best = m;
    if (best === 'deal' || score(best) <= 5) {
      if (canDeal(s)) return 'deal';
      const fill = fillEmpty(s);
      if (fill && s.stock.length && legalSpiderMoves(s).includes(fill)) return fill;
    }
    return best;
  }
}
