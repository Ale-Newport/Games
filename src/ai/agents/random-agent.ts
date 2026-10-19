import type { GameEnvironment, PlayerId } from '../protocols/types';
import type { Agent, DecisionContext } from './types';

/** Uniformly random legal action. The universal baseline. */
export class RandomAgent<S, A> implements Agent<S, A> {
  readonly id = 'random';
  readonly label = 'Random';

  selectAction(env: GameEnvironment<S, A>, state: S, player: PlayerId, ctx: DecisionContext): A {
    const actions = env.getLegalActions(state, player);
    if (actions.length === 0) throw new Error('RandomAgent: no legal actions');
    return ctx.rng.pick(actions);
  }
}

/** Plays `inner` but substitutes a random legal action with probability `epsilon`. */
export class EpsilonAgent<S, A> implements Agent<S, A> {
  readonly id: string;
  readonly label: string;

  constructor(
    private readonly inner: Agent<S, A>,
    private readonly epsilon: number,
    meta: { id?: string; label?: string } = {},
  ) {
    this.id = meta.id ?? `${inner.id}~eps${epsilon}`;
    this.label = meta.label ?? `${inner.label} (ε=${epsilon})`;
  }

  get lastStats() {
    return this.inner.lastStats;
  }

  selectAction(env: GameEnvironment<S, A>, state: S, player: PlayerId, ctx: DecisionContext): A {
    if (ctx.rng.chance(this.epsilon)) {
      return ctx.rng.pick(env.getLegalActions(state, player));
    }
    return this.inner.selectAction(env, state, player, ctx);
  }
}
