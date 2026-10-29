/** Number Trios game state per level: moves with one-step undo, hints, and save validation by replay. */
import { DIRS, move, newGame, score, type Dir, type TriosRules, type TriosState } from './engine';

export interface TriosGameState extends TriosState {
  level: string;
  seed: number;
  /** Directions played, for validation by replay. */
  history: Dir[];
  undos: number;
  hints: number;
  /** The previous position, for a single undo. */
  previous: TriosState | null;
  /** The player chose to keep going after reaching the goal. */
  continued: boolean;
}

export const LEVELS: Record<string, TriosRules> = {
  classic: { size: 4, goal: 384 },
  small: { size: 3, goal: 48 },
  big: { size: 5, goal: 1536 },
};

export function newTrios(level: string, seed: number): TriosGameState {
  const lv = LEVELS[level] ? level : 'classic';
  return {
    ...newGame(LEVELS[lv]!, seed),
    level: lv,
    seed: seed >>> 0,
    history: [],
    undos: 0,
    hints: 0,
    previous: null,
    continued: false,
  };
}

const core = (s: TriosState): TriosState => ({
  board: s.board,
  next: s.next,
  deck: s.deck,
  rng: s.rng,
  moves: s.moves,
  best: s.best,
  won: s.won,
  over: s.over,
});

export const triosScore = (s: TriosState) => score(s.board);

export function play(s: TriosGameState, d: Dir, options: { hint?: boolean } = {}): TriosGameState {
  const next = move(core(s), LEVELS[s.level]!, d);
  if (next.moves === s.moves) return s;
  return {
    ...s,
    ...next,
    history: [...s.history, d],
    hints: s.hints + (options.hint ? 1 : 0),
    previous: core(s),
  };
}

export function undo(s: TriosGameState): TriosGameState {
  if (!s.previous) return s;
  return {
    ...s,
    ...s.previous,
    history: s.history.slice(0, -1),
    undos: s.undos + 1,
    previous: null,
  };
}

export function isValidTriosState(d: unknown): d is TriosGameState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as TriosGameState;
  const rules = LEVELS[s.level];
  if (!rules || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  for (const k of ['undos', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (typeof s.continued !== 'boolean' || !Array.isArray(s.history)) return false;
  if (!s.history.every((x) => (DIRS as string[]).includes(x))) return false;
  let g: TriosState = newGame(rules, s.seed);
  let prev: TriosState | null = null;
  for (const dir of s.history) {
    const next = move(g, rules, dir);
    if (next.moves === g.moves) return false;
    prev = g;
    g = next;
  }
  const same = (a: TriosState | null, b: TriosState | null) =>
    JSON.stringify(a) === JSON.stringify(b);
  // `previous` is either the position before the last move or null (after an undo).
  return same(core(s), g) && (s.previous === null || same(s.previous, prev));
}
