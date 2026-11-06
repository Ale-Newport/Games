/**
 * Exact solver for the heap games (memoized win/loss of the side to move, keyed by the sorted
 * heaps — heap order never matters) and the agents built on it. `HeapsSolverAgent` plays a
 * winning move with probability `accuracy`, otherwise a random one; from a lost position it
 * stalls (takes one counter from the largest heap) to keep the game long and give the opponent
 * chances to slip.
 */
import type { Agent, DecisionContext } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { amounts, takeFrom, type HeapsState, type HeapsVariant } from './engine';

export class HeapsSolver {
  private memo = new Map<string, boolean>();
  constructor(private readonly v: HeapsVariant) {}

  private moves(heaps: readonly number[]): string[] {
    const out: string[] = [];
    heaps.forEach((n, h) => {
      for (const k of amounts(this.v, n)) out.push(`${h}:${k}`);
    });
    if (this.v.both && heaps.length === 2)
      for (let k = 1; k <= Math.min(heaps[0]!, heaps[1]!); k++) out.push(`b:${k}`);
    return out;
  }

  /** The side to move wins with perfect play. */
  wins(heaps: readonly number[]): boolean {
    if (heaps.every((n) => n === 0)) return this.v.misere; // the previous player took the last
    const key = [...heaps].sort((a, b) => a - b).join(',');
    const known = this.memo.get(key);
    if (known !== undefined) return known;
    const result = this.moves(heaps).some((a) => !this.wins(takeFrom(heaps, a)));
    this.memo.set(key, result);
    return result;
  }

  /** Moves that leave the opponent in a lost position. */
  winningMoves(heaps: readonly number[]): string[] {
    return this.moves(heaps).filter((a) => !this.wins(takeFrom(heaps, a)));
  }
}

export class HeapsSolverAgent implements Agent<HeapsState, string> {
  private readonly solver: HeapsSolver;

  constructor(
    readonly id: string,
    readonly label: string,
    variant: HeapsVariant,
    private readonly accuracy: number,
  ) {
    this.solver = new HeapsSolver(variant);
  }

  selectAction(
    env: GameEnvironment<HeapsState, string>,
    state: HeapsState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (!ctx.rng.chance(this.accuracy)) return ctx.rng.pick(legal);
    const winning = this.solver.winningMoves(state.heaps);
    if (winning.length) return ctx.rng.pick(winning);
    // Lost against perfect play: take a single counter from the largest heap.
    const largest = state.heaps.indexOf(Math.max(...state.heaps));
    const stall = `${largest}:1`;
    return legal.includes(stall) ? stall : ctx.rng.pick(legal);
  }
}
