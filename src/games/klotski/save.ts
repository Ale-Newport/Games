/**
 * The Sliding Blocks save slot: the puzzle in progress (if any), whether it is today's puzzle, and
 * the fewest moves per solved bank puzzle, keyed "level:index". Schema 1 kept only the puzzle in
 * progress; it migrates to schema 2 with no solved puzzles.
 */
import { LEVELS, isValidKlotskiState, type KlotskiState, type Level } from './engine';
import { PUZZLES } from './puzzles';

export interface KlotskiSave {
  state: KlotskiState | null;
  daily: boolean;
  /** Fewest moves per solved puzzle (hints or not), keyed "level:index". */
  best: Record<string, number>;
}

export const puzzleKey = (level: Level, index: number) => `${level}:${index}`;

const isPuzzleKey = (k: string) => {
  const [level, index] = k.split(':');
  const i = Number(index);
  return (
    (LEVELS as readonly string[]).includes(level ?? '') &&
    Number.isInteger(i) &&
    i >= 0 &&
    i < PUZZLES[level as Level].length
  );
};

export function isKlotskiSave(d: unknown): d is KlotskiSave {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as KlotskiSave;
  if (typeof s.daily !== 'boolean') return false;
  if (typeof s.best !== 'object' || s.best === null || Array.isArray(s.best)) return false;
  if (!Object.entries(s.best).every(([k, v]) => isPuzzleKey(k) && Number.isInteger(v) && v > 0))
    return false;
  return s.state === null || isValidKlotskiState(s.state);
}

export const KLOTSKI_SAVE = {
  schema: 2,
  migrations: {
    1: (d: unknown) => (typeof d === 'object' && d !== null ? { ...d, best: {} } : d),
  },
  validate: isKlotskiSave,
};

/** The record after solving `level:index` in `moves` (keeps the fewer). */
export function withBest(best: Record<string, number>, level: Level, index: number, moves: number) {
  const k = puzzleKey(level, index);
  return { ...best, [k]: Math.min(best[k] ?? Infinity, moves) };
}
