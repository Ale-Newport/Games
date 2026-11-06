/** GameEnvironment factory, two-player rules binding and agent presets for xiangqi (#023). */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import {
  applyXiangqiAction,
  createXiangqiState,
  isLegalAction,
  isValidXiangqiState,
  legalActions,
  replayXiangqi,
  type XiangqiState,
} from './game';
import { parseSquare, squareName } from './position';
import { XiangqiSearchAgent } from './search';

export function xiangqiOutcome(s: XiangqiState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

/** Action index `from·90 + to`. */
export const xiangqiCodec = {
  size: 90 * 90,
  encode: (a: string) => {
    const m = /^([a-i]\d)([a-i]\d)$/.exec(a);
    if (!m) throw new Error(`Malformed xiangqi action ${a}`);
    return parseSquare(m[1]!) * 90 + parseSquare(m[2]!);
  },
  decode: (i: number) => `${squareName(Math.floor(i / 90))}${squareName(i % 90)}`,
};

export function createXiangqiEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
}): GameEnvironment<XiangqiState, string> {
  return {
    id: meta.id,
    version: meta.version,
    rulesetId: meta.rulesetId,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 2,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: true,
      actionSpaceSize: xiangqiCodec.size,
      observationShape: [14, 10, 9],
    },
    createInitialState: () => createXiangqiState(),
    reset: () => createXiangqiState(),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalActions(s),
    applyAction: (s, a) => applyXiangqiAction(s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: xiangqiOutcome,
    getReward: (s, p) => xiangqiOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidXiangqiState(parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join(',')}|${s.toMove}`,
    encodeAction: xiangqiCodec.encode,
    decodeAction: (i) => xiangqiCodec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
      // Planes: own general…soldier (7), then the opponent's; row 0 = Black's back rank.
      const data = new Array<number>(14 * 90).fill(0);
      s.board.forEach((code, sq) => {
        if (code === 0) return;
        const mine = (code > 0 ? 0 : 1) === player;
        data[((mine ? 0 : 7) + Math.abs(code) - 1) * 90 + sq] = 1;
      });
      return { shape: [14, 10, 9], data };
    },
  };
}

export const xiangqiTwoPlayerRules: TwoPlayerRules<XiangqiState, string> = {
  create: () => createXiangqiState(),
  apply: (s, a) => applyXiangqiAction(s, a),
  isLegal: (s, a) => isLegalAction(s, a),
  undo: (s, plies) => replayXiangqi(s.history.slice(0, -plies)),
  toMove: (s) => s.toMove,
  plies: (s) => s.history.length,
  moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
  outcome: (s) => (s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null),
  validate: (data): data is XiangqiState => isValidXiangqiState(data),
};

export interface XiangqiLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number; timeLimitMs: number };
  hard: { depth: number; timeLimitMs: number };
  expert: { depth: number; timeLimitMs: number };
}

export function xiangqiPresets(levels: XiangqiLevels): AgentPreset<XiangqiState, string>[] {
  const search = (id: string, label: string, depth: number, timeLimitMs?: number, randomness = 0) =>
    new XiangqiSearchAgent({ id, label, maxDepth: depth, timeLimitMs, randomness });
  const { easy, medium, hard, expert } = levels;
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Plays any legal move at random.',
        es: 'Juega cualquier jugada legal al azar.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'search',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Looks ${easy.depth} ply ahead and resolves captures; a random move ${Math.round(easy.randomness * 100)}% of the time.`,
        es: `Mira ${easy.depth} jugada por delante y resuelve capturas; jugada al azar el ${Math.round(easy.randomness * 100)}% de las veces.`,
      },
      create: () => search('easy', 'Easy', easy.depth, undefined, easy.randomness),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Alpha-beta ${medium.depth} plies with capture search.`,
        es: `Alfa-beta a ${medium.depth} jugadas con búsqueda de capturas.`,
      },
      create: () => search('medium', 'Medium', medium.depth, medium.timeLimitMs),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Iterative deepening to ${hard.depth} plies (${hard.timeLimitMs} ms) with a transposition table.`,
        es: `Profundización iterativa hasta ${hard.depth} jugadas (${hard.timeLimitMs} ms) con tabla de transposición.`,
      },
      create: () => search('hard', 'Hard', hard.depth, hard.timeLimitMs),
    },
    {
      id: 'expert',
      kind: 'search',
      label: { en: 'Expert', es: 'Experto' },
      description: {
        en: `Searches as deep as ${expert.timeLimitMs} ms allow, with killer moves and a transposition table.`,
        es: `Busca tan hondo como permiten ${expert.timeLimitMs} ms, con jugadas asesinas y tabla de transposición.`,
      },
      create: () => search('expert', 'Expert', expert.depth, expert.timeLimitMs),
    },
  ];
}
