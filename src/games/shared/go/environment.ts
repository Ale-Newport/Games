/** GameEnvironment factory, two-player rules binding and agent presets for Go (#025–#027). */
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
  PASS,
  applyGoAction,
  createGoState,
  isLegalPoint,
  isValidGoState,
  legalGoActions,
  undoGo,
  type GoRules,
  type GoState,
} from './engine';
import { GoMctsAgent } from './mcts';

export function goOutcome(s: GoState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
    scores: s.result.score,
  };
}

export function createGoEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  rules: GoRules;
}): GameEnvironment<GoState, number> {
  const { rules } = meta;
  const N = rules.size * rules.size;
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
      observationShape: [3, rules.size, rules.size],
    },
    createInitialState: () => createGoState(rules),
    reset: () => createGoState(rules),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalGoActions(s),
    applyAction: (s, a) => applyGoAction(rules, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: goOutcome,
    getReward: (s, p) => goOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidGoState(rules, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join('')}|${s.toMove}|${s.passes}`,
    // Point index for stones, N for a pass.
    encodeAction: (a) => (a === PASS ? N : a),
    decodeAction: (i) => (i === N ? PASS : i),
    actionToString: (a) => (a === PASS ? 'pass' : String(a)),
    getObservationTensor: (s, player) => {
      const mine = player === 0 ? 1 : 2;
      const data = new Array<number>(3 * N).fill(0);
      s.board.forEach((v, p) => {
        if (v === mine) data[p] = 1;
        else if (v !== 0) data[N + p] = 1;
        else data[2 * N + p] = 1;
      });
      return { shape: [3, rules.size, rules.size], data };
    },
  };
}

export function goTwoPlayerRules(rules: GoRules): TwoPlayerRules<GoState, number> {
  return {
    create: () => createGoState(rules),
    apply: (s, a) => applyGoAction(rules, s, a),
    isLegal: (s, a) => !s.result && (a === PASS || isLegalPoint(s, a)),
    undo: (s, plies) => undoGo(rules, s, plies),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is GoState => isValidGoState(rules, data),
  };
}

export interface GoLevels {
  easy: { playouts: number; randomness: number };
  medium: { playouts: number };
  hard: { timeLimitMs: number };
  expert: { timeLimitMs: number };
}

export function goPresets(rules: GoRules, levels: GoLevels): AgentPreset<GoState, number>[] {
  const mcts = (
    id: string,
    label: string,
    o: { playouts?: number; timeLimitMs?: number; randomness?: number },
  ) => new GoMctsAgent({ id, label, rules, ...o });
  const { easy, medium, hard, expert } = levels;
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Plays any legal point (or passes) at random.',
        es: 'Juega cualquier punto legal (o pasa) al azar.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'mcts',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Monte Carlo search with ${easy.playouts} playouts; a random move ${Math.round(easy.randomness * 100)}% of the time.`,
        es: `Búsqueda Monte Carlo con ${easy.playouts} simulaciones; jugada al azar el ${Math.round(easy.randomness * 100)}% de las veces.`,
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
    {
      id: 'expert',
      kind: 'mcts',
      label: { en: 'Expert', es: 'Experto' },
      description: {
        en: `Monte Carlo tree search for ${expert.timeLimitMs} ms per move.`,
        es: `Búsqueda en árbol Monte Carlo durante ${expert.timeLimitMs} ms por jugada.`,
      },
      create: () => mcts('expert', 'Expert', expert),
    },
  ];
}
