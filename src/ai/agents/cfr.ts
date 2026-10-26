/**
 * Counterfactual regret minimisation (CFR+) for small two-player zero-sum games with hidden
 * information, such as Kuhn and Leduc poker. The game is described as a tree of histories; every
 * iteration walks the whole tree once per player, accumulating clipped regrets (regret matching+)
 * and a linearly weighted average strategy, which converges to a Nash equilibrium.
 */
import type { Rng } from '../../core/game-engine/random';

export interface CfrGame<H> {
  root(): H;
  isTerminal(h: H): boolean;
  /** Payoff to player 0 at a terminal history (player 1 gets the opposite). */
  utility(h: H): number;
  isChance(h: H): boolean;
  /** Chance outcomes with their probabilities. */
  chance(h: H): { next: H; p: number }[];
  player(h: H): 0 | 1;
  actions(h: H): readonly string[];
  play(h: H, action: string): H;
  /** What the player to act knows: histories with the same key share a strategy. */
  infoKey(h: H): string;
}

/** Average strategy: information set key → probabilities in the order of `actions`. */
export type CfrStrategy = Record<string, number[]>;

interface Node {
  regret: number[];
  sum: number[];
}

export function solveCfr<H>(game: CfrGame<H>, iterations: number): CfrStrategy {
  const nodes = new Map<string, Node>();
  const nodeOf = (key: string, n: number) => {
    let node = nodes.get(key);
    if (!node) {
      node = { regret: Array<number>(n).fill(0), sum: Array<number>(n).fill(0) };
      nodes.set(key, node);
    }
    return node;
  };
  const current = (node: Node) => {
    const positive = node.regret.map((r) => Math.max(0, r));
    const total = positive.reduce((a, b) => a + b, 0);
    return total > 0 ? positive.map((r) => r / total) : positive.map(() => 1 / positive.length);
  };
  /** Expected value to `traverser` of history `h`, reached with the opponent's probability `reach`. */
  const walk = (h: H, traverser: 0 | 1, reach: number, weight: number): number => {
    if (game.isTerminal(h)) return traverser === 0 ? game.utility(h) : -game.utility(h);
    if (game.isChance(h))
      return game
        .chance(h)
        .reduce((v, o) => v + o.p * walk(o.next, traverser, reach * o.p, weight), 0);
    const actions = game.actions(h);
    const node = nodeOf(game.infoKey(h), actions.length);
    const sigma = current(node);
    if (game.player(h) !== traverser) {
      // The opponent's turn: accumulate its average strategy, weighted by iteration.
      let v = 0;
      actions.forEach((a, i) => {
        node.sum[i]! += weight * reach * sigma[i]!;
        v += sigma[i]! * walk(game.play(h, a), traverser, reach * sigma[i]!, weight);
      });
      return v;
    }
    const values = actions.map((a) => walk(game.play(h, a), traverser, reach, weight));
    const v = values.reduce((acc, x, i) => acc + sigma[i]! * x, 0);
    values.forEach((x, i) => {
      node.regret[i] = Math.max(0, node.regret[i]! + reach * (x - v));
    });
    return v;
  };
  for (let t = 1; t <= iterations; t++) {
    walk(game.root(), 0, 1, t);
    walk(game.root(), 1, 1, t);
  }
  const out: CfrStrategy = {};
  for (const [key, node] of nodes) {
    const total = node.sum.reduce((a, b) => a + b, 0);
    out[key] = total > 0 ? node.sum.map((x) => x / total) : node.sum.map(() => 1 / node.sum.length);
  }
  return out;
}

/** Expected payoff to player 0 when both players follow the given strategies. */
export function strategyValue<H>(
  game: CfrGame<H>,
  first: (h: H) => number[],
  second: (h: H) => number[],
): number {
  const walk = (h: H): number => {
    if (game.isTerminal(h)) return game.utility(h);
    if (game.isChance(h)) return game.chance(h).reduce((v, o) => v + o.p * walk(o.next), 0);
    const probs = (game.player(h) === 0 ? first : second)(h);
    return game.actions(h).reduce((v, a, i) => v + (probs[i] ?? 0) * walk(game.play(h, a)), 0);
  };
  return walk(game.root());
}

/**
 * How much a best response gains against `strategy` (the average over both seats of what a
 * perfect opponent wins). Zero for an exact equilibrium of a symmetric match.
 */
export function exploitability<H>(game: CfrGame<H>, strategy: (h: H) => number[]): number {
  // Group histories by information set to compute a best response that cannot see hidden cards.
  const bestResponse = (responder: 0 | 1): number => {
    // Collect, for every responder information set, the counterfactual value of each action.
    const memo = new Map<string, number[]>();
    const infoValue = (key: string, actions: readonly string[], hs: { h: H; w: number }[]) => {
      let cached = memo.get(key);
      if (!cached) {
        cached = actions.map((a) => hs.reduce((v, x) => v + x.w * value(game.play(x.h, a)), 0));
        memo.set(key, cached);
      }
      return cached;
    };
    // Reach-weighted histories per responder information set.
    const groups = new Map<string, { h: H; w: number }[]>();
    const collect = (h: H, w: number) => {
      if (game.isTerminal(h)) return;
      if (game.isChance(h)) {
        for (const o of game.chance(h)) collect(o.next, w * o.p);
        return;
      }
      if (game.player(h) === responder) {
        const key = game.infoKey(h);
        const list = groups.get(key) ?? [];
        list.push({ h, w });
        groups.set(key, list);
        for (const a of game.actions(h)) collect(game.play(h, a), w);
      } else {
        const probs = strategy(h);
        game.actions(h).forEach((a, i) => collect(game.play(h, a), w * (probs[i] ?? 0)));
      }
    };
    collect(game.root(), 1);
    const sign = responder === 0 ? 1 : -1;
    // Value of a history for the responder, playing its best action at each information set.
    const value = (h: H): number => {
      if (game.isTerminal(h)) return sign * game.utility(h);
      if (game.isChance(h)) return game.chance(h).reduce((v, o) => v + o.p * value(o.next), 0);
      const actions = game.actions(h);
      if (game.player(h) === responder) {
        const key = game.infoKey(h);
        const scores = infoValue(key, actions, groups.get(key)!);
        const best = scores.indexOf(Math.max(...scores));
        return value(game.play(h, actions[best]!));
      }
      const probs = strategy(h);
      return actions.reduce((v, a, i) => v + (probs[i] ?? 0) * value(game.play(h, a)), 0);
    };
    return value(game.root());
  };
  return (bestResponse(0) + bestResponse(1)) / 2;
}

/** Samples an action index from probabilities. */
export function sampleIndex(probs: readonly number[], rng: Rng): number {
  let x = rng.float();
  for (let i = 0; i < probs.length; i++) {
    x -= probs[i]!;
    if (x < 0) return i;
  }
  return probs.length - 1;
}
