/**
 * Number Trios: a sliding number puzzle in the threes style. A move shifts tiles one cell in a
 * direction; a 1 and a 2 merge into a 3, and two equal tiles of 3 or more merge into their double.
 * In each line only the first tile that can move (into an empty cell or a merge) moves, and every
 * tile behind it follows. The next tile, shown in advance, then enters at the back edge of one of
 * the lines that moved. Tiles come from a shuffled deck of four 1s, four 2s and four 3s, with an
 * occasional bonus tile once the board holds a 48. Randomness comes from a generator stored in the
 * state, so games replay exactly.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

export interface TriosRules {
  size: number;
  /** The tile that wins the game. */
  goal: number;
}

export interface TriosState {
  board: number[];
  /** The tile that enters on the next move. */
  next: number;
  /** What is left of the shuffled deck. */
  deck: number[];
  rng: RngState;
  moves: number;
  best: number;
  won: boolean;
  over: boolean;
}

export const DECK = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
/** Chance of a bonus tile once the board holds a 48. */
export const BONUS_CHANCE = 1 / 21;

export const canMerge = (a: number, b: number) => (a + b === 3 ? a * b === 2 : a === b && a >= 3);

/** Points of a tile at the end: 3 for a 3, then three times as much for every doubling. */
export function tilePoints(v: number): number {
  if (v < 3) return 0;
  return 3 ** (Math.round(Math.log2(v / 3)) + 1);
}

export const score = (board: readonly number[]) => board.reduce((n, v) => n + tilePoints(v), 0);

function random(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 4294967296, next];
}

