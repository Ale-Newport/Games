/**
 * Exact Sim solver: memoized win/loss for the side to move over (own lines, opponent's lines)
 * bitmasks — about 112 000 positions from the empty board, solved in milliseconds. Completing an
 * own triangle loses, so a side whose every remaining line closes a triangle has lost.
 * `SimSolverAgent` never closes its own triangle when it can avoid it; with probability `accuracy`
 * it picks a winning line, otherwise any safe line. From a lost position it picks the line that
 * leaves the opponent the fewest winning replies.
 */
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { LINES, maskOf, triangleIn, actionOf, type SimState } from './engine';

const memo = new Map<number, boolean>();

/** The side to move (owning `mine`) wins with perfect play. */
export function simWins(mine: number, theirs: number): boolean {
  const key = mine * 32768 + theirs;
  const known = memo.get(key);
  if (known !== undefined) return known;
  const used = mine | theirs;
  let result = false;
  for (let e = 0; e < LINES.length && !result; e++) {
    if (used & (1 << e)) continue;
    const next = mine | (1 << e);
    if (triangleIn(next)) continue;
    if (!simWins(theirs, next)) result = true;
  }
  memo.set(key, result);
  return result;
}

export class SimSolverAgent implements Agent<SimState, string> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly accuracy: number,
  ) {}

  selectAction(
    env: GameEnvironment<SimState, string>,
    state: SimState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    const me = state.toMove;
    const mine = maskOf(state.lines, me);
    const theirs = maskOf(state.lines, (1 - me) as 0 | 1);
    const free = state.lines.flatMap((v, i) => (v ? [] : [i]));
    const safe = free.filter((e) => !triangleIn(mine | (1 << e)));
    if (safe.length === 0) return ctx.rng.pick(legal);
    if (!ctx.rng.chance(this.accuracy)) return actionOf(ctx.rng.pick(safe));
    const winning = safe.filter((e) => !simWins(theirs, mine | (1 << e)));
    if (winning.length) return actionOf(ctx.rng.pick(winning));
    // Lost: leave the opponent as few winning replies as possible.
    const replies = (e: number) => {
      const next = mine | (1 << e);
      let n = 0;
      for (let f = 0; f < LINES.length; f++) {
        if ((next | theirs) & (1 << f)) continue;
        const after = theirs | (1 << f);
        if (!triangleIn(after) && !simWins(next, after)) n++;
      }
      return n;
    };
    const fewest = Math.min(...safe.map(replies));
    return actionOf(ctx.rng.pick(safe.filter((e) => replies(e) === fewest)));
  }
}
