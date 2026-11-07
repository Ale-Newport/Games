/**
 * Sliding puzzle agents and the AI environment factory: a random slide, a greedy slider (the
 * move that lowers Manhattan distance plus linear conflicts the most, never undoing the last one),
 * and the solver (optimal IDA* when it fits its budget, weighted A* otherwise).
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
import { heuristic, movable, slide } from './engine';
import {
  isValidSlideState,
  newSlide,
  nextMove,
  push,
  type SlideSpec,
  type SlideState,
} from './play';

/** A move limit per episode so that random play ends. */
export const MOVE_LIMIT = (size: number) => (size === 3 ? 200 : 600);

export const slideActions = (s: SlideState) =>
  s.solved || s.moves >= MOVE_LIMIT(s.size) ? [] : movable(s.board).map((t) => `t:${t}`);

export function greedyMove(s: SlideState, rng: Rng): string {
  const last = s.history[s.history.length - 1];
  const options = movable(s.board).filter((t) => t !== last);
  let best: number[] = [];
  let score = Infinity;
  for (const t of options) {
    const h = heuristic(slide(s.board, t));
    if (h < score) {
      score = h;
      best = [t];
    } else if (h === score) best.push(t);
  }
  return `t:${rng.pick(best)}`;
}

export const solverMove = (s: SlideState) => `t:${nextMove(s.board).tile}`;

class SlideAgent implements Agent<SlideState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: SlideState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<SlideState, string>,
    s: SlideState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.move(s, ctx.rng);
  }
}

export function slideOutcome(s: SlideState): Outcome | null {
  if (!s.solved && s.moves < MOVE_LIMIT(s.size)) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.moves : -heuristic(s.board)],
    reason: s.solved ? 'solved' : 'move-limit',
  };
}

export function createSlideEnv(
  id: string,
  rulesetId: string,
  version: string,
  specs: Record<string, SlideSpec>,
): GameEnvironment<SlideState, string, SlideState, { level?: string }> {
  const first = Object.keys(specs)[0]!;
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
    createInitialState: (config, seed) => newSlide(specs, config?.level ?? first, seed >>> 0),
    reset: (seed) => newSlide(specs, first, seed >>> 0),
    getObservation: (s) => s,
    getLegalActions: (s) => slideActions(s),
    applyAction: (s, a) => {
      if (!slideActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      return push(s, Number(a.slice(2)));
    },
    getCurrentPlayer: (s) => (slideOutcome(s) ? NO_PLAYER : 0),
    isTerminal: (s) => slideOutcome(s) !== null,
    getOutcome: slideOutcome,
    getReward: (s) => slideOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidSlideState(parsed, specs)) throw new Error('Invalid sliding puzzle state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}

export const SLIDE_AGENTS: AgentPreset<SlideState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Slides any tile next to the gap.',
      es: 'Desliza cualquier ficha junto al hueco.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy', es: 'Voraz' },
    description: {
      en: 'Slides the tile that brings the board closest to solved (Manhattan distance plus line conflicts), never straight back.',
      es: 'Desliza la ficha que más acerca el tablero a la solución (distancia Manhattan más conflictos en línea), sin deshacer el último movimiento.',
    },
    create: () => new SlideAgent('greedy', 'Greedy', greedyMove),
  },
  {
    id: 'solver',
    kind: 'search',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'IDA* with Manhattan distance and linear conflicts (optimal when it fits its budget), weighted A* otherwise.',
      es: 'IDA* con distancia Manhattan y conflictos lineales (óptimo si cabe en su presupuesto) y, si no, A* ponderado.',
    },
    create: () => new SlideAgent('solver', 'Solver', (s) => solverMove(s)),
  },
];
