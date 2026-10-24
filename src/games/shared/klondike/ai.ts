/**
 * Klondike agents. `usefulMoves` drops moves that can only shuffle cards around (a foundation
 * card back down, a run moved without turning anything up or freeing a card), which keeps both
 * agents out of loops. The greedy player follows fixed priorities; the planner searches ahead
 * depth-first over useful moves (states never revisited) for a node budget and plays the first
 * move of the best line it finds — a won game if it can see one.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { isRed, rankOf } from '../cards/cards';
import {
  faceDownCount,
  fitsFoundation,
  foundationCount,
  legalKlondikeMoves,
  moveCards,
  type KlondikeState,
} from './engine';

/** A foundation card nobody can need on the tableau any more. */
export function safeToFoundation(s: KlondikeState, card: number): boolean {
  const r = rankOf(card);
  if (r <= 2) return true;
  const opposite = s.foundations
    .map((f) => f[f.length - 1])
    .filter((t) => t !== undefined && isRed(t) !== isRed(card))
    .map((t) => rankOf(t!));
  return opposite.length === 2 && opposite.every((x) => x >= r - 1);
}

interface Parsed {
  m: string;
  from: 'w' | 'f' | 't' | 'd';
  pile: number;
  at: number;
  to: 'f' | 't' | null;
  dest: number;
}

export function parseKlondikeMove(m: string): Parsed {
  if (m === 'draw') return { m, from: 'd', pile: -1, at: -1, to: null, dest: -1 };
  const [a, b] = m.split('>') as [string, string];
  const [pile, at] = a.slice(1).split(':').map(Number) as [number, number | undefined];
  return {
    m,
    from: a[0] as 'w' | 'f' | 't',
    pile: Number.isNaN(pile) ? -1 : pile,
    at: at ?? -1,
    to: b[0] as 'f' | 't',
    dest: Number(b.slice(1)),
  };
}

export function usefulMoves(s: KlondikeState): string[] {
  return legalKlondikeMoves(s).filter((m) => {
    const p = parseKlondikeMove(m);
    if (p.from === 'f') return false;
    if (p.from !== 't' || p.to !== 't') return true;
    const pile = s.tableau[p.pile]!;
    const down = s.down[p.pile]!;
    // A whole face-up run: useful if it turns a card up, or empties a pile (not a king already
    // at the bottom of its pile).
    if (p.at === down) return down > 0;
    // Part of a run: useful only if the card it uncovers can go to a foundation right away.
    const uncovered = pile[p.at - 1]!;
    return s.foundations.some((f) => fitsFoundation(f, uncovered));
  });
}

/** Search score: cards home, cards turned up, empty columns. Drawing alone never scores. */
export function klondikeHeuristic(s: KlondikeState): number {
  const empty = s.tableau.filter((p) => p.length === 0).length;
  return 20 * foundationCount(s) - 8 * faceDownCount(s) + 2 * empty;
}

export function stateKey(s: KlondikeState): string {
  return `${s.stock.join(',')}|${s.waste.join(',')}|${s.foundations.map((f) => f.length).join(',')}|${s.tableau.map((p, i) => `${s.down[i]}:${p.join('.')}`).join('/')}`;
}

/** Fixed priorities, no lookahead. */
export function greedyKlondikeMove(s: KlondikeState): string {
  const moves = usefulMoves(s);
  const parsed = moves.map(parseKlondikeMove);
  const score = (p: Parsed): number => {
    if (p.from === 'd') return 1;
    const card =
      p.from === 'w'
        ? s.waste[s.waste.length - 1]!
        : s.tableau[p.pile]![p.at === -1 ? s.tableau[p.pile]!.length - 1 : p.at]!;
    if (p.to === 'f') return safeToFoundation(s, card) ? 100 : 20;
    if (p.from === 't') return 60 + s.down[p.pile]!;
    return 40; // waste to tableau
  };
  let best = parsed[0];
  for (const p of parsed) if (best === undefined || score(p) > score(best)) best = p;
  return best?.m ?? legalKlondikeMoves(s)[0]!;
}

export class KlondikeGreedyAgent implements Agent<KlondikeState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  selectAction(_env: GameEnvironment<KlondikeState, string>, s: KlondikeState): string {
    return greedyKlondikeMove(s);
  }
}

/**
 * Best-first search over every legal move from `root` for `budget` expansions: the most
 * promising state (by the heuristic, slightly favoring short lines) is expanded next, and states
 * already met — in this search or earlier in the game (`avoid`) — are skipped, so lines cannot
 * loop. Returns the line to the best state found, or a won line as soon as one appears.
 */
