/** Merge game state per variant: levels (board sizes), moves with one-step undo, and save validation by replay. */
import { DIRS, move, newGame, type Dir, type MergeRules, type MergeState } from './engine';

export interface MergeGameState extends MergeState {
  level: string;
  seed: number;
  /** Directions played, for validation by replay. */
  history: Dir[];
  undos: number;
  hints: number;
  /** The previous position, for a single undo. */
  previous: MergeState | null;
  /** The player chose to keep going after reaching the goal. */
  continued: boolean;
}

export function newMerge(
  levels: Record<string, MergeRules>,
  level: string,
  seed: number,
): MergeGameState {
  const lv = levels[level] ? level : Object.keys(levels)[0]!;
  return {
    ...newGame(levels[lv]!, seed),
    level: lv,
    seed: seed >>> 0,
    history: [],
    undos: 0,
    hints: 0,
    previous: null,
    continued: false,
  };
}

const core = (s: MergeGameState): MergeState => ({
  board: s.board,
  score: s.score,
  moves: s.moves,
  rng: s.rng,
  best: s.best,
  won: s.won,
  over: s.over,
});

export function play(
  s: MergeGameState,
  levels: Record<string, MergeRules>,
  d: Dir,
  options: { hint?: boolean } = {},
): MergeGameState {
  const next = move(core(s), levels[s.level]!, d);
  if (next === core(s) || next.moves === s.moves) return s;
  return {
    ...s,
    ...next,
    history: [...s.history, d],
    hints: s.hints + (options.hint ? 1 : 0),
    previous: core(s),
  };
}

export function undo(s: MergeGameState): MergeGameState {
  if (!s.previous) return s;
  return {
    ...s,
    ...s.previous,
    history: s.history.slice(0, -1),
    undos: s.undos + 1,
    previous: null,
  };
}

export function isValidMergeState(
  d: unknown,
  levels: Record<string, MergeRules>,
): d is MergeGameState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as MergeGameState;
  const rules = levels[s.level];
  if (!rules || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  for (const k of ['undos', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (typeof s.continued !== 'boolean' || !Array.isArray(s.history)) return false;
  if (!s.history.every((x) => (DIRS as string[]).includes(x))) return false;
  let g: MergeState = newGame(rules, s.seed);
  let prev: MergeState | null = null;
  for (const dir of s.history) {
    const next = move(g, rules, dir);
    if (next.moves === g.moves) return false;
    prev = g;
    g = next;
  }
  const same = (a: MergeState | null, b: MergeState | null) =>
    JSON.stringify(a) === JSON.stringify(b);
  // `previous` is either the position before the last move or null (after an undo).
  return same(core(s), g) && (s.previous === null || same(s.previous, prev));
}
