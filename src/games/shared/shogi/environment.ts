/** GameEnvironment factory and two-player rules binding for the shogi family (#021–#022). */
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { TwoPlayerRules } from '../two-player/match';
import {
  applyShogiAction,
  createShogiState,
  isLegalAction,
  isValidShogiState,
  legalActions,
  replayShogi,
  type ShogiState,
} from './game';
import { kindOf, parseSquare, squareName } from './position';
import type { ShogiVariant } from './variants';

export function shogiOutcome(s: ShogiState): Outcome | null {
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

/**
 * Action index: board moves `(from·N + to)·2 + promote`, drops `N²·2 + kind·N + to`
 * (N = squares, kind = 1-based piece kind).
 */
export function shogiActionCodec(v: ShogiVariant) {
  const N = v.rows * v.cols;
  const dropBase = N * N * 2;
  return {
    size: dropBase + v.kinds.length * N,
    encode(action: string): number {
      const drop = /^([A-Z])\*(\d+[a-z])$/.exec(action);
      if (drop) return dropBase + kindOf(v, drop[1]!) * N + parseSquare(v, drop[2]!);
      const m = /^(\d+[a-z])(\d+[a-z])(\+?)$/.exec(action);
      if (!m) throw new Error(`Malformed shogi action ${action}`);
      return (parseSquare(v, m[1]!) * N + parseSquare(v, m[2]!)) * 2 + (m[3] ? 1 : 0);
    },
    decode(index: number): string {
      if (index >= dropBase) {
        const kind = Math.floor((index - dropBase) / N);
        return `${v.kinds[kind]!.letter}*${squareName(v, (index - dropBase) % N)}`;
      }
      const pair = Math.floor(index / 2);
      return `${squareName(v, Math.floor(pair / N))}${squareName(v, pair % N)}${index % 2 ? '+' : ''}`;
    },
  };
}

export function createShogiEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  variant: ShogiVariant;
}): GameEnvironment<ShogiState, string> {
  const v = meta.variant;
  const K = v.kinds.length - 1;
  const codec = shogiActionCodec(v);
  const shape = [K * 4, v.rows, v.cols] as const;
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
      actionSpaceSize: codec.size,
      observationShape: shape,
    },
    createInitialState: () => createShogiState(v),
    reset: () => createShogiState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalActions(v, s),
    applyAction: (s, a) => applyShogiAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: shogiOutcome,
    getReward: (s, p) => shogiOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidShogiState(v, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) =>
      `${s.board.join(',')}|${s.hands[0].join('')}|${s.hands[1].join('')}|${s.toMove}`,
    encodeAction: codec.encode,
    decodeAction: (index) => codec.decode(index),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
      // Planes: own pieces by kind, opponent pieces by kind, own hand counts, opponent hand counts.
      const N = v.rows * v.cols;
      const data = new Array<number>(K * 4 * N).fill(0);
      s.board.forEach((code, sq) => {
        if (code === 0) return;
        const mine = (code > 0 ? 0 : 1) === player;
        data[((mine ? 0 : K) + Math.abs(code) - 1) * N + sq] = 1;
      });
      for (const o of [0, 1] as const)
        for (let k = 1; k <= K; k++) {
          const n = s.hands[o][k] ?? 0;
          if (!n) continue;
          const plane = (o === player ? 2 * K : 3 * K) + k - 1;
          data.fill(n, plane * N, (plane + 1) * N);
        }
      return { shape, data };
    },
  };
}

export function shogiTwoPlayerRules(v: ShogiVariant): TwoPlayerRules<ShogiState, string> {
  return {
    create: () => createShogiState(v),
    apply: (s, a) => applyShogiAction(v, s, a),
    isLegal: (s, a) => isLegalAction(v, s, a),
    undo: (s, plies) => replayShogi(v, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is ShogiState => isValidShogiState(v, data),
  };
}
