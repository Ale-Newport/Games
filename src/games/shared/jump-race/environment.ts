/** GameEnvironment factory, evaluation, two-player rules binding and agent presets for jump races. */
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
  applyJumpRaceAction,
  cellCount,
  createJumpRaceState,
  isValidJumpRaceState,
  legalJumpRaceActions,
  parseMove,
  replayJumpRace,
  type JumpRaceState,
  type JumpRaceVariant,
} from './engine';

export function jumpRaceOutcome(s: JumpRaceState): Outcome | null {
  if (!s.result) return null;
  if (s.result.winner === null)
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

/**
 * Race evaluation: the distance the opponent still has to cover minus your own, with the piece
 * furthest behind weighing extra (stragglers left at home lose races), squashed into (−1, 1).
 */
export function evaluateJumpRace(v: JumpRaceVariant, s: JumpRaceState, player: PlayerId): number {
  const side = (seat: 0 | 1) => {
    const d = v.geometry.dist[seat]!;
    let total = 0;
    let worst = 0;
    s.board.forEach((x, c) => {
      if (x !== seat + 1) return;
      total += d[c]!;
      if (d[c]! > worst) worst = d[c]!;
    });
    return total + 1.5 * worst;
  };
  const me = player as 0 | 1;
  return Math.tanh((side((1 - me) as 0 | 1) - side(me)) / 40);
}

/** Moves that gain the most distance first. */
export function orderJumpRace(v: JumpRaceVariant, s: JumpRaceState, actions: string[]): string[] {
  const d = v.geometry.dist[s.toMove]!;
  const gain = (a: string) => {
    const [f, t] = parseMove(a);
    return d[f]! - d[t]!;
  };
  return actions
    .map((a) => ({ a, g: gain(a) }))
    .sort((x, y) => y.g - x.g)
    .map((x) => x.a);
}

/** Index: from·cells + to. */
export function jumpRaceCodec(v: JumpRaceVariant) {
  const n = cellCount(v);
  return {
    size: n * n,
    encode: (a: string): number => {
      const [f, t] = parseMove(a);
      return f * n + t;
    },
    decode: (i: number): string => `${Math.floor(i / n)}-${i % n}`,
  };
}

export function createJumpRaceEnv(
  v: JumpRaceVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<JumpRaceState, string> {
  const codec = jumpRaceCodec(v);
  const n = cellCount(v);
  return {
    ...info,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 2,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: true,
      actionSpaceSize: codec.size,
      observationShape: [2, n],
    },
    createInitialState: () => createJumpRaceState(v),
    reset: () => createJumpRaceState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalJumpRaceActions(v, s),
    applyAction: (s, a) => applyJumpRaceAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: jumpRaceOutcome,
    getReward: (s, p) => jumpRaceOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidJumpRaceState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join('')}|${s.toMove}`,
    encodeAction: codec.encode,
    decodeAction: (i) => codec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
      // Planes: the observer's pieces, then the opponent's.
      const data = new Array<number>(2 * n).fill(0);
      s.board.forEach((x, c) => {
        if (x === 0) return;
        data[(x - 1 === player ? 0 : n) + c] = 1;
      });
      return { shape: [2, n], data };
    },
  };
}

export function jumpRaceTwoPlayerRules(v: JumpRaceVariant): TwoPlayerRules<JumpRaceState, string> {
  return {
    create: (first) => createJumpRaceState(v, first),
    apply: (s, a) => applyJumpRaceAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalJumpRaceActions(v, s).includes(a),
    undo: (s, plies) => replayJumpRace(v, s.history.slice(0, -plies), s.first),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is JumpRaceState => isValidJumpRaceState(v, data),
  };
}

export interface JumpRaceLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function jumpRacePresets(
  v: JumpRaceVariant,
  levels: JumpRaceLevels,
): AgentPreset<JumpRaceState, string>[] {
  const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
    new AlphaBetaAgent<JumpRaceState, string>({
      id,
      label,
      maxDepth,
      timeLimitMs,
      evaluate: (_env, s, player) => evaluateJumpRace(v, s, player),
      orderActions: (s, actions) => orderJumpRace(v, s, actions),
    });
  const plural = (n: number, en: string, es: string) => ({
    en: `${n} move${n > 1 ? 's' : ''} ${en}`,
    es: `${n} jugada${n > 1 ? 's' : ''} ${es}`,
  });
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Plays any legal move.', es: 'Juega cualquier jugada legal.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'search',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Looks ${plural(levels.easy.depth, 'ahead', '').en}; a random move ${Math.round(levels.easy.randomness * 100)}% of the time.`,
        es: `Mira ${plural(levels.easy.depth, '', '').es.trim()}; jugada al azar el ${Math.round(levels.easy.randomness * 100)}% de las veces.`,
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
        en: `Alpha-beta ${plural(levels.medium.depth, 'ahead', '').en}.`,
        es: `Alfa-beta a ${plural(levels.medium.depth, '', '').es.trim()}.`,
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
