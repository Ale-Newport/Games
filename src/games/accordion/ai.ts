/**
 * Accordion agents. The stock order is unknown to them. The planner searches best-first over the
 * moves possible with the cards already dealt (a deal is the end of a line) for the fewest piles,
 * keeping matches available for later; it deals when no line reduces the row. The greedy player
 * makes any move (three-left first), otherwise deals.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { legalAccordionMoves, matches, moveAccordion, type AccordionState } from './engine';

const key = (s: AccordionState) => s.piles.map((p) => p.join('.')).join('/');

/** Fewer piles first; among equals, more adjacent matches left for later. */
function value(s: AccordionState): number {
  let options = 0;
  const tops = s.piles.map((p) => p[p.length - 1]!);
  tops.forEach((t, i) => {
    if (i >= 1 && matches(t, tops[i - 1]!)) options++;
    if (i >= 3 && matches(t, tops[i - 3]!)) options++;
  });
  return -10 * s.piles.length + options;
}

export function planAccordion(
  root: AccordionState,
  budget: number,
): { path: string[]; gain: number; nodes: number } {
  interface Node {
    s: AccordionState;
    parent: Node | null;
    move: string;
    v: number;
  }
  const seen = new Set<string>([key(root)]);
  const r: Node = { s: root, parent: null, move: '', v: value(root) };
  let best = r;
  const queue: Node[] = [r];
  let nodes = 0;
  while (queue.length && nodes < budget) {
    let bi = 0;
    for (let q = 1; q < queue.length; q++) if (queue[q]!.v > queue[bi]!.v) bi = q;
    const node = queue.splice(bi, 1)[0]!;
    for (const m of legalAccordionMoves(node.s)) {
      if (m === 'deal') continue;
      const s = moveAccordion(node.s, m);
      const k = key(s);
      if (seen.has(k)) continue;
      seen.add(k);
      nodes++;
      const child: Node = { s, parent: node, move: m, v: value(s) };
      if (child.v > best.v) best = child;
      queue.push(child);
    }
  }
  const path: string[] = [];
  for (let c: Node | null = best; c && c.parent; c = c.parent) path.push(c.move);
  return { path: path.reverse(), gain: best.v - r.v, nodes };
}

export class AccordionPlannerAgent implements Agent<AccordionState, string> {
  readonly id = 'planner';
  readonly label = 'Planner';
  lastStats?: DecisionStats;
  constructor(private readonly budget: number) {}
  selectAction(_env: GameEnvironment<AccordionState, string>, s: AccordionState): string {
    const legal = legalAccordionMoves(s);
    const found = planAccordion(s, this.budget);
    this.lastStats = { nodes: found.nodes };
    // Only pile-reducing lines are worth playing before seeing the next card.
    if (found.path.length && found.gain >= 10 && legal.includes(found.path[0]!))
      return found.path[0]!;
    if (legal.includes('deal')) return 'deal';
    return found.path[0] ?? legal[0]!;
  }
}

export class AccordionGreedyAgent implements Agent<AccordionState, string> {
  readonly id = 'greedy';
  readonly label = 'Greedy';
  selectAction(_env: GameEnvironment<AccordionState, string>, s: AccordionState): string {
    const legal = legalAccordionMoves(s);
    return legal.find((m) => m.endsWith('-3')) ?? legal.find((m) => m !== 'deal') ?? legal[0]!;
  }
}

export const AGENT_PRESETS: AgentPreset<AccordionState, string>[] = [
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
      en: 'Makes any move it can (three to the left first), otherwise deals.',
      es: 'Hace cualquier jugada posible (primero tres a la izquierda); si no, reparte.',
    },
    create: () => new AccordionGreedyAgent(),
  },
  {
    id: 'planner',
    kind: 'search',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Searches the moves among the dealt cards for the shortest row (the stock stays unknown).',
      es: 'Busca entre las cartas repartidas la fila más corta (el mazo sigue siendo desconocido).',
    },
    create: () => new AccordionPlannerAgent(4000),
  },
];
