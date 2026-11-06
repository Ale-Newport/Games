/** Computer opponents shared by the m,n,k games. Built on generic agents and the exact solver. */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { allLines } from '../../../core/game-engine/grid';
import { markOf, type MnkRules, type MnkState, type Seat } from './engine';
import { MnkSolver } from './solver';

/**
 * Static evaluation in [-1, 1] for `player`: lines still open to only one side, weighted 3^(marks-1).
 * In misère play, owning open lines is a liability, so the sign flips.
 */
export function lineHeuristic(rules: MnkRules) {
  const lines = allLines(rules, rules.k);
  const weights = Array.from({ length: rules.k + 1 }, (_, n) => (n === 0 ? 0 : 3 ** (n - 1)));
  const scale = 3 ** (rules.k - 1) * 2;
  return (_env: GameEnvironment<MnkState, number>, state: MnkState, player: PlayerId): number => {
    const own = markOf(player as Seat);
    let score = 0;
    for (const line of lines) {
      let mine = 0;
      let theirs = 0;
      for (const cell of line) {
        const c = state.board[cell];
        if (c === own) mine++;
        else if (c !== 0) theirs++;
      }
      if (mine > 0 && theirs === 0) score += weights[mine]!;
      else if (theirs > 0 && mine === 0) score -= weights[theirs]!;
    }
    const value = Math.tanh(score / scale);
    return rules.misere ? -value : value;
  };
}

/** Center-first move ordering (better pruning for alpha-beta on line games). */
export function centerFirst(rules: MnkRules) {
  const cr = (rules.rows - 1) / 2;
  const cc = (rules.cols - 1) / 2;
  const distance = (cell: number) =>
    Math.abs(Math.floor(cell / rules.cols) - cr) + Math.abs((cell % rules.cols) - cc);
  return (_state: MnkState, actions: number[]) =>
    actions.slice().sort((a, b) => distance(a) - distance(b));
}

export interface SolverAgentOptions {
  id?: string;
  label?: string;
  /**
   * Positions with at most this many marks are proven (by test) to have only game-value-preserving
   * moves, so the agent may skip the exact search there.
   */
  bookMarks?: number;
  /** Clear the transposition table when it exceeds this many entries (memory bound). */
  maxTableSize?: number;
}

/**
 * Perfect play from the exact solver: only moves that preserve the game-theoretic value are
 * considered; among them the agent prefers positions the heuristic rates best (setting traps for
 * imperfect opponents), breaking remaining ties at random.
 */
export class MnkSolverAgent implements Agent<MnkState, number> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private solver: MnkSolver;
  private readonly evaluate: ReturnType<typeof lineHeuristic>;

  constructor(
    private readonly rules: MnkRules,
    private readonly options: SolverAgentOptions = {},
  ) {
    this.id = options.id ?? 'perfect';
    this.label = options.label ?? 'Perfect';
    this.solver = new MnkSolver(rules);
    this.evaluate = lineHeuristic(rules);
  }

  selectAction(
    env: GameEnvironment<MnkState, number>,
    state: MnkState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('MnkSolverAgent: no legal actions');
    if (this.solver.tableSize > (this.options.maxTableSize ?? 1_500_000))
      this.solver = new MnkSolver(this.rules);
    const before = this.solver.nodes;
    const marks = state.history.length;
    let candidates = legal;
    let value = 0;
    if (marks > (this.options.bookMarks ?? -1)) {
      const values = this.solver.moveValues(state);
      value = Math.max(...legal.map((c) => values.get(c) ?? -1));
      candidates = legal.filter((c) => values.get(c) === value);
    }
    let best = -Infinity;
    let choices: number[] = [];
    for (const cell of ctx.rng.shuffle(candidates)) {
      const next = env.applyAction(state, cell);
      const score = env.isTerminal(next)
        ? (env.getOutcome(next)?.returns[player] ?? 0) * 10
        : this.evaluate(env, next, player);
      if (score > best + 1e-9) {
        best = score;
        choices = [cell];
      } else if (Math.abs(score - best) <= 1e-9) choices.push(cell);
    }
    this.lastStats = { nodes: this.solver.nodes - before, value };
    return ctx.rng.pick(choices);
  }
}
