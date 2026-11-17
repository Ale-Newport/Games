/**
 * The Traffic Jam save slot: the puzzle in progress (if any), whether it is today's puzzle, and the
 * fewest moves per solved bank puzzle, keyed "level:index". Schema 1 kept only the puzzle in
 * progress, identified by the seed that picked it; schema 2 states name the puzzle's bank index
 * instead (the seed picks the same index, since the old levels' banks are unchanged).
 */
import { LEVELS, indexForSeed, isValidJamState, puzzleCount, type JamState } from './engine';

export interface JamSave {
  state: JamState | null;
  daily: boolean;
  /** Fewest moves per solved puzzle (hints or not), keyed "level:index". */
  best: Record<string, number>;
}

export const puzzleKey = (level: string, index: number) => `${level}:${index}`;

const isPuzzleKey = (k: string) => {
  const [level, index] = k.split(':');
  const i = Number(index);
  return (
    (LEVELS as readonly string[]).includes(level ?? '') &&
    Number.isInteger(i) &&
    i >= 0 &&
    i < puzzleCount(level!)
  );
};

export function isJamSave(d: unknown): d is JamSave {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as JamSave;
  if (typeof s.daily !== 'boolean') return false;
  if (typeof s.best !== 'object' || s.best === null || Array.isArray(s.best)) return false;
  if (!Object.entries(s.best).every(([k, v]) => isPuzzleKey(k) && Number.isInteger(v) && v > 0))
    return false;
  return s.state === null || isValidJamState(s.state);
}

/** Schema 1 → 2: the state's seed becomes the bank index it picked; no solved puzzles yet. */
function fromSchema1(d: unknown): unknown {
  if (typeof d !== 'object' || d === null) return d;
  const old = d as { state?: unknown; daily?: unknown };
  const st = old.state as { level?: unknown; seed?: unknown } | null | undefined;
  if (typeof st !== 'object' || st === null) return { ...old, state: null, best: {} };
  const { seed, ...rest } = st;
  const index =
    typeof st.level === 'string' && typeof seed === 'number' ? indexForSeed(st.level, seed) : -1;
  return { ...old, state: { ...rest, index }, best: {} };
}

export const JAM_SAVE = {
  schema: 2,
  migrations: { 1: fromSchema1 },
  validate: isJamSave,
};

/** The record after solving `level:index` in `moves` (keeps the fewer). */
export function withBest(
  best: Record<string, number>,
  level: string,
  index: number,
  moves: number,
) {
  const k = puzzleKey(level, index);
  return { ...best, [k]: Math.min(best[k] ?? Infinity, moves) };
}
