/** GameEnvironment factory, two-player rules binding and agent presets for janggi (#024). */
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
  SETUPS,
  applyJanggiAction,
  createJanggiState,
  isValidJanggiState,
  janggiLegalActions,
  janggiPlacement,
  replayJanggi,
  type JanggiState,
} from './janggi';
import { JanggiSearchAgent } from './janggi-search';
import { parseSquare, squareName } from './position';

export function janggiOutcome(s: JanggiState): Outcome | null {
  if (!s.result) return null;
  if (s.result.kind === 'draw')
    return { returns: [0, 0], winners: [], draw: true, reason: s.result.reason };
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
    scores: s.result.points,
  };
}

/** Action index `from·90 + to`, and 8100 for passing. */
export const janggiCodec = {
  size: 90 * 90 + 1,
  encode: (a: string) => {
    if (a === PASS) return 8100;
    const m = /^([a-i]\d)([a-i]\d)$/.exec(a);
    if (!m) throw new Error(`Malformed janggi action ${a}`);
    return parseSquare(m[1]!) * 90 + parseSquare(m[2]!);
  },
  decode: (i: number) =>
    i === 8100 ? PASS : `${squareName(Math.floor(i / 90))}${squareName(i % 90)}`,
};

/** Start placement for a seed: each side's horse/elephant order is one of the four setups. */
export const janggiStartFor = (seed: number) =>
  janggiPlacement(SETUPS[((seed % 4) + 4) % 4]!, SETUPS[(((seed >> 2) % 4) + 4) % 4]!);

export function createJanggiEnvironment(meta: {
  id: string;
  version: string;
  rulesetId: string;
}): GameEnvironment<JanggiState, string> {
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
      actionSpaceSize: janggiCodec.size,
      observationShape: [14, 10, 9],
    },
    createInitialState: (_c, seed) => createJanggiState(janggiStartFor(seed)),
    reset: (seed) => createJanggiState(janggiStartFor(seed)),
    getObservation: (s) => structuredClone(s),
    getLegalActions: (s, player) =>
      player !== undefined && player !== s.toMove ? [] : janggiLegalActions(s),
    applyAction: (s, a) => applyJanggiAction(s, a),
    getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
    isTerminal: (s) => s.result !== null,
    getOutcome: janggiOutcome,
    getReward: (s, p) => janggiOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidJanggiState(parsed)) throw new Error(`Invalid ${meta.id} state`);
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    stateKey: (s) => `${s.board.join(',')}|${s.toMove}|${s.history[s.history.length - 1] === PASS}`,
    encodeAction: janggiCodec.encode,
    decodeAction: (i) => janggiCodec.decode(i),
    actionToString: (a) => a,
    getObservationTensor: (s, player) => {
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

export function janggiTwoPlayerRules(
  seed: () => number = () => 0,
): TwoPlayerRules<JanggiState, string> {
  return {
    create: () => createJanggiState(janggiStartFor(seed())),
    restart: (s) => createJanggiState(s.startPlacement),
    apply: (s, a) => applyJanggiAction(s, a),
    isLegal: (s, a) => typeof a === 'string' && janggiLegalActions(s).includes(a),
    undo: (s, plies) => replayJanggi(s.startPlacement, s.history.slice(0, -plies)),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is JanggiState => isValidJanggiState(data),
  };
}

export interface JanggiLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number; timeLimitMs: number };
  hard: { depth: number; timeLimitMs: number };
  expert: { depth: number; timeLimitMs: number };
}

export function janggiPresets(levels: JanggiLevels): AgentPreset<JanggiState, string>[] {
  const search = (id: string, label: string, depth: number, timeLimitMs?: number, randomness = 0) =>
    new JanggiSearchAgent({ id, label, maxDepth: depth, timeLimitMs, randomness });
  const { easy, medium, hard, expert } = levels;
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Plays any legal move (or a pass) at random.',
        es: 'Juega cualquier jugada legal (o pasa) al azar.',
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
