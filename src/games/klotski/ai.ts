/**
 * Sliding Blocks agents: a random move, a greedy mover (the move that brings the big block nearest
 * the exit, never straight back), and the breadth-first solver (fewest moves).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { GOAL, W, blocksOf, keyOf, movesFrom, solve, type KlotskiState } from './engine';

export const MOVE_LIMIT = 300;

/** Actions are relocations "from:to" of a block's top-left cell. */
export const klotskiActions = (s: KlotskiState) =>
  s.solved || s.steps.length >= MOVE_LIMIT
    ? []
    : movesFrom(s.board).map((m) => `${m.block.at}:${m.to}`);

/** Rows plus columns between the big block and its place over the exit. */
export function distanceToExit(board: readonly string[]): number {
  const big = blocksOf(board).find((b) => b.kind === 'A')!;
  return (
    Math.abs(Math.floor(big.at / W) - Math.floor(GOAL / W)) + Math.abs((big.at % W) - (GOAL % W))
  );
}

export function greedyMove(s: KlotskiState, rng: Rng): string {
  const last = s.steps[s.steps.length - 1];
  let best: string[] = [];
  let score = Infinity;
  for (const m of movesFrom(s.board)) {
    if (last && m.block.at === last[1] && m.to === last[0]) continue;
    // Closer to the exit first; among equals, a move of a block other than the big one opens room.
    const sc = distanceToExit(m.board) * 10 + (m.block.kind === 'A' ? 0 : 1);
    if (sc < score) {
      score = sc;
      best = [`${m.block.at}:${m.to}`];
    } else if (sc === score) best.push(`${m.block.at}:${m.to}`);
  }
  return best.length ? rng.pick(best) : rng.pick(klotskiActions(s));
}

const plans = new Map<string, [number, number][]>();
/** The solver's next relocation; whole plans are cached by position along their path. */
export function solverStep(board: readonly string[]): [number, number] | null {
  const key = keyOf(board);
  let plan = plans.get(key);
  if (!plan) {
    plan = solve(board) ?? [];
    if (plans.size > 2000) plans.clear();
    let at = [...board];
    plan.forEach((m, k) => {
      plans.set(keyOf(at), plan!.slice(k));
      const b = blocksOf(at).find((x) => x.at === m[0])!;
      at = movesFrom(at).find((x) => x.block.at === b.at && x.to === m[1])!.board;
    });
  }
  return plan[0] ?? null;
}

export const solverMove = (s: KlotskiState): string => {
  const step = solverStep(s.board);
  return step ? `${step[0]}:${step[1]}` : klotskiActions(s)[0]!;
};

class KlotskiAgent implements Agent<KlotskiState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: KlotskiState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<KlotskiState, string>,
    s: KlotskiState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.pick(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<KlotskiState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Moves any block anywhere it can go.',
      es: 'Mueve cualquier bloque a donde pueda ir.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy mover', es: 'Movedor voraz' },
    description: {
      en: 'Brings the big block as near the exit as it can, never straight back.',
      es: 'Acerca el bloque grande a la salida todo lo que puede, sin volver atrás de inmediato.',
    },
    create: () => new KlotskiAgent('greedy', 'Greedy mover', greedyMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Solver', es: 'Solucionador' },
    description: {
      en: 'Breadth-first search over positions: always the fewest moves.',
      es: 'Búsqueda en anchura sobre las posiciones: siempre el menor número de movimientos.',
    },
    create: () => new KlotskiAgent('solver', 'Solver', (s) => solverMove(s)),
  },
];
