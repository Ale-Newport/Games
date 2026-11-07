/**
 * Color Links agents and actions. An action `k:c` extends color k's path (started on its first dot)
 * into a free side-adjacent cell, or onto its own other dot. Agents: a random extension, a greedy
 * linker (the most constrained color first, hugging walls and paths, toward its other dot), and the
 * solver (the reference paths).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { dots, joined, neighbours, owners, type LinkState } from './engine';

/** Each color's path for the environment: an empty path counts as standing on its first dot. */
export const pathOf = (s: LinkState, k: number) =>
  s.paths[k]!.length ? s.paths[k]! : [s.puzzle.pairs[k]![0]];

export function linkActions(s: LinkState): string[] {
  if (s.solved) return [];
  const own = owners(s.puzzle, s.paths);
  const dotOf = dots(s.puzzle);
  const out: string[] = [];
  s.puzzle.pairs.forEach(([, target], k) => {
    const path = pathOf(s, k);
    if (joined(s.puzzle, k, path)) return;
    for (const c of neighbours(s.puzzle.size, path[path.length - 1]!))
      if ((own[c] === -1 && dotOf[c] === -1) || c === target) out.push(`${k}:${c}`);
  });
  return out;
}

export function solverMove(s: LinkState): string {
  for (let k = 0; k < s.puzzle.pairs.length; k++) {
    const path = pathOf(s, k);
    const ref = s.puzzle.solution[k]!;
    if (joined(s.puzzle, k, path)) continue;
    const i = path.length;
    if (ref.slice(0, i).join() === path.join() && ref[i] !== undefined) return `${k}:${ref[i]}`;
  }
  return linkActions(s)[0] ?? '0:0';
}

export function greedyMove(s: LinkState, rng: Rng): string {
  const acts = linkActions(s);
  const byColor = new Map<number, string[]>();
  for (const a of acts) {
    const k = Number(a.split(':')[0]);
    byColor.set(k, [...(byColor.get(k) ?? []), a]);
  }
  let pick: string[] = [];
  let fewest = Infinity;
  for (const [, list] of byColor)
    if (list.length < fewest) {
      fewest = list.length;
      pick = list;
    }
  const n = s.puzzle.size;
  const own = owners(s.puzzle, s.paths);
  // Hug walls and drawn paths (fewest free neighbours first), then head for the other dot.
  const score = (a: string) => {
    const [k, c] = a.split(':').map(Number) as [number, number];
    const t = s.puzzle.pairs[k]![1];
    if (c === t) return -100;
    const free = neighbours(n, c).filter((x) => own[x] === -1 && x !== t).length;
    const dist = Math.abs(Math.floor(c / n) - Math.floor(t / n)) + Math.abs((c % n) - (t % n));
    return free * 10 + dist + rng.float() * 0.5;
  };
  const scored = pick.map((a) => [score(a), a] as const);
  return scored.reduce((best, x) => (x[0] < best[0] ? x : best), scored[0]!)[1];
}

class LinkAgent implements Agent<LinkState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: LinkState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<LinkState, string>,
    s: LinkState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.pick(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<LinkState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Extends any color into any free cell.',
      es: 'Alarga cualquier color a cualquier casilla libre.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy linker', es: 'Enlazador voraz' },
    description: {
      en: 'Extends the color with the fewest ways forward, hugging walls and paths, toward its other dot.',
      es: 'Alarga el color con menos salidas, pegado a paredes y caminos, rumbo a su otro punto.',
    },
    create: () => new LinkAgent('greedy', 'Greedy linker', greedyMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'Draws the generator’s reference paths, which fill the whole grid.',
      es: 'Traza los caminos de referencia del generador, que llenan toda la cuadrícula.',
    },
    create: () => new LinkAgent('solver', 'Solver', (s) => solverMove(s)),
  },
];
