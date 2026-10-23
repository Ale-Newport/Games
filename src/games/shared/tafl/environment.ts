/** GameEnvironment factory, evaluation, two-player rules binding and agent presets for tafl games. */
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
  applyTaflAction,
  cornersOf,
  createTaflState,
  destinations,
  isValidTaflState,
  legalTaflActions,
  replayTafl,
  type TaflState,
  type TaflVariant,
} from './engine';
import { TaflSearchAgent } from './search';

export function taflOutcome(s: TaflState): Outcome | null {
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

/** Escape squares the king could reach in one move from `k`. */
function openEscapes(v: TaflVariant, board: readonly number[], k: number): number {
  const n = v.size;
  const isEscape = (p: number) =>
    v.escape === 'corner'
      ? cornersOf(v).includes(p)
      : Math.floor(p / n) === 0 || Math.floor(p / n) === n - 1 || p % n === 0 || p % n === n - 1;
  return destinations(v, board, k).filter(isEscape).length;
}

/**
 * From the defenders' side: material share, the king's mobility and open escape routes (one open
 * route is a threat, two cannot both be blocked), minus attackers pressing on the king.
 */
export function evaluateTafl(v: TaflVariant, s: TaflState, player: PlayerId): number {
  const n = v.size;
  const k = s.board.indexOf(3);
  let attackers = 0;
  let defenders = 0;
  for (const p of s.board) {
    if (p === 1) attackers++;
    else if (p === 2) defenders++;
  }
  const kingMoves = destinations(v, s.board, k).length;
  const escapes = openEscapes(v, s.board, k);
  let pressure = 0;
  for (const q of [k - n, k + n, k - 1, k + 1])
    if (q >= 0 && q < n * n && s.board[q] === 1) pressure++;
  let score = 3 * defenders - 1.5 * attackers + 0.6 * kingMoves - 4 * pressure;
  if (escapes >= 2) score += s.toMove === 1 ? 400 : 120;
  else if (escapes === 1) score += s.toMove === 1 ? 400 : 25;
  const forDefenders = Math.tanh(score / 60);
  return player === 1 ? forDefenders : -forDefenders;
}

/** Index: from·size² + to. */
export function taflCodec(v: TaflVariant) {
  const area = v.size * v.size;
  return {
    size: area * area,
    encode(a: string): number {
      const [f, t] = a.split('-').map(Number) as [number, number];
      return f * area + t;
    },
    decode: (i: number): string => `${Math.floor(i / area)}-${i % area}`,
  };
}

export function createTaflEnv(
  v: TaflVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<TaflState, string> {
  const codec = taflCodec(v);
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
      observationShape: [3, v.size, v.size],
    },
    createInitialState: () => createTaflState(v),
    reset: () => createTaflState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalTaflActions(v, s),
    applyAction: (s, a) => applyTaflAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: taflOutcome,
    getReward: (s, p) => taflOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidTaflState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => s.keys[s.keys.length - 1]!,
    encodeAction: codec.encode,
    decodeAction: (i) => codec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s) => {
      // Planes: attackers, defenders, king.
      const area = v.size * v.size;
      const data = new Array<number>(3 * area).fill(0);
      s.board.forEach((piece, p) => {
        if (piece) data[(piece - 1) * area + p] = 1;
      });
      return { shape: [3, v.size, v.size], data };
    },
  };
}

export function taflTwoPlayerRules(v: TaflVariant): TwoPlayerRules<TaflState, string> {
  return {
    create: () => createTaflState(v),
    apply: (s, a) => applyTaflAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalTaflActions(v, s).includes(a),
    undo: (s, plies) => replayTafl(v, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is TaflState => isValidTaflState(v, data),
  };
}

export interface TaflLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function taflPresets(v: TaflVariant, levels: TaflLevels): AgentPreset<TaflState, string>[] {
  const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
    new AlphaBetaAgent<TaflState, string>({
      id,
      label,
      maxDepth,
      timeLimitMs,
      evaluate: (_env, s, player) => evaluateTafl(v, s, player),
      // King moves first, then moves landing next to enemies (possible captures).
      orderActions: (s, actions) => {
        const n = v.size;
        const key = (a: string) => {
          const [f, t] = a.split('-').map(Number) as [number, number];
          if (s.board[f] === 3) return 10;
          let near = 0;
          for (const q of [t - n, t + n, t - 1, t + 1])
            if (q >= 0 && q < n * n && s.board[q] && s.board[q] !== s.board[f]) near++;
          return near;
        };
        return actions.slice().sort((x, y) => key(y) - key(x));
      },
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
        en: `Looks ${levels.easy.depth} move ahead; a random move ${Math.round(levels.easy.randomness * 100)}% of the time.`,
        es: `Mira ${levels.easy.depth} jugada; jugada al azar el ${Math.round(levels.easy.randomness * 100)}% de las veces.`,
      },
      create: () =>
        new EpsilonAgent(
          search('easy-core', 'Easy core', levels.easy.depth),
          levels.easy.randomness,
          {
            id: 'easy',
            label: 'Easy',
          },
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
      create: () =>
        new TaflSearchAgent(v, {
          id: 'hard',
          label: 'Hard',
          maxDepth: levels.hard.depth,
          timeLimitMs: levels.hard.timeLimitMs,
        }),
    },
  ];
}
