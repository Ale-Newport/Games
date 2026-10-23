/** GameEnvironment factory, evaluation, two-player rules binding and agent presets for mancala. */
import { AlphaBetaAgent } from '../../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
  type PlayerId,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import {
  applyMancalaAction,
  createMancalaState,
  isValidMancalaState,
  legalMancalaActions,
  replayMancala,
  type MancalaState,
  type MancalaVariant,
} from './engine';

export function mancalaOutcome(s: MancalaState): Outcome | null {
  if (!s.result) return null;
  if (s.result.winner === null)
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason, scores: s.stores };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
    scores: s.stores,
  };
}

/** Stores (captures) count fully; seeds on your own row count a little (they tend to stay yours). */
export function evaluateMancala(v: MancalaVariant, s: MancalaState, player: PlayerId): number {
  const me = player as 0 | 1;
  const row = (seat: number) =>
    s.pits.slice(seat * v.pits, (seat + 1) * v.pits).reduce((a, b) => a + b, 0);
  const score = s.stores[me] - s.stores[1 - me]! + 0.25 * (row(me) - row(1 - me));
  return Math.tanh(score / (v.pits * v.seeds * 0.5));
}

export function createMancalaEnv(
  v: MancalaVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<MancalaState, string> {
  return {
    ...info,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 2,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: true,
      actionSpaceSize: 2 * v.pits + 1,
      observationShape: [2 * v.pits + 2],
    },
    createInitialState: () => createMancalaState(v),
    reset: () => createMancalaState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalMancalaActions(v, s),
    applyAction: (s, a) => applyMancalaAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: mancalaOutcome,
    getReward: (s, p) => mancalaOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidMancalaState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => s.keys[s.keys.length - 1]!,
    encodeAction: (a) => (a === 'swap' ? 2 * v.pits : Number(a)),
    decodeAction: (i) => (i === 2 * v.pits ? 'swap' : String(i)),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
      // The observer's pits first, then the opponent's, then the two stores — scaled by all seeds.
      const total = 2 * v.pits * v.seeds;
      const mine = s.pits.slice((player as number) * v.pits, ((player as number) + 1) * v.pits);
      const theirs = s.pits.slice(
        (1 - (player as number)) * v.pits,
        (2 - (player as number)) * v.pits,
      );
      const data = [
        ...mine,
        ...theirs,
        s.stores[player as 0 | 1],
        s.stores[1 - (player as number)]!,
      ].map((x) => x / total);
      return { shape: [2 * v.pits + 2], data };
    },
  };
}

export function mancalaTwoPlayerRules(v: MancalaVariant): TwoPlayerRules<MancalaState, string> {
  return {
    create: () => createMancalaState(v),
    apply: (s, a) => applyMancalaAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalMancalaActions(v, s).includes(a),
    undo: (s, plies) => replayMancala(v, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => s.movers[ply] ?? ((ply % 2) as 0 | 1),
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is MancalaState => isValidMancalaState(v, data),
  };
}

export interface MancalaLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function mancalaPresets(
  v: MancalaVariant,
  levels: MancalaLevels,
): AgentPreset<MancalaState, string>[] {
  const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
    new AlphaBetaAgent<MancalaState, string>({
      id,
      label,
      maxDepth,
      timeLimitMs,
      evaluate: (_env, s, player) => evaluateMancala(v, s, player),
    });
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Sows from any pit.', es: 'Siembra desde cualquier casilla.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'search',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Looks ${levels.easy.depth} move${levels.easy.depth > 1 ? 's' : ''} ahead; a random move ${Math.round(levels.easy.randomness * 100)}% of the time.`,
        es: `Mira ${levels.easy.depth} jugada${levels.easy.depth > 1 ? 's' : ''}; jugada al azar el ${Math.round(levels.easy.randomness * 100)}% de las veces.`,
      },
      create: () =>
        new EpsilonAgent(
          search('easy-core', 'Easy core', levels.easy.depth),
          levels.easy.randomness,
          { id: 'easy', label: 'Easy' },
        ),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Alpha-beta ${levels.medium.depth} moves ahead.`,
        es: `Alfa-beta a ${levels.medium.depth} jugadas.`,
      },
      create: () => search('medium', 'Medium', levels.medium.depth),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Iterative deepening for about ${levels.hard.timeLimitMs / 1000} s.`,
        es: `Profundización iterativa durante unos ${levels.hard.timeLimitMs / 1000} s.`,
      },
      create: () => search('hard', 'Hard', levels.hard.depth, levels.hard.timeLimitMs),
    },
  ];
}
