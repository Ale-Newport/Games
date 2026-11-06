/** GameEnvironment factory, evaluation, two-player rules binding and agent presets for hunt games. */
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
  applyHuntAction,
  createHuntState,
  isValidHuntState,
  jumpsFrom,
  legalHuntActions,
  replayHunt,
  stepFrom,
  type HuntState,
  type HuntVariant,
} from './engine';

export function huntOutcome(s: HuntState): Outcome | null {
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
 * From the hunters' side: captures (heavily), hunter mobility (steps and jumps — the prey win by
 * taking it to zero) and prey pieces left hanging (a jump is ready against them).
 */
export function evaluateHunt(v: HuntVariant, s: HuntState, player: PlayerId): number {
  let steps = 0;
  let jumps = 0;
  s.board.forEach((x, p) => {
    if (x !== 2) return;
    for (let d = 0; d < 8; d++) {
      const q = stepFrom(v, s.board, p, d);
      if (q >= 0 && s.board[q] === 0) steps++;
    }
    jumps += jumpsFrom(v, s.board, p).length;
  });
  // Prey that may only advance (geese) must keep moving forward as a wall, or they shuffle forever.
  let advance = 0;
  if (v.preyNoBackward) s.board.forEach((x, p) => x === 1 && (advance += Math.floor(p / v.size)));
  const score =
    12 * s.captured +
    1.2 * steps +
    (s.toMove === 1 ? 6 : 2.5) * jumps -
    (steps + jumps === 0 ? 40 : 0) -
    0.9 * advance;
  const forHunters = Math.tanh((score - 6 * v.hunters.length) / 30);
  return player === 1 ? forHunters : -forHunters;
}

/** Index: placement p → p; move f → t → area + f·area + t; "stop" last. */
export function huntCodec(v: HuntVariant) {
  const area = v.size * v.size;
  return {
    size: area + area * area + 1,
    encode(a: string): number {
      if (a === 'stop') return area + area * area;
      if (a.startsWith('+')) return Number(a.slice(1));
      const [f, t] = a.split('-').map(Number) as [number, number];
      return area + f * area + t;
    },
    decode(i: number): string {
      if (i === area + area * area) return 'stop';
      if (i < area) return `+${i}`;
      const j = i - area;
      return `${Math.floor(j / area)}-${j % area}`;
    },
  };
}

export function createHuntEnv(
  v: HuntVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<HuntState, string> {
  const codec = huntCodec(v);
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
    createInitialState: () => createHuntState(v),
    reset: () => createHuntState(v),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : legalHuntActions(v, s),
    applyAction: (s, a) => applyHuntAction(v, s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: huntOutcome,
    getReward: (s, p) => huntOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidHuntState(v, parsed)) throw new Error(`Invalid ${info.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.keys[s.keys.length - 1]!}|${s.chain ?? '-'}|${s.captured}`,
    encodeAction: codec.encode,
    decodeAction: (i) => codec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s) => {
      // Planes: prey, hunters, points of the board.
      const area = v.size * v.size;
      const data = new Array<number>(3 * area).fill(0);
      s.board.forEach((x, p) => {
        if (x === 1) data[p] = 1;
        if (x === 2) data[area + p] = 1;
        if (x !== -1) data[2 * area + p] = 1;
      });
      return { shape: [3, v.size, v.size], data };
    },
  };
}

export function huntTwoPlayerRules(v: HuntVariant): TwoPlayerRules<HuntState, string> {
  return {
    create: () => createHuntState(v),
    apply: (s, a) => applyHuntAction(v, s, a),
    isLegal: (s, a) => typeof a === 'string' && legalHuntActions(v, s).includes(a),
    undo: (s, plies) => replayHunt(v, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => s.movers[ply] ?? ((ply % 2) as 0 | 1),
    outcome: (s) => (s.result ? { winner: s.result.winner } : null),
    validate: (data): data is HuntState => isValidHuntState(v, data),
  };
}

export interface HuntLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function huntPresets(v: HuntVariant, levels: HuntLevels): AgentPreset<HuntState, string>[] {
  const search = (id: string, label: string, maxDepth: number, timeLimitMs?: number) =>
    new AlphaBetaAgent<HuntState, string>({
      id,
      label,
      maxDepth,
      timeLimitMs,
      evaluate: (_env, s, player) => evaluateHunt(v, s, player),
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
