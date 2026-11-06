/**
 * Isolation on a 7×7 board of tiles: each player has one pawn. A turn has two steps: move your
 * pawn one cell in any of the eight directions onto a free tile (not removed, not occupied), then
 * remove any free tile from the board (the one you just left included). A player who cannot move
 * at the start of their turn loses. Tiles only disappear, so the game always ends; there are no
 * draws.
 *
 * Actions: "m24" (move the pawn to cell 24) then "x10" (remove the tile at cell 10). Cells are
 * row·7 + col, a7 top-left. Gold (seat 0) starts on d1, Jade (seat 1) on d7.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const N = 7;

export interface IsolationState {
  /** 1 = tile present, 0 = removed. */
  tiles: number[];
  pawns: [number, number];
  toMove: 0 | 1;
  phase: 'move' | 'remove';
  history: string[];
  result: { winner: 0 | 1 } | null;
}

/** King-move neighbors of every cell. */
export const NEIGHBORS: readonly number[][] = Array.from({ length: N * N }, (_, p) => {
  const r = Math.floor(p / N);
  const c = p % N;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if ((dr || dc) && rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
    }
  return out;
});

export function createIsolationState(): IsolationState {
  return {
    tiles: new Array<number>(N * N).fill(1),
    pawns: [N * (N - 1) + 3, 3],
    toMove: 0,
    phase: 'move',
    history: [],
    result: null,
  };
}

const free = (tiles: readonly number[], pawns: readonly number[], p: number) =>
  tiles[p] === 1 && pawns[0] !== p && pawns[1] !== p;

/** Cells the pawn of `seat` can step to. */
export function stepsOf(s: Pick<IsolationState, 'tiles' | 'pawns'>, seat: 0 | 1): number[] {
  return NEIGHBORS[s.pawns[seat]]!.filter((q) => free(s.tiles, s.pawns, q));
}

export function legalIsolationActions(s: IsolationState): string[] {
  if (s.result) return [];
  if (s.phase === 'move') return stepsOf(s, s.toMove).map((q) => `m${q}`);
  const out: string[] = [];
  for (let p = 0; p < N * N; p++) if (free(s.tiles, s.pawns, p)) out.push(`x${p}`);
  return out;
}

export function applyIsolationAction(s: IsolationState, a: string): IsolationState {
  if (s.result || !legalIsolationActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const cell = Number(a.slice(1));
  const history = [...s.history, a];
  if (s.phase === 'move') {
    const pawns: [number, number] = [...s.pawns];
    pawns[s.toMove] = cell;
    return { ...s, pawns, phase: 'remove', history };
  }
  const tiles = s.tiles.slice();
  tiles[cell] = 0;
  const toMove = (1 - s.toMove) as 0 | 1;
  const next: IsolationState = {
    tiles,
    pawns: s.pawns,
    toMove,
    phase: 'move',
    history,
    result: null,
  };
  // The opponent is stuck before their turn starts: the mover wins.
  if (stepsOf(next, toMove).length === 0) next.result = { winner: s.toMove };
  return next;
}

/** Seat that made action `ply` (two actions per turn). */
export const moverOfPly = (ply: number) => (Math.floor(ply / 2) % 2) as 0 | 1;

export function replayIsolation(history: readonly string[]): IsolationState {
  return history.reduce((s, a) => applyIsolationAction(s, a), createIsolationState());
}

export function isValidIsolationState(data: unknown): data is IsolationState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayIsolation(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
