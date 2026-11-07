/**
 * Twisty cube agents and the environment factory: a random turn, a greedy turner (the turn that
 * puts the most stickers on their own face's color), and the size's solver.
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
import type { Rng } from '../../../core/game-engine/random';
import { FACES, moveName, moveSet, parseMove, turn, type Cube, type Face, type Turn } from './cube';
import { isValidCubeState, newCube, play, type CubeSpec, type CubeState } from './play';

export const MOVE_LIMIT = 200;

export const cubeActions = (s: CubeState) =>
  s.solved || s.moves.length >= MOVE_LIMIT ? [] : moveSet(s.size).map(moveName);

const AXIS: Record<Face, [number, number]> = {
  R: [0, 1],
  L: [0, -1],
  U: [1, 1],
  D: [1, -1],
  F: [2, 1],
  B: [2, -1],
};
/** Stickers whose color matches the face they sit on. */
export function matching(cube: Cube): number {
  let k = 0;
  for (const st of cube) {
    const face = FACES.find((f) => st.normal[AXIS[f][0]] === AXIS[f][1]);
    if (face === st.color) k++;
  }
  return k;
}

export function greedyTurn(s: CubeState, rng: Rng): Turn {
  let best: Turn[] = [];
  let score = -1;
  for (const t of moveSet(s.size)) {
    const m = matching(turn(s.cube, s.size, t));
    if (m > score) {
      score = m;
      best = [t];
    } else if (m === score) best.push(t);
  }
  return rng.pick(best);
}

class CubeAgent implements Agent<CubeState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: CubeState, rng: Rng) => Turn,
  ) {}
  selectAction(
    _env: GameEnvironment<CubeState, string>,
    s: CubeState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return moveName(this.pick(s, ctx.rng));
  }
}

export function cubeAgents(
  solve: (s: CubeState) => Turn[] | null,
  solver: { en: string; es: string },
): AgentPreset<CubeState, string>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Turns any face.', es: 'Gira cualquier cara.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'greedy',
      kind: 'heuristic',
      label: { en: 'Greedy', es: 'Voraz' },
      description: {
        en: 'Makes the turn that leaves the most stickers on their own color.',
        es: 'Hace el giro que deja más pegatinas en su propio color.',
      },
      create: () => new CubeAgent('greedy', 'Greedy', greedyTurn),
    },
    {
      id: 'solver',
      kind: 'search',
      label: { en: 'Solver', es: 'Solucionador' },
      description: solver,
      create: () =>
        new CubeAgent('solver', 'Solver', (s, rng) => solve(s)?.[0] ?? greedyTurn(s, rng)),
    },
  ];
}

export function cubeOutcome(s: CubeState): Outcome | null {
  if (!s.solved && s.moves.length < MOVE_LIMIT) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.moves.length : matching(s.cube)],
    reason: s.solved ? 'solved' : 'move-limit',
  };
}

export function createCubeEnv(
  id: string,
  rulesetId: string,
  version: string,
  specs: Record<string, CubeSpec>,
): GameEnvironment<CubeState, string, CubeState, { level?: string }> {
  const levels = Object.keys(specs);
  const first = levels[levels.length - 1]!;
  return {
    id,
    version,
    rulesetId,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
    },
    createInitialState: (config, seed) => newCube(specs, config?.level ?? first, seed >>> 0),
    reset: (seed) => newCube(specs, first, seed >>> 0),
    getObservation: (s) => s,
    getLegalActions: (s) => cubeActions(s),
    applyAction: (s, a) => {
      if (!cubeActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      return play(s, parseMove(a)!);
    },
    getCurrentPlayer: (s) => (cubeOutcome(s) ? NO_PLAYER : 0),
    isTerminal: (s) => cubeOutcome(s) !== null,
    getOutcome: cubeOutcome,
    getReward: (s) => cubeOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidCubeState(parsed, specs)) throw new Error('Invalid cube state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}
