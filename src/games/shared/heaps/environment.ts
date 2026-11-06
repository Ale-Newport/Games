/** GameEnvironment factory, two-player rules binding and agent presets for the heap games. */
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
  applyHeapsAction,
  createHeapsState,
  isValidHeapsState,
  legalHeapsActions,
  replayHeaps,
  setupFor,
  type HeapsState,
  type HeapsVariant,
} from './engine';
import { HeapsSolverAgent } from './solver';

/** Largest heap size any variant starts with (the codec and tensor are sized for it). */
export const MAX_HEAP = 30;
export const MAX_HEAPS = 5;

export function heapsOutcome(v: HeapsVariant, s: HeapsState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: v.misere ? 'took-last-misere' : 'took-last',
  };
}

/** Index: heap h, amount k → h·MAX_HEAP + (k − 1); both heaps, k → MAX_HEAPS·MAX_HEAP + k − 1. */
export const heapsCodec = {
  size: (MAX_HEAPS + 1) * MAX_HEAP,
  encode(a: string): number {
    const [where, amount] = a.split(':');
    const k = Number(amount) - 1;
    return (where === 'b' ? MAX_HEAPS : Number(where)) * MAX_HEAP + k;
  },
  decode(i: number): string {
    const h = Math.floor(i / MAX_HEAP);
    const k = (i % MAX_HEAP) + 1;
    return h === MAX_HEAPS ? `b:${k}` : `${h}:${k}`;
  },
};

export function createHeapsEnv(
  v: HeapsVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<HeapsState, string> {
  const outcome = (s: HeapsState) => heapsOutcome(v, s);
  return {
    ...info,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 2,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: true,
      actionSpaceSize: heapsCodec.size,
      observationShape: [MAX_HEAPS],
    },
    // The seed picks the starting heaps (rounds in the app draw them at random).
    createInitialState: (_c, seed) => createHeapsState(setupFor(v, seed)),
    reset: (seed) => createHeapsState(setupFor(v, seed)),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalHeapsActions(v, s),
    applyAction: (s, a) => applyHeapsAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: outcome,
    getReward: (s, p) => outcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidHeapsState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.heaps.join(',')}|${s.toMove}`,
    encodeAction: heapsCodec.encode,
    decodeAction: (i) => heapsCodec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s) => {
      // Heap sizes scaled to [0, 1]; unused heaps are 0.
      const data = new Array<number>(MAX_HEAPS).fill(0);
      s.heaps.forEach((n, h) => (data[h] = n / MAX_HEAP));
      return { shape: [MAX_HEAPS], data };
    },
  };
}

export function heapsTwoPlayerRules(
  v: HeapsVariant,
  seed: () => number = () => Math.floor(Math.random() * 2 ** 31),
): TwoPlayerRules<HeapsState, string> {
  return {
    create: (first) => createHeapsState(setupFor(v, seed()), first),
    restart: (s) => createHeapsState(s.start, s.first),
    apply: (s, a) => applyHeapsAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalHeapsActions(v, s).includes(a),
    undo: (s, plies) => replayHeaps(v, s.start, s.first, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is HeapsState => isValidHeapsState(v, data),
  };
}

export function heapsPresets(v: HeapsVariant): AgentPreset<HeapsState, string>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Takes at random.', es: 'Toma al azar.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'solver',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: 'Knows the winning move but plays it only 30% of the time.',
        es: 'Conoce la jugada ganadora pero solo la juega el 30% de las veces.',
      },
      create: () => new HeapsSolverAgent('easy', 'Easy', v, 0.3),
    },
    {
      id: 'medium',
      kind: 'solver',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: 'Plays the winning move 75% of the time.',
        es: 'Juega la jugada ganadora el 75% de las veces.',
      },
      create: () => new HeapsSolverAgent('medium', 'Medium', v, 0.75),
    },
    {
      id: 'hard',
      kind: 'solver',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: 'Perfect play from an exact solver; stalls when it is losing.',
        es: 'Juego perfecto con un solucionador exacto; alarga la partida cuando va perdiendo.',
      },
      create: () => new HeapsSolverAgent('hard', 'Hard', v, 1),
    },
  ];
}
