/** GameEnvironment factory and agent presets for the domino games (#156–#158). */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import { heavyAction, plannerAction } from './ai';
import {
  act,
  isValidBones,
  legalActions,
  newBones,
  observe,
  type BonesGame,
  type BonesRules,
} from './engine';

export interface BonesConfig {
  players?: number;
}

export function bonesOutcome(g: BonesGame): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.scores.map((_, p) => (p === g.winner ? 1 : 0)),
    winners: [g.winner],
    draw: false,
    scores: g.scores,
    reason: 'target-reached',
  };
}

class BonesAgent implements Agent<BonesGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: BonesGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<BonesGame, string>,
    g: BonesGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(g);
  }
}

/** The heavy player decides from its own view; the planner observes inside `plannerAction`. */
export const heavyFromView = (g: BonesGame) => heavyAction(observe(g, g.turn));

export const BONES_AGENTS: AgentPreset<BonesGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal play.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'heavy',
    kind: 'heuristic',
    label: { en: 'Heavy', es: 'Pesado' },
    description: {
      en: 'Sheds its heaviest playable tile (in all fives, the play that scores most).',
      es: 'Suelta su ficha jugable más pesada (en todos los cincos, la jugada que más puntúa).',
    },
    create: () => new BonesAgent('heavy', 'Heavy', heavyFromView),
  },
  {
    id: 'planner',
    kind: 'search',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Plays out each option in deals of the hidden tiles that fit what it knows, and keeps the best on average.',
      es: 'Juega cada opción en repartos de las fichas ocultas que encajan con lo que sabe y se queda con la mejor de media.',
    },
    create: () => new BonesAgent('planner', 'Planner', (g) => plannerAction(g)),
  },
];

export function bonesEnv(
  id: string,
  version: string,
  rulesetId: string,
  rules: BonesRules,
): GameEnvironment<BonesGame, string, BonesGame, BonesConfig> {
  return {
    id,
    version,
    rulesetId,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 4,
      // The deal comes from the seed: transitions are deterministic once it is fixed.
      stochastic: false,
      hiddenInformation: true,
      zeroSum: false,
    },
    createInitialState: (config, seed) =>
      newBones(
        rules,
        [2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2,
        seed >>> 0,
      ),
    reset: (seed) => newBones(rules, 2, seed >>> 0),
    getObservation: (g, seat) => observe(g, seat),
    getLegalActions: (g, seat) =>
      g.phase === 'over' || (seat !== undefined && seat !== g.turn) ? [] : legalActions(g),
    applyAction: (g, a) => {
      if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      return act(g, a);
    },
    getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : g.turn),
    isTerminal: (g) => g.phase === 'over',
    getOutcome: bonesOutcome,
    getReward: (g, seat) => bonesOutcome(g)?.returns[seat] ?? 0,
    serializeState: (g) => JSON.stringify(g),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidBones(parsed, rules)) throw new Error(`Invalid ${id} state`);
      return parsed;
    },
    cloneState: (g) => structuredClone(g),
    actionToString: (a) => a,
  };
}
