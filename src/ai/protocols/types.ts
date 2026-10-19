/**
 * The AI environment contract every game exposes through its `ai-adapter.ts`.
 *
 * Adapters wrap the game's real rules engine (the same code the UI uses); they never re-implement
 * rules. States are treated as immutable values: `applyAction` returns a new state.
 * See docs/ai-integration.md for the full contract and per-kind conventions.
 */

/** Seat index: 0, 1, ... numPlayers - 1. */
export type PlayerId = number;

/** Returned by getCurrentPlayer for a chance node in stochastic games. */
export const CHANCE_PLAYER = -1;

/** Returned by getCurrentPlayer for terminal states or simultaneous-move phases resolved elsewhere. */
export const NO_PLAYER = -2;

export type EnvironmentKind =
  | 'turn-based' // alternating or sequential turns
  | 'simultaneous' // all players commit an action each step (e.g. Rock Paper Scissors)
  | 'real-time' // fixed-timestep simulation; one action per tick
  | 'puzzle'; // single-player, usually deterministic

export interface EnvironmentInfo {
  kind: EnvironmentKind;
  minPlayers: number;
  maxPlayers: number;
  /** Chance events exist (dice, shuffles, spawns). */
  stochastic: boolean;
  /** Some state is hidden from at least one player. */
  hiddenInformation: boolean;
  /** Zero-sum two-player games allow negamax-style search. */
  zeroSum: boolean;
  /** Fixed-size discrete action space for neural policies, when one exists. */
  actionSpaceSize?: number;
  /** Observation tensor shape for neural policies, when `getObservationTensor` exists. */
  observationShape?: readonly number[];
  /** Ticks per second for real-time environments. */
  tickRate?: number;
}

export interface Outcome {
  /** Per-player terminal returns, indexed by PlayerId. Wins are +1, losses -1, draws 0 by default. */
  returns: readonly number[];
  /** Seats that won. Empty for a draw or for single-player failure. */
  winners: readonly PlayerId[];
  draw: boolean;
  /** Optional final scores (points, not returns). */
  scores?: readonly number[];
  /** Machine-readable reason, e.g. 'line', 'board-full', 'checkmate'. */
  reason: string;
}

export interface ChanceOutcome<A> {
  action: A;
  probability: number;
}

export interface ObservationTensor {
  shape: readonly number[];
  data: readonly number[];
}

export interface GameEnvironment<S, A, O = unknown, C = unknown> {
  readonly id: string;
  /** Semantic version of the rules implementation. Bump when rules or state format change. */
  readonly version: string;
  /** Identifier of the documented ruleset variant (see the game's GAME_SPEC.md). */
  readonly rulesetId: string;
  readonly info: EnvironmentInfo;

  createInitialState(config: C | undefined, seed: number): S;
  /** Equivalent to createInitialState with the default config. */
  reset(seed: number): S;

  /** Everything `playerId` may legitimately know. Must not leak opponents' private information. */
  getObservation(state: S, playerId: PlayerId): O;
  /** Legal actions for `playerId` (defaults to the current player). Empty when terminal. */
  getLegalActions(state: S, playerId?: PlayerId): A[];
  /** Returns a new state. Throws IllegalActionError for illegal actions. */
  applyAction(state: S, action: A): S;
  /** Current actor, CHANCE_PLAYER at chance nodes, NO_PLAYER when terminal. */
  getCurrentPlayer(state: S): PlayerId;
  isTerminal(state: S): boolean;
  /** Null until the state is terminal. */
  getOutcome(state: S): Outcome | null;
  /** Reward for `playerId` in this state (terminal return for sparse-reward games). */
  getReward(state: S, playerId: PlayerId): number;

  serializeState(state: S): string;
  deserializeState(data: string): S;
  cloneState(state: S): S;

  /** Stable string key for transposition tables (perfect-information games). */
  stateKey?(state: S): string;
  /** Stochastic games: distribution over chance actions at a CHANCE_PLAYER node. */
  getChanceOutcomes?(state: S): ChanceOutcome<A>[];
  /** Discrete action encoding for neural policies. */
  encodeAction?(action: A): number;
  decodeAction?(index: number, state: S): A;
  getObservationTensor?(state: S, playerId: PlayerId): ObservationTensor;
  actionToString?(action: A): string;
}

export class IllegalActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalActionError';
  }
}

/** Default terminal returns for win/loss/draw games with any number of seats. */
export function standardReturns(numPlayers: number, winners: readonly PlayerId[]): number[] {
  if (winners.length === 0) return new Array<number>(numPlayers).fill(0);
  return Array.from({ length: numPlayers }, (_, seat) => (winners.includes(seat) ? 1 : -1));
}

/** Reward helper for sparse-reward adapters. */
export function terminalReward<S>(
  env: GameEnvironment<S, unknown>,
  state: S,
  playerId: PlayerId,
): number {
  const outcome = env.getOutcome(state);
  return outcome ? (outcome.returns[playerId] ?? 0) : 0;
}
