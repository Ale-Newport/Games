/**
 * Agents for the up-or-down solitaires. They never peek: in the masked view covered TriPeaks cards
 * and the stock are unknown. The planner searches chains of plays best-first (a play that turns up
 * an unknown card ends a line), scoring cards cleared and how many free cards still fit the
 * waste, and draws when no chain helps. The greedy player plays whatever fits — preferring cards
 * that uncover others — and otherwise draws.
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import {
  clearedCount,
  fits,
  isFree,
  legalUpDownMoves,
  moveUpDown,
  type UpDownLayout,
  type UpDownState,
} from './engine';

export const UNKNOWN = -2;

export function maskUpDown(L: UpDownLayout, s: UpDownState): UpDownState {
  return {
    ...s,
    stock: s.stock.map(() => UNKNOWN),
    tableau: s.tableau.map((c, i) => (c !== -1 && L.hidden && !isFree(L, s, i) ? UNKNOWN : c)),
  };
}

export function upDownKey(s: UpDownState): string {
  return `${s.tableau.join(',')}|${s.stock.length}|${s.waste[s.waste.length - 1]}`;
}

function heuristic(L: UpDownLayout, s: UpDownState): number {
  const top = s.waste[s.waste.length - 1]!;
  let fitting = 0;
  let free = 0;
  let turned = 0;
  s.tableau.forEach((c, i) => {
    if (c === -1 || !isFree(L, s, i)) return;
    // An unknown card set free will turn up: new options, whatever it is.
    if (c === UNKNOWN) turned++;
    else {
      free++;
      if (fits(L, top, c)) fitting++;
    }
  });
  return 10 * clearedCount(s) + 6 * turned + 2 * fitting + 0.5 * free;
}

/** How many cards a chain of plays can clear (and the chain), within a node budget. */
export function planUpDown(
  L: UpDownLayout,
  root: UpDownState,
  budget: number,
): { path: string[]; cleared: number; gain: number; nodes: number } {
  interface Node {
    s: UpDownState;
    parent: Node | null;
    move: string;
    h: number;
  }
  const seen = new Set<string>([upDownKey(root)]);
  const rootNode: Node = { s: root, parent: null, move: '', h: heuristic(L, root) };
  let best = rootNode;
  const queue: Node[] = [rootNode];
  let nodes = 0;
  while (queue.length && nodes < budget) {
    let bi = 0;
    for (let q = 1; q < queue.length; q++) if (queue[q]!.h > queue[bi]!.h) bi = q;
    const node = queue.splice(bi, 1)[0]!;
    for (const m of legalUpDownMoves(L, node.s)) {
      if (m === 'draw' || node.s.waste[node.s.waste.length - 1] === UNKNOWN) continue;
      const s = moveUpDown(L, node.s, m);
      const key = upDownKey(s);
      if (seen.has(key)) continue;
      seen.add(key);
      nodes++;
      const child: Node = { s, parent: node, move: m, h: heuristic(L, s) };
      if (child.h > best.h) best = child;
      queue.push(child);
    }
  }
  const path: string[] = [];
  for (let c: Node | null = best; c && c.parent; c = c.parent) path.push(c.move);
  return {
    path: path.reverse(),
    cleared: clearedCount(best.s) - clearedCount(root),
    gain: best.h - rootNode.h,
    nodes,
  };
}

export class UpDownPlannerAgent implements Agent<UpDownState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  constructor(
    private readonly L: UpDownLayout,
    private readonly budget: number,
    meta: { id: string; label: string },
  ) {
    this.id = meta.id;
    this.label = meta.label;
  }

  selectAction(
    _env: GameEnvironment<UpDownState, string>,
    s: UpDownState,
    _p: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = legalUpDownMoves(this.L, s);
    const found = planUpDown(this.L, maskUpDown(this.L, s), this.budget);
    this.lastStats = { nodes: found.nodes };
    const first = found.path[0];
    if (first && found.gain > 0 && legal.includes(first)) return first;
    return legal.includes('draw') ? 'draw' : ctx.rng.pick(legal);
  }
}

export class UpDownGreedyAgent implements Agent<UpDownState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  constructor(private readonly L: UpDownLayout) {}
  selectAction(_env: GameEnvironment<UpDownState, string>, s: UpDownState): string {
    const legal = legalUpDownMoves(this.L, s);
    const plays = legal.filter((m) => m !== 'draw');
    if (!plays.length) return legal[0]!;
    // Prefer the card whose removal frees the most others.
    const frees = (m: string) => {
      const i = Number(m.slice(1));
      return this.L.coveredBy.filter((cov, j) => s.tableau[j]! >= 0 && cov.includes(i)).length;
    };
    return plays.reduce((a, b) => (frees(b) > frees(a) ? b : a));
  }
}

export function upDownPresets(L: UpDownLayout): AgentPreset<UpDownState, string>[] {
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
        en: 'Plays whatever fits, preferring cards that free others; otherwise draws.',
        es: 'Juega lo que encaje, mejor si libera otras cartas; si no, roba.',
      },
      create: () => new UpDownGreedyAgent(L),
    },
    {
      id: 'planner',
      kind: 'search',
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Plans the longest chain it can see (never peeking at hidden cards).',
        es: 'Planea la cadena más larga que ve (sin mirar las cartas ocultas).',
      },
      create: () => new UpDownPlannerAgent(L, 20_000, { id: 'planner', label: 'Planner' }),
    },
  ];
}
