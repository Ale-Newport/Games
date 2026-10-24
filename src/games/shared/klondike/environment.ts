/** GameEnvironment factory and agent presets for the Klondike games (#071, #072). */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../../ai/protocols/types';
import { KlondikeGreedyAgent, KlondikePlannerAgent, maskKlondike, stateKey } from './ai';
import {
  applyKlondikeMove,
  dealKlondike,
  foundationCount,
  isValidKlondikeState,
  legalKlondikeMoves,
  type KlondikeState,
} from './engine';

export function klondikeOutcome(s: KlondikeState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  // Single seat: 1 for a solved deal, otherwise the share of cards brought home (a partial score).
  return {
    returns: [won ? 1 : foundationCount(s) / 52],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export function createKlondikeEnv(
  draw: 1 | 3,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<KlondikeState, string> {
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
    createInitialState: (_config, seed) => dealKlondike(seed >>> 0, draw),
    reset: (seed) => dealKlondike(seed >>> 0, draw),
    getObservation: (s) => maskKlondike(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== 0 ? [] : legalKlondikeMoves(s),
    applyAction: (s, a) => applyKlondikeMove(s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
    isTerminal: (s) => s.result !== null,
    getOutcome: klondikeOutcome,
    getReward: (s) => klondikeOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidKlondikeState(parsed, draw)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey,
    actionToString: (a) => a,
  };
}

export function klondikePresets(plannerBudget: number): AgentPreset<KlondikeState, string>[] {
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
        en: 'Fixed priorities: safe cards home, turn cards up, then draw.',
        es: 'Prioridades fijas: cartas seguras a casa, destapar cartas y luego robar.',
      },
      create: () => new KlondikeGreedyAgent(),
    },
    {
      id: 'planner',
      kind: 'search',
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches ahead over the cards it can see (never peeking at face-down cards).',
        es: 'Busca por delante con las cartas que ve (sin mirar las cartas boca abajo).',
      },
      create: () => new KlondikePlannerAgent(plannerBudget, { id: 'planner', label: 'Planner' }),
    },
  ];
}
