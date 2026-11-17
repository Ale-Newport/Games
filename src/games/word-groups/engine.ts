/**
 * Pure rules for #208 Word Groups (ruleset `word-groups-4x4`): sixteen words hide four groups of
 * four. Select four and submit; a correct group is revealed in its colour, a wrong one costs one of
 * four mistakes, and "one away" says when three of the four belong together.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { PUZZLES, type Puzzle } from './puzzles';

export const MAX_MISTAKES = 4;
export const EPOCH = Date.UTC(2026, 0, 1);

export type Feedback = 'solved' | 'one-away' | 'wrong' | 'repeat' | 'invalid';

export interface GroupsState {
  puzzleId: string;
  /** Unsolved words in display order. */
  board: string[];
  selected: string[];
  /** Group indices (0 yellow … 3 purple) in the order they were found. */
  solved: number[];
  mistakes: number;
  /** Every submitted set (for repeats and the share grid). */
  history: string[][];
  rng: RngState;
  status: 'playing' | 'won' | 'lost';
}

const BY_ID = new Map(PUZZLES.map((p) => [p.id, p]));
export const puzzleById = (id: string): Puzzle => {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown puzzle ${id}`);
  return p;
};
export const puzzlesFor = (lang: 'en' | 'es') => PUZZLES.filter((p) => p.lang === lang);

export function gameNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}

/** Today's puzzle per language: the puzzles of that language in a fixed shuffled order. */
export function dailyPuzzle(lang: 'en' | 'es', gameNo: number): Puzzle {
  const list = new Rng(lang === 'en' ? 808 : 909).shuffle(puzzlesFor(lang));
  return list[((gameNo % list.length) + list.length) % list.length]!;
}

export function groupOf(p: Puzzle, word: string): number {
  return p.groups.findIndex((g) => g.words.includes(word as never));
}

export function newGame(p: Puzzle, seed: number): GroupsState {
  const rng = new Rng(seed >>> 0);
  const board = rng.shuffle(p.groups.flatMap((g) => g.words));
  return {
    puzzleId: p.id,
    board,
    selected: [],
    solved: [],
    mistakes: 0,
    history: [],
    rng: rng.state,
    status: 'playing',
  };
}

export function toggle(s: GroupsState, word: string): GroupsState {
  if (s.status !== 'playing' || !s.board.includes(word)) return s;
  if (s.selected.includes(word)) return { ...s, selected: s.selected.filter((w) => w !== word) };
  if (s.selected.length >= 4) return s;
  return { ...s, selected: [...s.selected, word] };
}

export const deselectAll = (s: GroupsState): GroupsState => ({ ...s, selected: [] });

export function shuffle(s: GroupsState): GroupsState {
  const rng = Rng.from(s.rng);
  return { ...s, board: rng.shuffle(s.board), rng: rng.state };
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((w) => b.includes(w));

/** Submits the four selected words. */
export function submit(s: GroupsState): { state: GroupsState; feedback: Feedback } {
  if (s.status !== 'playing' || s.selected.length !== 4) return { state: s, feedback: 'invalid' };
  if (s.history.some((h) => sameSet(h, s.selected))) return { state: s, feedback: 'repeat' };
  const p = puzzleById(s.puzzleId);
  const history = [...s.history, [...s.selected]];
  const counts = [0, 0, 0, 0];
  for (const w of s.selected) counts[groupOf(p, w)]!++;
  const hit = counts.indexOf(4);
  if (hit >= 0) {
    const solved = [...s.solved, hit];
    const board = s.board.filter((w) => !s.selected.includes(w));
    return {
      state: {
        ...s,
        board,
        selected: [],
        solved,
        history,
        status: solved.length === 4 ? 'won' : 'playing',
      },
      feedback: 'solved',
    };
  }
  const mistakes = s.mistakes + 1;
  const lost = mistakes >= MAX_MISTAKES;
  return {
    state: {
      ...s,
      mistakes,
      history,
      selected: lost ? [] : s.selected,
      status: lost ? 'lost' : 'playing',
    },
    feedback: counts.includes(3) ? 'one-away' : 'wrong',
  };
}

/** Groups to show at the end: solved ones first, then the rest in difficulty order. */
export function revealOrder(s: GroupsState): number[] {
  return [...s.solved, ...[0, 1, 2, 3].filter((g) => !s.solved.includes(g))];
}

const SQUARES = ['🟨', '🟩', '🟦', '🟪'];

/** One row of coloured squares per guess, as in the original share grid. */
export function shareGrid(s: GroupsState): string {
  const p = puzzleById(s.puzzleId);
  return s.history.map((h) => h.map((w) => SQUARES[groupOf(p, w)]).join('')).join('\n');
}

export function isValidState(v: unknown): v is GroupsState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as GroupsState;
  return (
    typeof s.puzzleId === 'string' &&
    BY_ID.has(s.puzzleId) &&
    Array.isArray(s.board) &&
    Array.isArray(s.selected) &&
    Array.isArray(s.solved) &&
    typeof s.mistakes === 'number' &&
    Array.isArray(s.history) &&
    Array.isArray(s.rng) &&
    ['playing', 'won', 'lost'].includes(s.status)
  );
}
