/** GameEnvironment factory, two-player rules binding, evaluation and agent presets for Morris. */
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
  applyMorrisAction,
  createMorrisState,
  geometryOf,
  isValidMorrisState,
  legalMorrisActions,
  replayMorris,
  type MorrisState,
  type MorrisVariant,
} from './engine';

export function morrisOutcome(s: MorrisState): Outcome | null {
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

/** Action index: `(from + 1)·N² + to·N + (remove + 1)` style packing over N points. */
export function morrisCodec(v: MorrisVariant) {
  const N = v.points.length;
  const g = geometryOf(v);
  const at = (name: string) => g.index.get(name)!;
  return {
    size: (N + 1) * N * (N + 1),
    encode(a: string): number {
      const m = /^(?:([a-g]\d)-)?([a-g]\d)(?:x([a-g]\d))?$/.exec(a);
      if (!m) throw new Error(`Malformed morris action ${a}`);
      const from = m[1] ? at(m[1]) : -1;
      const remove = m[3] ? at(m[3]) : -1;
      return ((from + 1) * N + at(m[2]!)) * (N + 1) + remove + 1;
    },
    decode(i: number): string {
      const remove = (i % (N + 1)) - 1;
      const pair = Math.floor(i / (N + 1));
      const to = pair % N;
      const from = Math.floor(pair / N) - 1;
      const p = v.points;
      return `${from >= 0 ? `${p[from]}-` : ''}${p[to]}${remove >= 0 ? `x${p[remove]}` : ''}`;
    },
  };
}

/** Pieces (board + hand), mills, two-in-a-row threats and mobility, in [-1, 1] for `player`. */
export function evaluateMorris(v: MorrisVariant, s: MorrisState, player: PlayerId): number {
  const g = geometryOf(v);
  const me = (player as number) + 1;
  const enemy = 3 - me;
  let score = 0;
  for (const color of [me, enemy]) {
    const sign = color === me ? 1 : -1;
    const seat = color - 1;
    const pieces = s.board.filter((x) => x === color).length + s.inHand[seat as 0 | 1];
    score += sign * pieces * 100;
    for (const m of g.mills) {
      const mine = m.filter((p) => s.board[p] === color).length;
      const empty = m.filter((p) => s.board[p] === 0).length;
      if (mine === 3) score += sign * 30;
      else if (mine === 2 && empty === 1) score += sign * (v.millWins ? 60 : 15);
    }
  }
  // Mobility in every phase: free neighbors of each piece (a blockade loses the game, and it is
  // usually decided while the last pieces are being placed).
  const flyingSeat = (seat: 0 | 1) =>
    v.flying && s.inHand[seat] === 0 && s.board.filter((x) => x === seat + 1).length === 3;
  for (const color of [me, enemy]) {
    if (flyingSeat((color - 1) as 0 | 1)) continue;
    let free = 0;
    let stuck = 0;
    s.board.forEach((x, p) => {
      if (x !== color) return;
      const n = g.adjacent[p]!.filter((q) => s.board[q] === 0).length;
      free += n;
      if (n === 0) stuck++;
    });
    score += (color === me ? 1 : -1) * (free * 6 - stuck * 10);
  }
  return Math.tanh(score / 600);
}

export function createMorrisEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
  variant: MorrisVariant;
}): GameEnvironment<MorrisState, string> {
  const v = meta.variant;
  const codec = morrisCodec(v);
  const N = v.points.length;
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
      observationShape: [3, N],
    },
    createInitialState: () => createMorrisState(v),
    reset: () => createMorrisState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalMorrisActions(v, s),
    applyAction: (s, a) => applyMorrisAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: morrisOutcome,
    getReward: (s, p) => morrisOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidMorrisState(v, parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => s.keys[s.keys.length - 1]!,
    encodeAction: codec.encode,
    decodeAction: (i) => codec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
      const mine = (player as number) + 1;
      const data = new Array<number>(3 * N).fill(0);
      s.board.forEach((x, p) => {
        if (x === mine) data[p] = 1;
        else if (x !== 0) data[N + p] = 1;
      });
      // Third plane: pieces still in hand, as fractions, on every point.
      data.fill(s.inHand[player as 0 | 1] / v.pieces, 2 * N, 3 * N);
      return { shape: [3, N], data };
    },
  };
}

export function morrisTwoPlayerRules(v: MorrisVariant): TwoPlayerRules<MorrisState, string> {
  return {
    create: () => createMorrisState(v),
    apply: (s, a) => applyMorrisAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalMorrisActions(v, s).includes(a),
    undo: (s, plies) => replayMorris(v, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is MorrisState => isValidMorrisState(v, data),
  };
}

export interface MorrisLevels {
  easy: { depth: number; epsilon: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function morrisPresets(
  v: MorrisVariant,
  levels: MorrisLevels,
): AgentPreset<MorrisState, string>[] {
  const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
    new AlphaBetaAgent<MorrisState, string>({
      id,
      label,
      maxDepth,
      timeLimitMs,
      evaluate: (_env, s, player) => evaluateMorris(v, s, player),
      // Mill-forming moves (with a removal) first.
      orderActions: (_s, actions) =>
        actions.slice().sort((a, b) => Number(b.includes('x')) - Number(a.includes('x'))),
    });
  const { easy, medium, hard } = levels;
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
        en: `Looks ${easy.depth} plies ahead; a random move ${Math.round(easy.epsilon * 100)}% of the time.`,
        es: `Mira ${easy.depth} jugadas por delante; jugada al azar el ${Math.round(easy.epsilon * 100)}% de las veces.`,
      },
      create: () =>
        new EpsilonAgent(search('easy-core', 'Easy core', easy.depth), easy.epsilon, {
          id: 'easy',
          label: 'Easy',
        }),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Alpha-beta ${medium.depth} plies with mills, threats and mobility.`,
        es: `Alfa-beta a ${medium.depth} jugadas con molinos, amenazas y movilidad.`,
      },
      create: () => search('medium', 'Medium', medium.depth),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Iterative deepening up to ${hard.depth} plies within ${hard.timeLimitMs} ms.`,
        es: `Profundización iterativa hasta ${hard.depth} jugadas en ${hard.timeLimitMs} ms.`,
      },
      create: () => search('hard', 'Hard', hard.depth, hard.timeLimitMs),
    },
  ];
}
