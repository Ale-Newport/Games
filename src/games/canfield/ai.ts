/**
 * Canfield agents. They never peek: the reserve below its top card, and the stock until it has
 * been gone through once, are unknown. The planner searches best-first over every move (a move
 * that turns up an unknown card ends a line), never stepping back into a recent position, scoring
 * cards home and the reserve emptied; it draws when nothing improves. The greedy player follows
 * fixed priorities.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { homeCount, legalCanfieldMoves, moveCanfield, stacks, type CanfieldState } from './engine';

export const UNKNOWN = -2;

export function maskCanfield(s: CanfieldState): CanfieldState {
  return {
    ...s,
    reserve: s.reserve.map((c, i) => (i === s.reserve.length - 1 ? c : UNKNOWN)),
    stock: s.recycles === 0 ? s.stock.map(() => UNKNOWN) : s.stock.slice(),
  };
}

export const canfieldKey = (s: CanfieldState) =>
  `${s.reserve.length}|${s.stock.join(',')}|${s.waste.join(',')}|${s.foundations.map((f) => f.length).join(',')}|${s.tableau.map((p) => p.join('.')).join('/')}`;

function heuristic(s: CanfieldState): number {
  let ordered = 0;
  for (const p of s.tableau)
    for (let k = 1; k < p.length; k++) if (stacks(p[k - 1]!, p[k]!)) ordered++;
  return 20 * homeCount(s) - 8 * s.reserve.length + ordered;
}

const unknownShown = (s: CanfieldState) =>
  s.reserve[s.reserve.length - 1] === UNKNOWN || s.waste[s.waste.length - 1] === UNKNOWN;

export function planCanfield(
  root: CanfieldState,
  budget: number,
  avoid: ReadonlySet<string>,
): { path: string[]; gain: number; nodes: number } {
  interface Node {
    s: CanfieldState;
    parent: Node | null;
    move: string;
    depth: number;
    h: number;
  }
  const seen = new Set<string>([canfieldKey(root)]);
  const r: Node = { s: root, parent: null, move: '', depth: 0, h: heuristic(root) };
  let best = r;
  const queue: Node[] = [r];
  let nodes = 0;
  while (queue.length && nodes < budget) {
    let bi = 0;
    for (let q = 1; q < queue.length; q++)
      if (queue[q]!.h - queue[q]!.depth > queue[bi]!.h - queue[bi]!.depth) bi = q;
    const node = queue.splice(bi, 1)[0]!;
    for (const m of legalCanfieldMoves(node.s)) {
      const s = moveCanfield(node.s, m);
      const key = canfieldKey(s);
      if (seen.has(key) || (node === r && avoid.has(key))) continue;
      seen.add(key);
      nodes++;
      const child: Node = { s, parent: node, move: m, depth: node.depth + 1, h: heuristic(s) };
      if (child.h > best.h) best = child;
      if (!unknownShown(s)) queue.push(child);
    }
  }
  const path: string[] = [];
  for (let c: Node | null = best; c && c.parent; c = c.parent) path.push(c.move);
  return { path: path.reverse(), gain: best.h - r.h, nodes };
}

export class CanfieldPlannerAgent implements Agent<CanfieldState, string> {
  readonly id = 'planner';
  readonly label = 'Planner';
  lastStats?: DecisionStats;
  private recent: string[] = [];
  private game = -1;
  constructor(private readonly budget: number) {}
  selectAction(
    _env: GameEnvironment<CanfieldState, string>,
    s: CanfieldState,
    _p: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (this.game !== s.seed || s.history.length === 0) {
      this.game = s.seed;
      this.recent = [];
    }
    const view = maskCanfield(s);
    this.recent.push(canfieldKey(view));
    if (this.recent.length > 60) this.recent.shift();
    const found = planCanfield(view, this.budget, new Set(this.recent));
    this.lastStats = { nodes: found.nodes };
    const legal = legalCanfieldMoves(s);
    if (found.path.length && found.gain > 0 && legal.includes(found.path[0]!))
      return found.path[0]!;
    return legal.includes('draw') ? 'draw' : ctx.rng.pick(legal);
  }
}

/** Fixed priorities: cards home, reserve to the tableau, waste to the tableau, then draw. */
export class CanfieldGreedyAgent implements Agent<CanfieldState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  selectAction(_env: GameEnvironment<CanfieldState, string>, s: CanfieldState): string {
    const legal = legalCanfieldMoves(s);
    const score = (m: string) =>
      m.includes('>f')
        ? 100
        : m.startsWith('r>')
          ? 60
          : m.startsWith('w>')
            ? 40
            : m === 'draw'
              ? 10
              : 0;
    return legal.reduce((a, b) => (score(b) > score(a) ? b : a));
  }
}

export const AGENT_PRESETS: AgentPreset<CanfieldState, string>[] = [
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
      en: 'Fixed priorities: cards home, then the reserve, then the waste, then draw.',
      es: 'Prioridades fijas: cartas a casa, luego la reserva, el descarte y robar.',
    },
    create: () => new CanfieldGreedyAgent(),
  },
  {
    id: 'planner',
    kind: 'search',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Searches ahead over the cards it can see (never peeking at hidden cards).',
      es: 'Busca por delante con las cartas que ve (sin mirar las cartas ocultas).',
    },
    create: () => new CanfieldPlannerAgent(6000),
  },
];