export function planKlondike(
  root: KlondikeState,
  budget: number,
  deadline = Infinity,
  avoid: ReadonlySet<string> = new Set(),
): { path: string[]; won: boolean; nodes: number; exhausted?: boolean } {
  interface Node {
    s: KlondikeState;
    parent: Node | null;
    move: string;
    depth: number;
    score: number;
  }
  const seen = new Set<string>(avoid);
  seen.add(stateKey(root));
  const rootNode: Node = {
    s: root,
    parent: null,
    move: '',
    depth: 0,
    score: klondikeHeuristic(root),
  };
  let best = rootNode;
  // A binary heap keyed by score (max first).
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
        const score = (k: number) => (k === i ? last.score : heap[k]!.score);
        if (l < heap.length && heap[l]!.score > score(m)) m = l;
        if (r < heap.length && heap[r]!.score > score(m)) m = r;
        if (m === i) break;
        heap[i] = heap[m]!;
        i = m;
      }
      heap[i] = last;
    }
    return first;
  };
  const line = (n: Node) => {
    const out: string[] = [];
    for (let c: Node | null = n; c && c.parent; c = c.parent) out.push(c.move);
    return out.reverse();
  };
  let nodes = 0;
  while (heap.length && nodes < budget) {
    if (nodes % 128 === 0 && performance.now() > deadline) break;
    const node = pop();
    for (const m of legalKlondikeMoves(node.s)) {
      const s = moveCards(node.s, m);
      const key = stateKey(s);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes++;
      const h = klondikeHeuristic(s);
      const child: Node = {
        s,
        parent: node,
        move: m,
        depth: node.depth + 1,
        score: h - 0.5 * (node.depth + 1),
      };
      if (foundationCount(s) === 52) return { path: line(child), won: true, nodes };
      if (h > klondikeHeuristic(best.s)) best = child;
      push(child);
    }
  }
  return { path: line(best), won: false, nodes, exhausted: heap.length === 0 };
}

/** Unknown card in the masked view: never fits anywhere, so search cannot use it. */
export const HIDDEN = -1;

/**
 * What the player can know: face-down tableau cards are hidden, and so is the stock until the
 * first pass through it (after a recycle every stock card has been seen on the waste).
 */
export function maskKlondike(s: KlondikeState): KlondikeState {
  return {
    ...s,
    stock: s.recycles === 0 ? s.stock.map(() => HIDDEN) : s.stock.slice(),
    tableau: s.tableau.map((p, i) => p.map((c, k) => (k < s.down[i]! ? HIDDEN : c))),
  };
}

export class KlondikePlannerAgent implements Agent<KlondikeState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  /** A winning line found earlier, replayed while the game follows it. */
  private plan: { history: number; moves: string[] } | null = null;
  private visited = new Set<string>();
  private game = -1;
  private hopeless = false;

  constructor(
    private readonly budget: number,
    meta: { id: string; label: string },
  ) {
    this.id = meta.id;
    this.label = meta.label;
  }

  selectAction(
    _env: GameEnvironment<KlondikeState, string>,
    s: KlondikeState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (this.plan && this.plan.history === s.history.length && this.plan.moves.length) {
      const m = this.plan.moves.shift()!;
      this.plan.history++;
      if (legalKlondikeMoves(s).includes(m)) return m;
    }
    this.plan = null;
    const deadline = ctx.timeLimitMs ? performance.now() + ctx.timeLimitMs : Infinity;
    // Plan on what a player can see: hidden cards are inert placeholders. Positions already
    // reached in this game are off limits, so the agent never walks in circles.
    const view = maskKlondike(s);
    if (this.game !== s.seed || s.history.length === 0) {
      this.game = s.seed;
      this.visited.clear();
      this.hopeless = false;
    }
    this.visited.add(stateKey(view));
    // Once a search has found nothing that improves (no card can come home, turn up or free a
    // column within its budget), there is nothing left to look for: just draw.
    if (this.hopeless)
      return legalKlondikeMoves(s).includes('draw') ? 'draw' : legalKlondikeMoves(s)[0]!;
    const found = planKlondike(view, this.budget, deadline, this.visited);
    // No line within the budget brings a card home or turns one up: treat the deal as lost.
    // (Not while unseen stock cards remain: drawing them still tells something new.)
    if (found.path.length === 0 && (s.recycles > 0 || s.stock.length === 0)) this.hopeless = true;
    this.lastStats = { nodes: found.nodes, value: found.won ? 1 : 0 };
    if (found.won && found.path.length > 1)
      this.plan = { history: s.history.length + 1, moves: found.path.slice(1) };
    return found.path[0] ?? greedyKlondikeMove(s);
  }
}
