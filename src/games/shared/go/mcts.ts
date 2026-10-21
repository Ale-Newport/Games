/**
 * Go opponent: Monte Carlo tree search (UCT with RAVE/AMAF) over fast random playouts on a
 * mutable board. Playouts never fill their own eyes, capture groups left in atari by the last move
 * when they can, and end when neither side has a sensible move; they are scored by area + komi.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { Rng } from '../../../core/game-engine/random';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { PASS, areaScore, neighbors, type GoRules, type GoState } from './engine';

class Playout {
  board: Int8Array;
  ko = -1;
  private readonly nb: number[][];
  private readonly diag: number[][];
  private mark: Uint32Array;
  private stamp = 1;

  constructor(
    readonly size: number,
    board: ArrayLike<number>,
  ) {
    this.board = Int8Array.from(board);
    this.nb = neighbors(size);
    this.diag = Array.from({ length: size * size }, (_, i) => {
      const r = Math.floor(i / size);
      const c = i % size;
      const out: number[] = [];
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ])
        if (r + dr! >= 0 && r + dr! < size && c + dc! >= 0 && c + dc! < size)
          out.push((r + dr!) * size + c + dc!);
      return out;
    });
    this.mark = new Uint32Array(size * size);
  }

  /** Liberty count of the group at p (stops counting at `limit`), and its stones if asked. */
  liberties(p: number, limit: number, stones?: number[]): number {
    const color = this.board[p]!;
    const stamp = ++this.stamp;
    const libStamp = ++this.stamp;
    const stack = [p];
    this.mark[p] = stamp;
    let libs = 0;
    while (stack.length) {
      const q = stack.pop()!;
      stones?.push(q);
      for (const n of this.nb[q]!) {
        const s = this.board[n]!;
        if (s === 0) {
          if (this.mark[n] !== libStamp) {
            this.mark[n] = libStamp;
            if (++libs >= limit && !stones) return libs;
          }
        } else if (s === color && this.mark[n] !== stamp) {
          this.mark[n] = stamp;
          stack.push(n);
        }
      }
    }
    return libs;
  }

  /** A point surrounded by `color` that the opponent could never use (a likely eye). */
  isEye(p: number, color: number): boolean {
    for (const n of this.nb[p]!) if (this.board[n] !== color) return false;
    let bad = 0;
    for (const d of this.diag[p]!) if (this.board[d] !== color && this.board[d] !== 0) bad++;
    return this.diag[p]!.length < 4 ? bad === 0 : bad < 2;
  }

  isLegal(p: number, color: number): boolean {
    if (this.board[p] !== 0 || p === this.ko) return false;
    const enemy = 3 - color;
    for (const n of this.nb[p]!) {
      const s = this.board[n]!;
      if (s === 0) return true;
    }
    // No empty neighbor: legal only if it captures or joins a group with another liberty.
    this.board[p] = color;
    let ok = false;
    for (const n of this.nb[p]!) {
      const s = this.board[n]!;
      if (s === enemy && this.liberties(n, 1) === 0) ok = true;
      else if (s === color && this.liberties(n, 1) > 0) ok = true;
      if (ok) break;
    }
    this.board[p] = 0;
    return ok;
  }

  /** Plays a legal move; returns the number of stones captured. */
  play(p: number, color: number): number {
    const enemy = 3 - color;
    this.board[p] = color;
    let captured = 0;
    let lastCapture = -1;
    for (const n of this.nb[p]!) {
      if (this.board[n] !== enemy || this.liberties(n, 1) > 0) continue;
      const stones: number[] = [];
      this.liberties(n, 1, stones);
      for (const s of stones) this.board[s] = 0;
      captured += stones.length;
      lastCapture = stones[0]!;
    }
    // Simple ko: a single-stone capture by a single stone with one liberty.
    this.ko = captured === 1 && this.liberties(p, 2) === 1 ? lastCapture : -1;
    return captured;
  }

  /** Random sensible move for `color` (captures of groups in atari next to `last` first). */
  pick(color: number, last: number, rng: Rng, empties: number[]): number {
    if (last >= 0) {
      const enemy = 3 - color;
      for (const n of this.nb[last]!) {
        if (this.board[n] !== enemy) continue;
        const stones: number[] = [];
        if (this.liberties(n, 2, stones) !== 1) continue;
        for (const s of stones)
          for (const q of this.nb[s]!) if (this.board[q] === 0 && this.isLegal(q, color)) return q;
      }
    }
    // Random scan from a random start over the (possibly stale) list of empty points.
    const n = empties.length;
    const start = rng.int(Math.max(1, n));
    for (let k = 0; k < n; k++) {
      const p = empties[(start + k) % n]!;
      if (this.board[p] === 0 && !this.isEye(p, color) && this.isLegal(p, color)) return p;
    }
    return PASS;
  }
}

interface Node {
  move: number;
  /** Color that played `move` (1 or 2). */
  color: number;
  n: number;
  w: number;
  amafN: number;
  amafW: number;
  children: Node[] | null;
}

export interface GoMctsOptions {
  id: string;
  label: string;
  rules: GoRules;
  /** Fixed playout count (deterministic level) … */
  playouts?: number;
  /** … or a time budget in milliseconds. */
  timeLimitMs?: number;
  /** Probability of playing a random legal move instead (weak levels). */
  randomness?: number;
  now?: () => number;
}

const RAVE_K = 600;

