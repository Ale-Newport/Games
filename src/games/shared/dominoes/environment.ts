/** GameEnvironment factory, two-player rules binding and agent presets for the domino games. */
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
  applyDominoAction,
  createDominoState,
  isValidDominoState,
  legalDominoActions,
  replayDominoes,
  type DominoState,
  type DominoVariant,
} from './engine';
import { DominoSearchAgent } from './search';

export function dominoOutcome(s: DominoState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'no-placement',
  };
}

/** Index: (r·cols + c)·2 + (0 vertical, 1 horizontal). */
export function dominoCodec(v: DominoVariant) {
  return {
    size: v.rows * v.cols * 2,
    encode(a: string): number {
      const [r, c, o] = a.split(',');
      return (Number(r) * v.cols + Number(c)) * 2 + (o === 'h' ? 1 : 0);
    },
    decode(i: number): string {
      const p = Math.floor(i / 2);
      return `${Math.floor(p / v.cols)},${p % v.cols},${i % 2 ? 'h' : 'v'}`;
    },
  };
}

export function createDominoEnv(
  v: DominoVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<DominoState, string> {
  const codec = dominoCodec(v);
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
      observationShape: [v.rows, v.cols],
    },
    createInitialState: () => createDominoState(v),
    reset: () => createDominoState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalDominoActions(v, s),
    applyAction: (s, a) => applyDominoAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: dominoOutcome,
    getReward: (s, p) => dominoOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidDominoState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.cells.map((c) => (c === -1 ? 0 : 1)).join('')}|${s.toMove}`,
    encodeAction: codec.encode,
    decodeAction: (i) => codec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s) => ({
      shape: [v.rows, v.cols],
      data: s.cells.map((c) => (c === -1 ? 0 : 1)),
    }),
  };
}

export function dominoTwoPlayerRules(v: DominoVariant): TwoPlayerRules<DominoState, string> {
  return {
    create: (first) => createDominoState(v, first),
    apply: (s, a) => applyDominoAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalDominoActions(v, s).includes(a),
    undo: (s, plies) => replayDominoes(v, s.first, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is DominoState => isValidDominoState(v, data),
  };
}

export interface DominoLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function dominoPresets(
  v: DominoVariant,
  levels: DominoLevels,
): AgentPreset<DominoState, string>[] {
  const make = (
    id: string,
    label: string,
    o: { depth: number; timeLimitMs?: number; randomness?: number },
  ) =>
    new DominoSearchAgent(v, {
      id,
      label,
      maxDepth: o.depth,
      timeLimitMs: o.timeLimitMs,
      randomness: o.randomness,
    });
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Places a domino anywhere.', es: 'Coloca una ficha en cualquier sitio.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'search',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Looks ${levels.easy.depth} move ahead; a random placement ${Math.round(levels.easy.randomness * 100)}% of the time.`,
        es: `Mira ${levels.easy.depth} jugada por delante; colocación al azar el ${Math.round(levels.easy.randomness * 100)}% de las veces.`,
      },
      create: () => make('easy', 'Easy', levels.easy),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Alpha-beta ${levels.medium.depth} moves ahead.`,
        es: `Alfa-beta a ${levels.medium.depth} jugadas.`,
      },
      create: () => make('medium', 'Medium', levels.medium),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Iterative deepening for about ${levels.hard.timeLimitMs / 1000} s.`,
        es: `Profundización iterativa durante unos ${levels.hard.timeLimitMs / 1000} s.`,
      },
      create: () => make('hard', 'Hard', levels.hard),
    },
  ];
}