/** Draws the next tile: a bonus now and then, otherwise the top of the deck (reshuffled when empty). */
export function draw(
  deck: readonly number[],
  best: number,
  rng: RngState,
): [number, number[], RngState] {
  let r: number;
  [r, rng] = random(rng);
  if (best >= 48 && r < BONUS_CHANCE) {
    // Bonus values run from 6 up to an eighth of the best tile.
    const options: number[] = [];
    for (let v = 6; v <= best / 8; v *= 2) options.push(v);
    let k: number;
    [k, rng] = random(rng);
    return [options[Math.floor(k * options.length)]!, [...deck], rng];
  }
  let pile = [...deck];
  if (!pile.length) {
    pile = [...DECK];
    for (let i = pile.length - 1; i > 0; i--) {
      let k: number;
      [k, rng] = random(rng);
      const j = Math.floor(k * (i + 1));
      [pile[i], pile[j]] = [pile[j]!, pile[i]!];
    }
  }
  const v = pile.pop()!;
  return [v, pile, rng];
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

/** Shifts the board one step without a new tile: new board and the indices of the lines that moved. */
export function shift(board: readonly number[], size: number, d: Dir) {
  const out = [...board];
  const moved: number[] = [];
  lines(size, d).forEach((line, li) => {
    for (let k = 1; k < size; k++) {
      const v = out[line[k]!]!;
      const ahead = out[line[k - 1]!]!;
      if (!v || (ahead && !canMerge(ahead, v))) continue;
      out[line[k - 1]!] = ahead + v;
      for (let j = k; j + 1 < size; j++) out[line[j]!] = out[line[j + 1]!]!;
      out[line[size - 1]!] = 0;
      moved.push(li);
      return;
    }
  });
  return { board: out, moved };
}

export const canMove = (board: readonly number[], size: number) =>
  DIRS.some((d) => shift(board, size, d).moved.length > 0);

export function newGame(rules: TriosRules, seed: number): TriosState {
  const n = rules.size * rules.size;
  let rng = seedRng(seed >>> 0);
  let deck: number[] = [];
  const board = new Array<number>(n).fill(0);
  // A 4×4 board starts with nine tiles; other sizes keep the same share.
  const start = Math.round((9 / 16) * n);
  const cells = [...board.keys()];
  for (let i = 0; i < start; i++) {
    let r: number;
    [r, rng] = random(rng);
    const cell = cells.splice(Math.floor(r * cells.length), 1)[0]!;
    let v: number;
    [v, deck, rng] = draw(deck, 0, rng);
    board[cell] = v;
  }
  const [next, rest, after] = draw(deck, 0, rng);
  return {
    board,
    next,
    deck: rest,
    rng: after,
    moves: 0,
    best: Math.max(...board),
    won: false,
    over: false,
  };
}

export function move(s: TriosState, rules: TriosRules, d: Dir): TriosState {
  if (s.over) return s;
  const r = shift(s.board, rules.size, d);
  if (!r.moved.length) return s;
  const [pick, rng] = random(s.rng);
  const line = lines(rules.size, d)[r.moved[Math.floor(pick * r.moved.length)]!]!;
  const board = r.board;
  board[line[rules.size - 1]!] = s.next;
  const best = Math.max(s.best, ...board);
  const [next, deck, rng2] = draw(s.deck, best, rng);
  return {
    board,
    next,
    deck,
    rng: rng2,
    moves: s.moves + 1,
    best,
    won: s.won || best >= rules.goal,
    over: !canMove(board, rules.size),
  };
}

/**
 * Board evaluation for the search: empty cells, pairs ready to merge, monotonic rows and columns
 * (in doublings), and a penalty for 1s and 2s that have no partner next to them.
 */
export function evaluate(board: readonly number[], size: number): number {
  const rank = (v: number) => (v >= 3 ? Math.log2(v / 3) + 1 : 0);
  let empty = 0;
  let pairs = 0;
  let mono = 0;
  let lonely = 0;
  for (let i = 0; i < size; i++) {
    let incR = 0;
    let decR = 0;
    let incC = 0;
    let decC = 0;
    for (let j = 0; j < size; j++) {
      const v = board[i * size + j]!;
      if (!v) empty++;
      if (j + 1 < size) {
        const right = board[i * size + j + 1]!;
        const below = board[(j + 1) * size + i]!;
        const col = board[j * size + i]!;
        if (v && right && canMerge(v, right)) pairs++;
        if (col && below && canMerge(col, below)) pairs++;
        const a = rank(v);
        const b = rank(right);
        if (a > b) decR += a - b;
        else incR += b - a;
        const c = rank(col);
        const e = rank(below);
        if (c > e) decC += c - e;
        else incC += e - c;
      }
    }
    mono -= Math.min(incR, decR) + Math.min(incC, decC);
  }
  for (let c = 0; c < board.length; c++) {
    const v = board[c]!;
    if (v !== 1 && v !== 2) continue;
    const r = Math.floor(c / size);
    const k = c % size;
    const near = [
      r > 0 ? board[c - size]! : -1,
      r + 1 < size ? board[c + size]! : -1,
      k > 0 ? board[c - 1]! : -1,
      k + 1 < size ? board[c + 1]! : -1,
    ];
    if (!near.some((x) => x === 0 || x === 3 - v)) lonely++;
  }
  return empty * 3 + pairs * 1.5 + mono * 1.0 - lonely * 2 + Math.log2(Math.max(3, ...board));
}

/**
 * Expectimax: the move with the best expected evaluation, `depth` moves deep. The first new tile is
 * known (it is shown); where it enters is averaged over the lines that moved, and deeper tiles are
 * averaged over 1, 2 and 3.
 */
export function bestMove(
  board: readonly number[],
  next: number,
  rules: TriosRules,
  depth = 2,
): Dir | null {
  const size = rules.size;
  const chance = (
    b: readonly number[],
    d: Dir,
    moved: number[],
    tiles: number[],
    left: number,
  ): number => {
    const ls = lines(size, d);
    let sum = 0;
    for (const li of moved) {
      const cell = ls[li]![size - 1]!;
      for (const t of tiles) {
        const nb = [...b];
        nb[cell] = t;
        sum += player(nb, left);
      }
    }
    return sum / (moved.length * tiles.length);
  };
  const player = (b: readonly number[], left: number): number => {
    if (left === 0) return evaluate(b, size);
    let best = -Infinity;
    for (const d of DIRS) {
      const r = shift(b, size, d);
      if (r.moved.length) best = Math.max(best, chance(r.board, d, r.moved, [1, 2, 3], left - 1));
    }
    return best === -Infinity ? -1000 : best;
  };
  let choice: Dir | null = null;
  let value = -Infinity;
  for (const d of DIRS) {
    const r = shift(board, size, d);
    if (!r.moved.length) continue;
    const v = chance(r.board, d, r.moved, [next], depth - 1);
    if (v > value) {
      value = v;
      choice = d;
    }
  }
  return choice;
}
