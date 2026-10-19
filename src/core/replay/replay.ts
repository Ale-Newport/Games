import type { GameEnvironment } from '../../ai/protocols/types';

/**
 * A deterministic game record: the initial seed and config plus every action applied in order
 * (chance actions included). Replaying it through the adapter reproduces every intermediate state.
 */
export interface ReplayRecord<A, C = unknown> {
  format: 1;
  gameId: string;
  gameVersion: string;
  rulesetId: string;
  seed: number;
  config?: C;
  actions: A[];
  meta?: Record<string, string | number | boolean>;
}

export function createReplay<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  seed: number,
  actions: A[],
  config?: C,
): ReplayRecord<A, C> {
  return {
    format: 1,
    gameId: env.id,
    gameVersion: env.version,
    rulesetId: env.rulesetId,
    seed,
    config,
    actions: actions.slice(),
  };
}

/** Returns every state from the initial state to the final state (length = actions + 1). */
export function replayStates<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  record: ReplayRecord<A, C>,
): S[] {
  if (record.gameId !== env.id) {
    throw new Error(`Replay is for ${record.gameId}, not ${env.id}`);
  }
  if (record.rulesetId !== env.rulesetId) {
    throw new Error(`Replay ruleset ${record.rulesetId} does not match ${env.rulesetId}`);
  }
  const states: S[] = [env.createInitialState(record.config, record.seed)];
  for (const action of record.actions) {
    states.push(env.applyAction(states[states.length - 1] as S, action));
  }
  return states;
}
