/**
 * Exact Chomp solver: memoized win/loss of the side to move over bar shapes (non-increasing row
 * lengths — at most C(rows + cols, rows) of them, 3 003 for 6 × 8). `ChompSolverAgent` plays a
 * winning bite with probability `accuracy`, otherwise a random one; from a lost position it takes
 * the smallest bite available to keep the game going.
 */
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { bite, onlyPoison, type ChompState } from './engine';

const memo = new Map<string, boolean>();

const movesOf = (rows: readonly number[]) => {
  const out: [number, number][] = [];
  rows.forEach((len, r) => {
    for (let c = 0; c < len; c++) if (r || c) out.push([r, c]);
  });
  return out;
};

/** The side to move wins with perfect play (a bar with only the poison is lost). */
export function chompWins(rows: readonly number[]): boolean {
  if (onlyPoison(rows)) return false;
  const key = rows.join(',');
  const known = memo.get(key);
  if (known !== undefined) return known;
  const result = movesOf(rows).some(([r, c]) => !chompWins(bite(rows, r, c)));
  memo.set(key, result);
  return result;
}

export function winningBites(rows: readonly number[]): string[] {
  return movesOf(rows)
    .filter(([r, c]) => !chompWins(bite(rows, r, c)))
    .map(([r, c]) => `${r},${c}`);
}

const eaten = (rows: readonly number[], a: string) => {
  const [r, c] = a.split(',').map(Number) as [number, number];
  return rows.reduce((n, len, i) => n + (i >= r ? Math.max(0, len - c) : 0), 0);
};

export class ChompSolverAgent implements Agent<ChompState, string> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly accuracy: number,
  ) {}

  selectAction(
    env: GameEnvironment<ChompState, string>,
    state: ChompState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (!ctx.rng.chance(this.accuracy)) return ctx.rng.pick(legal);
    const winning = winningBites(state.rows);
    if (winning.length) return ctx.rng.pick(winning);
    const least = Math.min(...legal.map((a) => eaten(state.rows, a)));
    return ctx.rng.pick(legal.filter((a) => eaten(state.rows, a) === least));
  }
}
