/**
 * Sliding-merge agents and the environment factory: a random slide, a corner keeper (the classic
 * hand strategy: down, left, right, then up only when forced), and expectimax search (two moves
 * deep over the possible new tiles, scoring empty cells, monotonic lines, smoothness and a corner
 * maximum).
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import { DIRS, bestMove, slide, type Dir, type MergeRules } from './engine';
import { isValidMergeState, newMerge, play, type MergeGameState } from './play';

/** A cap so that episodes end even when the board keeps going. */
export const MOVE_LIMIT = 5000;

export function mergeActions(s: MergeGameState, rules: MergeRules): string[] {
  if (s.over || s.moves >= MOVE_LIMIT) return [];
  return DIRS.filter((d) => slide(s.board, rules, d).moved);
}

export function cornerMove(s: MergeGameState, rules: MergeRules): Dir {
  for (const d of ['down', 'left', 'right', 'up'] as Dir[])
    if (slide(s.board, rules, d).moved) return d;
  return 'down';
}

class MergeAgent implements Agent<MergeGameState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: MergeGameState) => Dir,
  ) {}
  selectAction(
    _env: GameEnvironment<MergeGameState, string>,
    s: MergeGameState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(s);
  }
}

export function mergeAgents(
  levels: Record<string, MergeRules>,
): AgentPreset<MergeGameState, string>[] {
  const rules = (s: MergeGameState) => levels[s.level]!;
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Slides any way that moves something.',
        es: 'Desliza hacia cualquier lado que mueva algo.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'corner',
      kind: 'heuristic',
      label: { en: 'Corner keeper', es: 'Guardián de esquina' },
      description: {
        en: 'The hand strategy: down, then left, then right, and up only when forced.',
        es: 'La estrategia a mano: abajo, luego izquierda, luego derecha y arriba solo si no queda otra.',
      },
      create: () => new MergeAgent('corner', 'Corner keeper', (s) => cornerMove(s, rules(s))),
    },
    {
      id: 'expectimax',
      kind: 'search',
      label: { en: 'Expectimax', es: 'Expectimax' },
      description: {
        en: 'Looks two moves ahead over the possible new tiles, valuing empty cells, ordered lines and a corner maximum.',
        es: 'Mira dos jugadas por delante sobre las fichas que pueden salir, valorando casillas vacías, líneas ordenadas y el máximo en una esquina.',
      },
      create: () =>
        new MergeAgent(
          'expectimax',
          'Expectimax',
          (s) => bestMove(s.board, rules(s), 2) ?? cornerMove(s, rules(s)),
        ),
    },
  ];
}

export function createMergeEnv(
  id: string,
  rulesetId: string,
  version: string,
  levels: Record<string, MergeRules>,
): GameEnvironment<MergeGameState, string, MergeGameState, { level?: string }> {
  const first = Object.keys(levels)[0]!;
  const rules = (s: MergeGameState) => levels[s.level]!;
  const outcome = (s: MergeGameState): Outcome | null =>
    mergeActions(s, rules(s)).length
      ? null
      : {
          returns: [s.won ? 1 : 0],
          winners: s.won ? [0] : [],
          draw: false,
          scores: [s.score],
          reason: s.over ? 'no-moves' : 'move-limit',
        };
  return {
    id,
    version,
    rulesetId,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      // New tiles come from the generator stored in the state: transitions are deterministic.
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
    },
    createInitialState: (config, seed) => newMerge(levels, config?.level ?? first, seed >>> 0),
    reset: (seed) => newMerge(levels, first, seed >>> 0),
    getObservation: (s) => s,
    getLegalActions: (s) => mergeActions(s, rules(s)),
    applyAction: (s, a) => {
      if (!mergeActions(s, rules(s)).includes(a))
        throw new IllegalActionError(`Illegal action ${a}`);
      return play(s, levels, a as Dir);
    },
    getCurrentPlayer: (s) => (outcome(s) ? NO_PLAYER : 0),
    isTerminal: (s) => outcome(s) !== null,
    getOutcome: outcome,
    getReward: (s) => outcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidMergeState(parsed, levels)) throw new Error('Invalid merge state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}
