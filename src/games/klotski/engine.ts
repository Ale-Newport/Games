/**
 * Sliding Blocks state: a puzzle from the bank, block moves (a move is one block taken any
 * distance along free cells; moving the same block again right away is still the same move),
 * undo, hints from a breadth-first search to the exit, and save validation by replay.
 */
import {
  blocksOf,
  isSolvedKey,
  keyOf,
  movesFrom,
  parse,
  reach,
  moveBlock,
  type Block,
} from './board';
import { PUZZLES } from './puzzles';

export * from './board';

export const LEVELS = ['easy', 'medium', 'hard', 'classic'] as const;
export type Level = (typeof LEVELS)[number];

export interface KlotskiState {
  level: Level;
  /** Index into the level's bank. */
  index: number;
  board: string[];
  /** Block relocations: [from top-left, to top-left]. */
  steps: [number, number][];
  /** Moves so far (consecutive relocations of one block count once). */
  moves: number;
  hints: number;
  undos: number;
  solved: boolean;
}

export function puzzleOf(level: Level, index: number): { key: string; best: number } {
  const bank = PUZZLES[level];
  const [key, best] = bank[((index % bank.length) + bank.length) % bank.length]!.split(':');
  return { key: key!, best: Number(best) };
}

export function newKlotski(level: Level, index: number): KlotskiState {
  const bank = PUZZLES[level];
  const i = ((index % bank.length) + bank.length) % bank.length;
  return {
    level,
    index: i,
    board: parse(puzzleOf(level, i).key),
    steps: [],
    moves: 0,
    hints: 0,
    undos: 0,
    solved: false,
  };
}

export const blockAt = (board: readonly string[], cell: number): Block | null => {
  for (const b of blocksOf(board)) {
    for (let dy = 0; dy < b.h; dy++)
      for (let dx = 0; dx < b.w; dx++) if (b.at + dy * 4 + dx === cell) return b;
  }
  return null;
};

/** Counts moves along a list of relocations: a relocation continues the move when it starts where the last one ended. */
export const countMoves = (steps: readonly [number, number][]) =>
  steps.reduce((n, [from], i) => (i > 0 && steps[i - 1]![1] === from ? n : n + 1), 0);

/** Moves the block whose top-left is `from` to `to` (any free path). Unchanged when illegal. */
export function relocate(
  s: KlotskiState,
  from: number,
  to: number,
  options: { hint?: boolean } = {},
): KlotskiState {
  if (s.solved || from === to) return s;
  const b = blocksOf(s.board).find((x) => x.at === from);
  if (!b || !reach(s.board, b).includes(to)) return s;
  const board = moveBlock(s.board, b, to);
  const steps: [number, number][] = [...s.steps, [from, to]];
  return {
    ...s,
    board,
    steps,
    moves: countMoves(steps),
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolvedKey(keyOf(board)),
  };
}

/** Takes back the last relocation. */
export function undo(s: KlotskiState): KlotskiState {
  const last = s.steps[s.steps.length - 1];
  if (!last || s.solved) return s;
  const b = blocksOf(s.board).find((x) => x.at === last[1])!;
  const steps = s.steps.slice(0, -1);
  return {
    ...s,
    board: moveBlock(s.board, b, last[0]),
    steps,
    moves: countMoves(steps),
    undos: s.undos + 1,
  };
}

/**
 * The fewest moves to the exit from here, as a list of relocations, by breadth-first search over
 * positions (identical blocks are interchangeable). Null if the exit cannot be reached.
 */
export function solve(board: readonly string[]): [number, number][] | null {
  const start = keyOf(board);
  if (isSolvedKey(start)) return [];
  const parent = new Map<string, { prev: string; from: number; to: number } | null>([
    [start, null],
  ]);
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q]!;
    for (const m of movesFrom(parse(k))) {
      const nk = keyOf(m.board);
      if (parent.has(nk)) continue;
      parent.set(nk, { prev: k, from: m.block.at, to: m.to });
      if (isSolvedKey(nk)) {
        const path: [number, number][] = [];
        for (let at = nk; parent.get(at); at = parent.get(at)!.prev) {
          const p = parent.get(at)!;
          path.unshift([p.from, p.to]);
        }
        return path;
      }
      queue.push(nk);
    }
  }
  return null;
}

export function isValidKlotskiState(d: unknown): d is KlotskiState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as KlotskiState;
  if (!(LEVELS as readonly string[]).includes(s.level)) return false;
  if (!Number.isInteger(s.index) || s.index < 0 || s.index >= PUZZLES[s.level].length) return false;
  for (const k of ['hints', 'undos'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (!Array.isArray(s.steps) || typeof s.solved !== 'boolean') return false;
  let g = newKlotski(s.level, s.index);
  for (const st of s.steps) {
    if (!Array.isArray(st) || st.length !== 2 || g.solved) return false;
    const next = relocate(g, st[0], st[1]);
    if (next === g) return false;
    g = next;
  }
  return keyOf(g.board) === keyOf(s.board) && g.moves === s.moves && g.solved === s.solved;
}
