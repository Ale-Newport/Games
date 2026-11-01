/** GameEnvironment factory and agent presets for the throw duels (#162, #163). */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import { chooseThrow, type Level } from './ai';
import { act, current, isValidDuel, legalActions, newDuel, observe, type Duel } from './engine';

export interface DuelConfig {
  target?: number;
}

export function duelOutcome(g: Duel): Outcome | null {
  if (g.phase !== 'over' || g.winner === null) return null;
  return {
    returns: g.winner === 0 ? [1, -1] : [-1, 1],
    winners: [g.winner],
    draw: false,
    scores: [...g.wins],
    reason: 'target-reached',
  };
}

class ThrowAgent implements Agent<Duel, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<Duel, string>,
    g: Duel,
    player: number,
    _ctx: DecisionContext,
  ): string {
    // Only finished rounds are read: the pending throw is never looked at.
    return `throw:${chooseThrow(observe(g, player), player === 0 ? 0 : 1, this.level)}`;
  }
}

export const THROW_AGENTS: AgentPreset<Duel, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Coin flip', es: 'A cara o cruz' },
    description: {
      en: 'Uniformly random throws: the equilibrium.',
      es: 'Jugadas uniformes al azar: el equilibrio.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'frequency',
    kind: 'heuristic',
    label: { en: 'Counter', es: 'Contador' },
    description: {
      en: 'Beats the opponent’s most common throw.',
      es: 'Vence a la jugada más habitual del rival.',
    },
    create: () => new ThrowAgent('frequency', 'Counter', 'frequency'),
  },
  {
    id: 'markov',
    kind: 'heuristic',
    label: { en: 'Pattern reader', es: 'Lector de patrones' },
    description: {
      en: 'Predicts from what followed the same last two rounds.',
      es: 'Predice por lo que siguió a las mismas dos últimas rondas.',
    },
    create: () => new ThrowAgent('markov', 'Pattern reader', 'markov'),
  },
  {
    id: 'meta',
    kind: 'heuristic',
    label: { en: 'Mind reader', es: 'Lector de mentes' },
    description: {
      en: 'An ensemble of readers, second-guessing included, trusting whichever has been right.',
      es: 'Un conjunto de lectores, con segundas intenciones incluidas, que se fía del que acierta.',
    },
    create: () => new ThrowAgent('meta', 'Mind reader', 'meta'),
  },
];

export function duelEnv(
  id: string,
  version: string,
  rulesetId: string,
  n: number,
): GameEnvironment<Duel, string, Duel, DuelConfig> {
  return {
    id,
    version,
    rulesetId,
    info: {
      // Simultaneous throws as sequential commitment: seat 1 never sees seat 0's pending throw.
      kind: 'simultaneous',
      minPlayers: 2,
      maxPlayers: 2,
      stochastic: false,
      hiddenInformation: true,
      zeroSum: true,
    },
    createInitialState: (config, seed) =>
      newDuel(n, [3, 5, 10].includes(config?.target ?? 5) ? (config?.target ?? 5) : 5, seed >>> 0),
    reset: (seed) => newDuel(n, 5, seed >>> 0),
    getObservation: (g, seat) => observe(g, seat),
    getLegalActions: (g, seat) =>
      g.phase === 'over' || (seat !== undefined && seat !== current(g)) ? [] : legalActions(g),
    applyAction: (g, a) => {
      if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      return act(g, a);
    },
    getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : current(g)),
    isTerminal: (g) => g.phase === 'over',
    getOutcome: duelOutcome,
    getReward: (g, seat) => duelOutcome(g)?.returns[seat] ?? 0,
    serializeState: (g) => JSON.stringify(g),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidDuel(parsed, n)) throw new Error(`Invalid ${id} state`);
      return parsed;
    },
    cloneState: (g) => structuredClone(g),
    actionToString: (a) => a,
  };
}
