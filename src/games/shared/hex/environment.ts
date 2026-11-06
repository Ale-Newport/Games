/** GameEnvironment factory, two-player rules binding and agent presets for Hex (#028–#029). */
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
  SWAP,
  applyHexAction,
  createHexState,
  isLegalHexAction,
  isValidHexState,
  legalHexActions,
  replayHex,
  type HexState,
} from './engine';
import { HexMctsAgent } from './mcts';

export function hexOutcome(s: HexState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'connection',
  };
}

export function createHexEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  size: number;
}): GameEnvironment<HexState, number> {
  const { size } = meta;
  const N = size * size;
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
      actionSpaceSize: N + 1,
      observationShape: [2, size, size],
    },
    createInitialState: () => createHexState(size),
    reset: () => createHexState(size),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalHexActions(s),
    applyAction: (s, a) => applyHexAction(s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: hexOutcome,
    getReward: (s, p) => hexOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidHexState(size, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join('')}|${s.toMove}|${s.history.length === 1}`,
    // Cells 0…N−1, the swap at N.
    encodeAction: (a) => (a === SWAP ? N : a),
    decodeAction: (i) => (i === N ? SWAP : i),
    actionToString: (a) => (a === SWAP ? 'swap' : String(a)),
    getObservationTensor: (s, player) => {
      const mine = player === 0 ? 1 : 2;
      const data = new Array<number>(2 * N).fill(0);
      s.board.forEach((v, p) => {
        if (v === mine) data[p] = 1;
        else if (v !== 0) data[N + p] = 1;
      });
      return { shape: [2, size, size], data };
    },
  };
}

export function hexTwoPlayerRules(size: number): TwoPlayerRules<HexState, number> {
  return {
    create: () => createHexState(size),
    apply: (s, a) => applyHexAction(s, a),
    isLegal: (s, a) => isLegalHexAction(s, a),
    undo: (s, plies) => replayHex(size, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is HexState => isValidHexState(size, data),
  };
}

export interface HexLevels {
  easy: { playouts: number; randomness: number };
  medium: { playouts: number };
  hard: { timeLimitMs: number };
  /** Optional: only offered where more time measurably helps. */
  expert?: { timeLimitMs: number };
}

export function hexPresets(levels: HexLevels): AgentPreset<HexState, number>[] {
  const mcts = (
    id: string,
    label: string,
    o: { playouts?: number; timeLimitMs?: number; randomness?: number },
  ) => new HexMctsAgent({ id, label, ...o });
  const { easy, medium, hard, expert } = levels;
  const presets: AgentPreset<HexState, number>[] = [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Plays any empty cell at random.',
        es: 'Juega cualquier casilla libre al azar.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'mcts',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Monte Carlo search with ${easy.playouts} random fills; a random move ${Math.round(easy.randomness * 100)}% of the time.`,
        es: `Búsqueda Monte Carlo con ${easy.playouts} rellenos aleatorios; jugada al azar el ${Math.round(easy.randomness * 100)}% de las veces.`,
      },
      create: () => mcts('easy', 'Easy', easy),
    },
    {
      id: 'medium',
      kind: 'mcts',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Monte Carlo tree search (UCT + RAVE) with ${medium.playouts} playouts.`,
        es: `Búsqueda en árbol Monte Carlo (UCT + RAVE) con ${medium.playouts} simulaciones.`,
      },
      create: () => mcts('medium', 'Medium', medium),
    },
    {
      id: 'hard',
      kind: 'mcts',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Monte Carlo tree search for ${hard.timeLimitMs} ms per move.`,
        es: `Búsqueda en árbol Monte Carlo durante ${hard.timeLimitMs} ms por jugada.`,
      },
      create: () => mcts('hard', 'Hard', hard),
    },
  ];
  if (expert)
    presets.push({
      id: 'expert',
      kind: 'mcts',
      label: { en: 'Expert', es: 'Experto' },
      description: {
        en: `Monte Carlo tree search for ${expert.timeLimitMs} ms per move.`,
        es: `Búsqueda en árbol Monte Carlo durante ${expert.timeLimitMs} ms por jugada.`,
      },
      create: () => mcts('expert', 'Expert', expert),
    });
  return presets;
}
