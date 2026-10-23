/**
 * SOS opponents. A move is "safe" when it scores nothing and leaves the opponent no scoring move.
 * `SosGreedyAgent` scores whenever it can, then plays safe moves; Medium also picks the cheapest
 * sacrifice once nothing is safe. `SosSearchAgent` (Hard) runs an alpha-beta over net points on a
 * reduced move set (scoring moves, safe moves, or the cheapest sacrifices), with scoring moves not
 * using up depth and a parity bonus for the number of safe moves left.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { linesThrough, scoreOf, type Letter, type SosState } from './engine';

type Cells = ('' | Letter)[];
const LETTERS: Letter[] = ['S', 'O'];

/** Every (letter, cell) with the points it scores. */
function options(cells: Cells): { a: string; p: number; l: Letter; pts: number }[] {
  const out: { a: string; p: number; l: Letter; pts: number }[] = [];
  cells.forEach((v, p) => {
    if (v) return;
    for (const l of LETTERS) out.push({ a: `${l}${p}`, p, l, pts: scoreOf(cells, p, l) });
  });
  return out;
}

const givesPoint = (cells: Cells) => options(cells).some((o) => o.pts > 0);

function isSafe(cells: Cells, p: number, l: Letter): boolean {
  cells[p] = l;
  const ok = linesThrough(cells, p).length === 0 && !givesPoint(cells);
  cells[p] = '';
  return ok;
}

/** Points the opponent collects by scoring greedily after `p`/`l` (the grid is restored). */
function sacrifice(cells: Cells, p: number, l: Letter): number {
  const placed: number[] = [p];
  cells[p] = l;
  let total = 0;
  for (;;) {
    const best = options(cells).reduce<{ p: number; l: Letter; pts: number } | null>(
      (b, o) => (o.pts > (b?.pts ?? 0) ? o : b),
      null,
    );
    if (!best) break;
    cells[best.p] = best.l;
    placed.push(best.p);
    total += best.pts;
  }
  for (const q of placed) cells[q] = '';
  return total;
}

export class SosGreedyAgent implements Agent<SosState, string> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly cheapSacrifice: boolean,
    private readonly randomness = 0,
  ) {}

  selectAction(
    env: GameEnvironment<SosState, string>,
    state: SosState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (this.randomness && ctx.rng.chance(this.randomness)) return ctx.rng.pick(legal);
    const cells = state.cells.slice();
    const opts = options(cells);
    const top = Math.max(...opts.map((o) => o.pts));
    if (top > 0) return ctx.rng.pick(opts.filter((o) => o.pts === top)).a;
    const safe = opts.filter((o) => isSafe(cells, o.p, o.l));
    if (safe.length) return ctx.rng.pick(safe).a;
    if (!this.cheapSacrifice) return ctx.rng.pick(legal);
    const cost = new Map(opts.map((o) => [o.a, sacrifice(cells, o.p, o.l)]));
    const least = Math.min(...cost.values());
    return ctx.rng.pick(opts.filter((o) => cost.get(o.a) === least)).a;
  }
}

class Timeout extends Error {}

export class SosSearchAgent implements Agent<SosState, string> {
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;

  constructor(
    readonly id: string,
    readonly label: string,
    private readonly o: { maxDepth: number; timeLimitMs?: number; now?: () => number },
  ) {}

  private candidates(cells: Cells) {
    const opts = options(cells);
    const scoring = opts.filter((o) => o.pts > 0).sort((x, y) => y.pts - x.pts);
    if (scoring.length) return { moves: scoring.slice(0, 4), scoring: true };
    const safe = opts.filter((o) => isSafe(cells, o.p, o.l));
    if (safe.length) return { moves: safe, scoring: false };
    const costed = opts
      .map((o) => ({ ...o, cost: sacrifice(cells, o.p, o.l) }))
      .sort((x, y) => x.cost - y.cost);
    return { moves: costed.slice(0, 6), scoring: false };
  }

  /** Net points from here for the side to move. */
  private negamax(cells: Cells, depth: number, alpha: number, beta: number): number {
    this.nodes++;
    if ((this.nodes & 255) === 0 && (this.o.now ?? (() => performance.now()))() > this.deadline)
      throw new Timeout();
    if (cells.every(Boolean)) return 0;
    const { moves, scoring } = this.candidates(cells);
    if (depth <= 0 && !scoring) {
      // Parity of the safe moves left: the player who runs out of them must give points away.
      const safeLeft =
        moves.length && options(cells).some((x) => x.pts === 0 && isSafe(cells, x.p, x.l));
      return safeLeft ? (moves.length % 2 === 1 ? 0.5 : -0.5) : -0.5;
    }
    let best = -Infinity;
    for (const m of moves) {
      cells[m.p] = m.l;
      const pts = linesThrough(cells, m.p).length;
      const v = pts
        ? pts + this.negamax(cells, depth, alpha - pts, beta - pts)
        : -this.negamax(cells, depth - 1, -beta, -alpha);
      cells[m.p] = '';
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  selectAction(
    env: GameEnvironment<SosState, string>,
    state: SosState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    const now = this.o.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.o.timeLimitMs].filter((n) => n !== undefined);
    this.deadline = limits.length ? now() + Math.min(...limits) : Infinity;
    this.nodes = 0;
    const cells = state.cells.slice();
    let order = ctx.rng.shuffle(this.candidates(cells).moves);
    let best = order[0]!.a;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.o.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        const scores = new Map<string, number>();
        for (const m of order) {
          cells[m.p] = m.l;
          const pts = linesThrough(cells, m.p).length;
          const v = pts
            ? pts + this.negamax(cells, depth - 1, -Infinity, Infinity)
            : -this.negamax(cells, depth - 1, -Infinity, -alpha);
          cells[m.p] = '';
          scores.set(m.a, v);
          if (v > alpha) alpha = v;
        }
        order = [...order].sort((x, y) => scores.get(y.a)! - scores.get(x.a)!);
        best = order[0]!.a;
        bestValue = alpha;
        reached = depth;
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    this.lastStats = { nodes: this.nodes, depth: reached, value: bestValue };
    return best;
  }
}

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<SosState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Writes any letter anywhere.',
      es: 'Escribe cualquier letra en cualquier sitio.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Scores when it can and avoids setting you up; a random move 25% of the time.',
      es: 'Puntúa cuando puede y evita dejarte puntos; jugada al azar el 25% de las veces.',
    },
    create: () => new SosGreedyAgent('easy', 'Easy', false, 0.25),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Never slips; when forced, gives away as little as possible.',
      es: 'Sin despistes; cuando no queda otra, regala lo mínimo.',
    },
    create: () => new SosGreedyAgent('medium', 'Medium', true),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Searches safe moves and sacrifices for about a second.',
      es: 'Busca jugadas seguras y sacrificios durante un segundo.',
    },
    create: () => new SosSearchAgent('hard', 'Hard', { maxDepth: 30, timeLimitMs: 1000 }),
  },
];
