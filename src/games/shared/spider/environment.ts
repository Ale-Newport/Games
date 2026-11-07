/** GameEnvironment factory and agent presets for the Spider games (#074–#076). */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../../ai/protocols/types';
import { SpiderGreedyAgent, SpiderPlannerAgent, maskSpider, spiderKey } from './ai';
import {
  applySpiderMove,
  dealSpider,
  isValidSpiderState,
  legalSpiderMoves,
  type SpiderState,
  type SpiderSuits,
} from './engine';

export function spiderOutcome(s: SpiderState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : s.completed.length / 8],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export function createSpiderEnv(
  suits: SpiderSuits,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<SpiderState, string> {
  return {
    ...info,
    info: {
      kind: 'turn-based',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: true,
      zeroSum: false,
    },
    createInitialState: (_config, seed) => dealSpider(seed >>> 0, suits),
    reset: (seed) => dealSpider(seed >>> 0, suits),
    getObservation: (s) => maskSpider(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== 0 ? [] : legalSpiderMoves(s),
    applyAction: (s, a) => applySpiderMove(s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
    isTerminal: (s) => s.result !== null,
    getOutcome: spiderOutcome,
    getReward: (s) => spiderOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidSpiderState(parsed, suits)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: spiderKey,
    actionToString: (a) => a,
  };
}

export function spiderPresets(budget: number): AgentPreset<SpiderState, string>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Plays any legal move.', es: 'Juega cualquier jugada legal.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'greedy',
      kind: 'heuristic',
      label: { en: 'Greedy', es: 'Codicioso' },
      description: {
        en: 'Fixed priorities: turn cards up, build in suit, then deal.',
        es: 'Prioridades fijas: destapar cartas, construir del mismo palo y luego repartir.',
      },
      create: () => new SpiderGreedyAgent(),
    },
    {
      id: 'planner',
      kind: 'search',
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches ahead over the cards it can see (never peeking at face-down cards).',
        es: 'Busca por delante con las cartas que ve (sin mirar las cartas boca abajo).',
      },
      create: () => new SpiderPlannerAgent(budget, { id: 'planner', label: 'Planner' }),
    },
  ];
}