export class GoMctsAgent implements Agent<GoState, number> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  constructor(private readonly options: GoMctsOptions) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<GoState, number>,
    state: GoState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    const color = state.toMove === 0 ? 1 : 2;
    const { komi } = this.options.rules;
    const size = state.size;
    const lead = () => {
      const { black, white } = areaScore(state.board, size);
      return color === 1 ? black - (white + komi) : white + komi - black;
    };
    // After the opponent passes, passing ends the game: do it when already ahead.
    if (state.passes > 0 && lead() > 0) return PASS;
    const moves = legal.filter((p) => p !== PASS);
    if (moves.length === 0) return PASS;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness)) {
      const probe = new Playout(size, state.board);
      const sensible = moves.filter((p) => !probe.isEye(p, color));
      return sensible.length ? ctx.rng.pick(sensible) : PASS;
    }
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) : undefined;
    const deadline = budget === undefined ? Infinity : now() + budget;
    const maxPlayouts = this.options.playouts ?? Infinity;
    const root: Node = {
      move: PASS,
      color: 3 - color,
      n: 0,
      w: 0,
      amafN: 0,
      amafW: 0,
      children: null,
    };
    const legalSet = new Set(moves);
    let playouts = 0;
    const maxLen = size * size * 3;
    const seenColor = new Int8Array(size * size);
    while (playouts < maxPlayouts && (playouts & 15 || now() < deadline)) {
      const pos = new Playout(size, state.board);
      // Root moves come from the superko-checked legal list; the tree then tracks simple ko.
      const path: Node[] = [root];
      let node = root;
      let toPlay = color;
      let last = state.history[state.history.length - 1] ?? -1;
      let passes = 0;
      seenColor.fill(0);
      // Selection / expansion.
      while (true) {
        if (!node.children) {
          node.children = this.expand(pos, toPlay, node === root ? legalSet : null);
          if (node !== root) break;
        }
        if (node.children.length === 0) break;
        const child = this.select(node);
        if (child.move === PASS) passes++;
        else {
          passes = 0;
          pos.play(child.move, toPlay);
          if (!seenColor[child.move]) seenColor[child.move] = toPlay;
        }
        last = child.move;
        path.push(child);
        node = child;
        toPlay = 3 - toPlay;
        if (passes >= 2) break;
      }
      // Playout.
      const empties: number[] = [];
      for (let p = 0; p < pos.board.length; p++) if (pos.board[p] === 0) empties.push(p);
      let len = 0;
      while (passes < 2 && len < maxLen) {
        const p = pos.pick(toPlay, last, ctx.rng, empties);
        if (p === PASS) passes++;
        else {
          passes = 0;
          const captured = pos.play(p, toPlay);
          if (!seenColor[p]) seenColor[p] = toPlay;
          // Keep the empty list exact: drop the played point, re-add captured points.
          const at = empties.indexOf(p);
          if (at >= 0) {
            empties[at] = empties[empties.length - 1]!;
            empties.pop();
          }
          if (captured) {
            empties.length = 0;
            for (let q = 0; q < pos.board.length; q++) if (pos.board[q] === 0) empties.push(q);
          }
        }
        last = p;
        toPlay = 3 - toPlay;
        len++;
      }
      const { black, white } = areaScore(Array.from(pos.board), size);
      const winner = black > white + komi ? 1 : 2;
      // Backpropagation with AMAF.
      for (const nd of path) {
        nd.n++;
        if (nd.color === winner) nd.w++;
        if (nd.children)
          for (const ch of nd.children)
            if (ch.move !== PASS && seenColor[ch.move] === ch.color) {
              ch.amafN++;
              if (ch.color === winner) ch.amafW++;
            }
      }
      playouts++;
    }
    const children = root.children ?? [];
    let best = children[0];
    for (const ch of children) if (!best || ch.n > best.n) best = ch;
    const winRate = best && best.n ? best.w / best.n : 0;
    this.lastStats = { nodes: playouts, value: Math.round(winRate * 1000) / 1000 };
    // Resign-free behavior: pass when every move looks hopeless only if passing is not worse.
    if (!best || (winRate < 0.1 && lead() > 0)) return PASS;
    return best.move;
  }

  private expand(pos: Playout, color: number, rootLegal: Set<number> | null): Node[] {
    const out: Node[] = [];
    for (let p = 0; p < pos.board.length; p++) {
      if (rootLegal ? !rootLegal.has(p) : !pos.isLegal(p, color)) continue;
      if (pos.isEye(p, color)) continue;
      out.push({ move: p, color, n: 0, w: 0, amafN: 0, amafW: 0, children: null });
    }
    out.push({ move: PASS, color, n: 0, w: 0, amafN: 0, amafW: 0, children: null });
    return out;
  }

  private select(node: Node): Node {
    let best = node.children![0]!;
    let bestScore = -Infinity;
    const logN = Math.log(node.n + 1);
    for (const ch of node.children!) {
      let score: number;
      if (ch.n === 0 && ch.amafN === 0)
        // Unvisited: try them first, in a fixed pseudo-random order (keeps searches reproducible).
        score = ch.move === PASS ? 0.1 : 1 + ((ch.move * 2654435761) % 997) * 1e-6;
      else {
        const q = ch.n ? ch.w / ch.n : 0.5;
        const amaf = ch.amafN ? ch.amafW / ch.amafN : 0.5;
        const beta = Math.sqrt(RAVE_K / (3 * node.n + RAVE_K));
        score = (1 - beta) * q + beta * amaf + 0.25 * Math.sqrt(logN / (ch.n + 1));
        if (ch.move === PASS) score -= 0.2;
      }
      if (score > bestScore) {
        bestScore = score;
        best = ch;
      }
    }
    return best;
  }
}
