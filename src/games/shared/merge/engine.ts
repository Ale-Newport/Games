/**
 * The shared core of the sliding merge games (2048, Fibonacci 2048): a square board of numbered
 * tiles; a move slides every tile as far as it goes in one direction, merging pairs that the
 * variant allows (each tile once per move), and then a new tile appears on a random empty cell.
 * Randomness comes from a seeded generator stored in the state, so games replay exactly.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

export interface MergeRules {
  size: number;
  /** The merged value of two tiles, or null when they do not merge. */
  merge: (a: number, b: number) => number | null;
  /** Values that may appear, with weights. */
  spawns: [number, number][];
  /** The tile that wins the game. */
  goal: number;
}

export interface MergeState {
  board: number[];
  score: number;
  moves: number;
  rng: RngState;
  /** Highest tile ever made (for the goal and records). */
  best: number;
  won: boolean;
  over: boolean;
}

function random(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 4294967296, next];
}

export function spawn(s: MergeState, rules: MergeRules): MergeState {
  const empty = s.board.flatMap((v, c) => (v ? [] : [c]));
  if (!empty.length) return s;
  const [r1, rng1] = random(s.rng);
  const cell = empty[Math.floor(r1 * empty.length)]!;
  const [r2, rng] = random(rng1);
  const total = rules.spawns.reduce((n, [, w]) => n + w, 0);
  let pick = r2 * total;
  let value = rules.spawns[0]![0];
  for (const [v, w] of rules.spawns) {
    if (pick < w) {
      value = v;
      break;
    }
    pick -= w;
  }
  const board = [...s.board];
  board[cell] = value;
  return { ...s, board, rng, best: Math.max(s.best, value) };
}

export function newGame(rules: MergeRules, seed: number): MergeState {
  let s: MergeState = {
    board: new Array<number>(rules.size * rules.size).fill(0),
    score: 0,
    moves: 0,
    rng: seedRng(seed >>> 0),
    best: 0,
    won: false,
    over: false,
  };
  s = spawn(s, rules);
  return spawn(s, rules);
}

/** The cells of each line in the direction of travel (first cell = where tiles pile up). */
export function lines(size: number, d: Dir): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < size; i++) {
    const line: number[] = [];
    for (let j = 0; j < size; j++) {
      const r = d === 'up' ? j : d === 'down' ? size - 1 - j : i;
      const c = d === 'left' ? j : d === 'right' ? size - 1 - j : i;
      line.push(r * size + c);
    }
    out.push(line);
  }
  return out;
}

/** Slides the board without spawning: new board, points gained, and whether anything moved. */
export function slide(board: readonly number[], rules: MergeRules, d: Dir) {
  const out = new Array<number>(board.length).fill(0);
  let gained = 0;
  for (const line of lines(rules.size, d)) {
    const tiles = line.map((c) => board[c]!).filter(Boolean);
    const merged: number[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const m = i + 1 < tiles.length ? rules.merge(tiles[i]!, tiles[i + 1]!) : null;
      if (m !== null) {
        merged.push(m);
        gained += m;
        i++;
      } else merged.push(tiles[i]!);
    }
    merged.forEach((v, k) => (out[line[k]!] = v));
  }
  const moved = out.some((v, c) => v !== board[c]);
  return { board: out, gained, moved };
}

export const canMove = (board: readonly number[], rules: MergeRules) =>
  DIRS.some((d) => slide(board, rules, d).moved);

export function move(s: MergeState, rules: MergeRules, d: Dir): MergeState {
  if (s.over) return s;
  const r = slide(s.board, rules, d);
  if (!r.moved) return s;
  const best = Math.max(s.best, ...r.board);
  let next: MergeState = {
    ...s,
    board: r.board,
    score: s.score + r.gained,
    moves: s.moves + 1,
    best,
    won: s.won || best >= rules.goal,
  };
  next = spawn(next, rules);
  return { ...next, over: !canMove(next.board, rules) };
}

/**
 * Board evaluation for the search: empty cells, monotonic rows and columns, smooth neighbours, and
 * the largest tile in a corner.
 */
export function evaluate(board: readonly number[], size: number): number {
  const log = (v: number) => (v ? Math.log2(v) : 0);
  let empty = 0;
  let smooth = 0;
  let mono = 0;
  for (let i = 0; i < size; i++) {
    let incR = 0;
    let decR = 0;
    let incC = 0;
    let decC = 0;
    for (let j = 0; j < size; j++) {
      const v = board[i * size + j]!;
      if (!v) empty++;
      if (j + 1 < size) {
        const a = log(board[i * size + j]!);
        const b = log(board[i * size + j + 1]!);
        if (a > b) decR += a - b;
        else incR += b - a;
        if (a && b) smooth -= Math.abs(a - b);
        const c = log(board[j * size + i]!);
        const e = log(board[(j + 1) * size + i]!);
        if (c > e) decC += c - e;
        else incC += e - c;
        if (c && e) smooth -= Math.abs(c - e);
      }
    }
    mono -= Math.min(incR, decR) + Math.min(incC, decC);
  }
  const max = Math.max(...board);
  const corners = [0, size - 1, size * (size - 1), size * size - 1];
  const corner = corners.some((c) => board[c] === max) ? log(max) : 0;
  return empty * 2.7 + mono * 1.0 + smooth * 0.1 + corner * 1.0;
}

/**
 * Expectimax: the move with the best expected evaluation, `depth` player moves deep, averaging over
 * where (and which) tile appears; chance nodes sample at most `samples` empty cells.
 */
export function bestMove(
  board: readonly number[],
  rules: MergeRules,
  depth = 2,
  samples = 6,
): Dir | null {
  const size = rules.size;
  const total = rules.spawns.reduce((n, [, w]) => n + w, 0);
  const chance = (b: readonly number[], d: number): number => {
    const empty = b.flatMap((v, c) => (v ? [] : [c]));
    if (!empty.length) return evaluate(b, size);
    const step = Math.max(1, Math.floor(empty.length / samples));
    let sum = 0;
    let n = 0;
    for (let k = 0; k < empty.length; k += step) {
      for (const [v, w] of rules.spawns) {
        const nb = [...b];
        nb[empty[k]!] = v;
        sum += (w / total) * player(nb, d);
      }
      n++;
    }
    return sum / n;
  };
  const player = (b: readonly number[], d: number): number => {
    if (d === 0) return evaluate(b, size);
    let best = -Infinity;
    for (const dir of DIRS) {
      const r = slide(b, rules, dir);
      if (!r.moved) continue;
      best = Math.max(best, chance(r.board, d - 1) + r.gained * 0.01);
    }
    return best === -Infinity ? -1000 : best;
  };
  let choice: Dir | null = null;
  let value = -Infinity;
  for (const dir of DIRS) {
    const r = slide(board, rules, dir);
    if (!r.moved) continue;
    const v = chance(r.board, depth - 1) + r.gained * 0.01;
    if (v > value) {
      value = v;
      choice = dir;
    }
  }
  return choice;
}
