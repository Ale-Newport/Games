/**
 * Hex opponent: Monte Carlo tree search (UCT with RAVE/AMAF). A playout fills every empty cell at
 * random — in Hex a full board always has exactly one winner — so playouts are cheap and AMAF
 * statistics are especially informative. The swap decision uses the same search.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { SWAP, applyHexAction, hexNeighbors, type HexState } from './engine';

interface Node {
  move: number;
  color: number;
  n: number;
  w: number;
  amafN: number;
  amafW: number;
  children: Node[] | null;
}

export interface HexMctsOptions {
  id: string;
  label: string;
  playouts?: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

const RAVE_K = 400;

/** Whether Red (1) joins top and bottom on a completely filled board. */
function redWins(board: Int8Array, size: number, nb: number[][], seen: Uint8Array): boolean {
  seen.fill(0);
  const stack: number[] = [];
  for (let c = 0; c < size; c++)
    if (board[c] === 1) {
      seen[c] = 1;
      stack.push(c);
    }
  while (stack.length) {
    const p = stack.pop()!;
    if (p >= size * (size - 1)) return true;
    for (const n of nb[p]!)
      if (board[n] === 1 && !seen[n]) {
        seen[n] = 1;
        stack.push(n);
      }
  }
  return false;
}

export class HexMctsAgent implements Agent<HexState, number> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  constructor(private readonly options: HexMctsOptions) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<HexState, number>,
    state: HexState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal.filter((a) => a !== SWAP));
    if (legal.includes(SWAP)) return this.decideSwap(env, state, player, ctx);
    return this.search(state, legal, ctx).move;
  }

  /** Swap when the opponent's first stone is worth more to us than the best reply. */
  private decideSwap(
    env: GameEnvironment<HexState, number>,
    state: HexState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const moves = env.getLegalActions(state, player).filter((a) => a !== SWAP);
    const reply = this.search(state, moves, ctx, 0.5);
    const swapped = applyHexAction(state, SWAP);
    // After swapping it is Red's turn: a low Red win rate means the swap is good for us.
    const redBest = this.search(swapped, env.getLegalActions(swapped), ctx, 0.5);
    return 1 - redBest.winRate > reply.winRate ? SWAP : reply.move;
  }

  private search(
    state: HexState,
    moves: number[],
    ctx: DecisionContext,
    share = 1,
  ): { move: number; winRate: number } {
    const size = state.size;
    const nb = hexNeighbors(size);
    const color = state.toMove === 0 ? 1 : 2;
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) * share : undefined;
    const deadline = budget === undefined ? Infinity : now() + budget;
    const maxPlayouts = (this.options.playouts ?? Infinity) * share;
    const root: Node = {
      move: -1,
      color: 3 - color,
      n: 0,
      w: 0,
      amafN: 0,
      amafW: 0,
      children: null,
    };
    root.children = moves.map((m) => ({
      move: m,
      color,
      n: 0,
      w: 0,
      amafN: 0,
      amafW: 0,
      children: null,
    }));
    const board = new Int8Array(size * size);
    const seen = new Uint8Array(size * size);
    const owner = new Int8Array(size * size);
    const empties: number[] = [];
    let playouts = 0;
    while (playouts < maxPlayouts && (playouts & 31 || now() < deadline)) {
      board.set(state.board);
      const path: Node[] = [root];
      let node = root;
      let toPlay = color;
      // Selection and expansion.
      while (node.children && node.children.length) {
        const child = this.select(node);
        board[child.move] = toPlay;
        path.push(child);
        node = child;
        toPlay = 3 - toPlay;
        if (!node.children) {
          if (node.n > 0) {
            const kids: Node[] = [];
            for (let p = 0; p < board.length; p++)
              if (board[p] === 0)
                kids.push({
                  move: p,
                  color: toPlay,
                  n: 0,
                  w: 0,
                  amafN: 0,
                  amafW: 0,
                  children: null,
                });
            node.children = kids;
          }
          break;
        }
      }
      // Playout: random fill of the remaining cells.
      empties.length = 0;
      for (let p = 0; p < board.length; p++) if (board[p] === 0) empties.push(p);
      for (let i = empties.length - 1; i > 0; i--) {
        const j = ctx.rng.int(i + 1);
        const t = empties[i]!;
        empties[i] = empties[j]!;
        empties[j] = t;
      }
      for (const p of empties) {
        board[p] = toPlay;
        toPlay = 3 - toPlay;
      }
      const winner = redWins(board, size, nb, seen) ? 1 : 2;
      owner.set(board);
      for (const nd of path) {
        nd.n++;
        if (nd.color === winner) nd.w++;
        if (nd.children)
          for (const ch of nd.children)
            if (owner[ch.move] === ch.color) {
              ch.amafN++;
              if (ch.color === winner) ch.amafW++;
            }
      }
      playouts++;
    }
    let best = root.children[0]!;
    for (const ch of root.children) if (ch.n > best.n) best = ch;
    const winRate = best.n ? best.w / best.n : 0;
    this.lastStats = { nodes: playouts, value: Math.round(winRate * 1000) / 1000 };
    return { move: best.move, winRate };
  }

  private select(node: Node): Node {
    let best = node.children![0]!;
    let bestScore = -Infinity;
    const logN = Math.log(node.n + 1);
    for (const ch of node.children!) {
      const q = ch.n ? ch.w / ch.n : 0.5;
      const amaf = ch.amafN ? ch.amafW / ch.amafN : 0.5;
      const beta = Math.sqrt(RAVE_K / (3 * node.n + RAVE_K));
      const score =
        (1 - beta) * q +
        beta * amaf +
        0.2 * Math.sqrt(logN / (ch.n + 1)) +
        ((ch.move * 2654435761) % 997) * 1e-7;
      if (score > bestScore) {
        bestScore = score;
        best = ch;
      }
    }
    return best;
  }
}
