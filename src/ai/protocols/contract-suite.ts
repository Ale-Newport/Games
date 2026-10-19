/**
 * Reusable AI-adapter contract tests (docs/ai-integration.md §Compatibility tests).
 * Every completed game calls `describeAdapterContract` from its own test folder.
 * Test-only module: never import it from application code.
 */
import { describe, expect, it } from 'vitest';
import { Rng } from '../../core/game-engine/random';
import { createReplay, replayStates } from '../../core/replay/replay';
import { sampleChanceAction } from '../agents/mcts-agent';
import { CHANCE_PLAYER, NO_PLAYER, type GameEnvironment } from './types';

export interface ContractOptions<S, A, C> {
  /** Configurations to exercise (undefined = default config). */
  configs?: (C | undefined)[];
  /** Random playouts per config. */
  playouts?: number;
  /** Safety bound on playout length; reaching it fails the test unless `allowTruncation`. */
  maxSteps?: number;
  allowTruncation?: boolean;
  /** Actions that must be rejected in the given state. */
  illegalActions?: (state: S) => A[];
  /** Asserts the observation for `player` hides what it must; called on states along playouts. */
  checkObservation?: (state: S, player: number) => void;
}

function randomPlayout<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  config: C | undefined,
  seed: number,
  maxSteps: number,
) {
  const rng = new Rng(seed);
  let state = env.createInitialState(config, seed);
  const states: S[] = [state];
  const actions: A[] = [];
  for (let step = 0; step < maxSteps && !env.isTerminal(state); step++) {
    const player = env.getCurrentPlayer(state);
    const action =
      player === CHANCE_PLAYER
        ? sampleChanceAction(env, state, rng)
        : rng.pick(env.getLegalActions(state, player));
    actions.push(action);
    state = env.applyAction(state, action);
    states.push(state);
  }
  return { states, actions, final: state };
}

export function describeAdapterContract<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  options: ContractOptions<S, A, C> = {},
): void {
  const configs = options.configs ?? [undefined];
  const playouts = options.playouts ?? 50;
  const maxSteps = options.maxSteps ?? 5_000;

  describe(`AI adapter contract: ${env.id}`, () => {
    it('declares identity and environment info', () => {
      expect(env.id).toMatch(/^[a-z0-9-]+$/);
      expect(env.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(env.rulesetId.length).toBeGreaterThan(0);
      expect(env.info.minPlayers).toBeGreaterThanOrEqual(1);
      expect(env.info.maxPlayers).toBeGreaterThanOrEqual(env.info.minPlayers);
    });

    for (const [ci, config] of configs.entries()) {
      describe(`config #${ci}`, () => {
        it('creates a valid initial state', () => {
          const state = env.createInitialState(config, 1);
          expect(env.isTerminal(state)).toBe(false);
          expect(env.getOutcome(state)).toBeNull();
          const player = env.getCurrentPlayer(state);
          if (player !== CHANCE_PLAYER) {
            expect(player).toBeGreaterThanOrEqual(0);
            expect(env.getLegalActions(state, player).length).toBeGreaterThan(0);
          }
        });

        it('reset(seed) is deterministic', () => {
          expect(env.serializeState(env.reset(42))).toBe(env.serializeState(env.reset(42)));
        });

        it('random playouts only use legal actions, never mutate states, and terminate', () => {
          for (let p = 0; p < playouts; p++) {
            const seed = 1000 + p * 7919;
            const rng = new Rng(seed);
            let state = env.createInitialState(config, seed);
            let steps = 0;
            while (!env.isTerminal(state) && steps < maxSteps) {
              const player = env.getCurrentPlayer(state);
              expect(env.getOutcome(state)).toBeNull();
              const legal = player === CHANCE_PLAYER ? null : env.getLegalActions(state, player);
              if (legal) expect(legal.length).toBeGreaterThan(0);
              if (options.checkObservation && player >= 0) options.checkObservation(state, player);
              const before = env.serializeState(state);
              const action = legal ? rng.pick(legal) : sampleChanceAction(env, state, rng);
              const next = env.applyAction(state, action);
              expect(env.serializeState(state)).toBe(before);
              if (env.encodeAction && env.decodeAction && legal) {
                const encoded = env.encodeAction(action);
                expect(Number.isInteger(encoded)).toBe(true);
                if (env.info.actionSpaceSize !== undefined) {
                  expect(encoded).toBeGreaterThanOrEqual(0);
                  expect(encoded).toBeLessThan(env.info.actionSpaceSize);
                }
                expect(env.decodeAction(encoded, state)).toEqual(action);
              }
              state = next;
              steps++;
            }
            if (!options.allowTruncation) expect(env.isTerminal(state)).toBe(true);
            if (env.isTerminal(state)) {
              expect(env.getCurrentPlayer(state)).toBe(NO_PLAYER);
              expect(env.getLegalActions(state)).toEqual([]);
              const outcome = env.getOutcome(state);
              expect(outcome).not.toBeNull();
              expect(outcome!.returns.length).toBeGreaterThanOrEqual(env.info.minPlayers);
              if (outcome!.draw) expect(outcome!.winners).toEqual([]);
              for (let seat = 0; seat < outcome!.returns.length; seat++) {
                expect(env.getReward(state, seat)).toBe(outcome!.returns[seat]);
              }
            }
          }
        });

        it('serializes, deserializes and clones states faithfully', () => {
          const { states } = randomPlayout(env, config, 77, maxSteps);
          for (const state of states) {
            const data = env.serializeState(state);
            const restored = env.deserializeState(data);
            expect(env.serializeState(restored)).toBe(data);
            expect(env.isTerminal(restored)).toBe(env.isTerminal(state));
            expect(env.getCurrentPlayer(restored)).toBe(env.getCurrentPlayer(state));
            const clone = env.cloneState(state);
            expect(env.serializeState(clone)).toBe(data);
            if (!env.isTerminal(state) && env.getCurrentPlayer(state) >= 0) {
              expect(env.getLegalActions(restored)).toEqual(env.getLegalActions(state));
            }
          }
        });

        it('replays deterministically from seed and actions', () => {
          const { actions, final } = randomPlayout(env, config, 2024, maxSteps);
          const record = createReplay(env, 2024, actions, config);
          const replayed = replayStates(env, JSON.parse(JSON.stringify(record)));
          expect(env.serializeState(replayed[replayed.length - 1] as S)).toBe(
            env.serializeState(final),
          );
        });

        if (options.illegalActions) {
          it('rejects illegal actions', () => {
            const { states } = randomPlayout(env, config, 99, maxSteps);
            let checked = 0;
            for (const state of states) {
              for (const action of options.illegalActions!(state)) {
                expect(() => env.applyAction(state, action)).toThrow();
                checked++;
              }
            }
            expect(checked).toBeGreaterThan(0);
          });
        }
      });
    }
  });
}
