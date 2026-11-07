/**
 * The AI environment for an arcade game: one run per episode, a single seat, kind `real-time` —
 * every `applyAction` advances exactly one simulation step with a discrete action (idle included).
 * The return is the run's score; the reward of a step is the score it gained.
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { LocalizedText } from '../../../core/i18n';
import type { ArcadeDef } from './types';

export interface ArcadeConfig {
  options?: Record<string, string>;
}

/** Wraps a simulation state with its options and step count (needed for replays and limits). */
export interface ArcadeRun<S> {
  state: S;
  options: Record<string, string>;
  steps: number;
  seed: number;
}

export function arcadeEnv<S, A extends string>(
  def: ArcadeDef<S, A>,
  version: string,
  rulesetId: string,
  /** A step limit that ends runs which never end on their own (e.g. a perfect player). */
  maxSteps: number,
): GameEnvironment<ArcadeRun<S>, A, ArcadeRun<S>, ArcadeConfig> {
  const defaults = () => Object.fromEntries(def.options.map((o) => [o.id, o.initial]));
  const done = (r: ArcadeRun<S>) => def.over(r.state) || r.steps >= maxSteps;
  const outcome = (r: ArcadeRun<S>): Outcome | null => {
    if (!done(r)) return null;
    const res = def.result(r.state, r.options);
    return {
      returns: [def.score(r.state)],
      winners: res.outcome === 'win' || res.outcome === 'complete' ? [0] : [],
      draw: res.outcome === 'draw',
      scores: [def.score(r.state)],
      reason: def.over(r.state) ? 'game-over' : 'step-limit',
    };
  };
  return {
    id: def.id,
    version,
    rulesetId,
    info: {
      kind: 'real-time',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
      tickRate: def.hz,
    },
    createInitialState: (config, seed) => {
      const options = { ...defaults(), ...(config?.options ?? {}) };
      return { state: def.init(seed >>> 0, options), options, steps: 0, seed: seed >>> 0 };
    },
    reset: (seed) => ({
      state: def.init(seed >>> 0, defaults()),
      options: defaults(),
      steps: 0,
      seed: seed >>> 0,
    }),
    getObservation: (r) => r,
    getLegalActions: (r) => (done(r) ? [] : [...def.actions]),
    applyAction: (r, a) => {
      if (done(r) || !def.actions.includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      return { ...r, state: def.step(r.state, a), steps: r.steps + 1 };
    },
    getCurrentPlayer: (r) => (done(r) ? NO_PLAYER : 0),
    isTerminal: done,
    getOutcome: outcome,
    getReward: (r) => outcome(r)?.returns[0] ?? 0,
    serializeState: (r) => JSON.stringify(r),
    deserializeState: (data) => {
      const parsed = JSON.parse(data) as ArcadeRun<S>;
      if (!parsed || typeof parsed !== 'object' || !def.validate(parsed.state))
        throw new Error(`Invalid ${def.id} run`);
      return parsed;
    },
    cloneState: (r) => structuredClone(r),
    actionToString: (a) => a,
  };
}

class PolicyAgent<S, A extends string> implements Agent<ArcadeRun<S>, A> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly policy: (s: S) => A,
  ) {}
  selectAction(
    _env: GameEnvironment<ArcadeRun<S>, A>,
    r: ArcadeRun<S>,
    _player: number,
    _ctx: DecisionContext,
  ): A {
    return this.policy(r.state);
  }
}

/** Agent presets: random, then each of the game's policies with its label and description. */
export function arcadeAgents<S, A extends string>(
  def: ArcadeDef<S, A>,
  info: Record<string, { label: LocalizedText; description: LocalizedText }>,
): AgentPreset<ArcadeRun<S>, A>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'A random action every step.', es: 'Una acción al azar en cada paso.' },
      create: () => new RandomAgent(),
    },
    ...Object.entries(def.policies).map(([pid, policy]) => ({
      id: pid,
      kind: 'heuristic' as const,
      label: info[pid]!.label,
      description: info[pid]!.description,
      create: () => new PolicyAgent(pid, info[pid]!.label.en, policy),
    })),
  ];
}
