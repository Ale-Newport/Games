/**
 * Kayles theory: the Grundy value of a group of n pins is the mex of g(a) ⊕ g(b) over every way a
 * move splits it (one pin: a + b = n − 1; two pins: a + b = n − 2). A position (several groups) is
 * lost for the side to move exactly when the XOR of its groups' values is 0. `KaylesSolverAgent`
 * plays a move reaching XOR 0 with probability `accuracy`, otherwise a random one; from a lost
 * position it knocks a single pin off the end of the longest group.
 */
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { MAX_PINS, applyKaylesAction, groups, type KaylesState } from './engine';

export const GRUNDY: readonly number[] = (() => {
  const g = [0];
  for (let n = 1; n <= MAX_PINS; n++) {
    const seen = new Set<number>();
    for (const take of [1, 2])
      for (let a = 0; a <= n - take; a++) seen.add(g[a]! ^ g[n - take - a]!);
    let mex = 0;
    while (seen.has(mex)) mex++;
    g.push(mex);
  }
  return g;
})();

export const kaylesValue = (pins: readonly boolean[]) =>
  groups(pins).reduce((x, n) => x ^ GRUNDY[n]!, 0);

export function winningKnocks(s: KaylesState, legal: readonly string[]): string[] {
  return legal.filter((a) => kaylesValue(applyKaylesAction(s, a).pins) === 0);
}

export class KaylesSolverAgent implements Agent<KaylesState, string> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly accuracy: number,
  ) {}

  selectAction(
    env: GameEnvironment<KaylesState, string>,
    state: KaylesState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (!ctx.rng.chance(this.accuracy)) return ctx.rng.pick(legal);
    const winning = winningKnocks(state, legal);
    if (winning.length) return ctx.rng.pick(winning);
    // Lost against perfect play: knock one pin off the end of the longest group.
    let best = -1;
    let bestLen = 0;
    let run = 0;
    state.pins.forEach((up, i) => {
      run = up ? run + 1 : 0;
      if (run > bestLen) {
        bestLen = run;
        best = i;
      }
    });
    return legal.includes(String(best)) ? String(best) : ctx.rng.pick(legal);
  }
}
