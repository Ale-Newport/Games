import type { Rng } from '../../core/game-engine/random';
import type { GameEnvironment, PlayerId } from '../protocols/types';

export interface DecisionStats {
  /** Search nodes visited (search agents) or simulations run (MCTS). */
  nodes?: number;
  /** Deepest completed search depth. */
  depth?: number;
  /** Value estimate of the chosen action from the agent's perspective. */
  value?: number;
}

export interface DecisionContext {
  rng: Rng;
  /** Soft time budget; agents with iterative search should respect it. */
  timeLimitMs?: number;
}

export interface Agent<S, A> {
  readonly id: string;
  readonly label: string;
  selectAction(env: GameEnvironment<S, A>, state: S, player: PlayerId, ctx: DecisionContext): A;
  /** Statistics about the most recent decision, when the agent tracks them. */
  lastStats?: DecisionStats;
}

export interface AgentDescriptor {
  id: string;
  label: string;
  description: string;
  /** Which environments the agent can play. */
  supports: (info: GameEnvironment<unknown, unknown>['info']) => boolean;
}
