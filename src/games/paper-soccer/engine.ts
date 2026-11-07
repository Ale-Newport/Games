/**
 * Paper Soccer on a field of 8 × 10 squares (9 × 11 grid points) with goals two squares wide in
 * the middle of each end line. The ball starts on the center point. A move draws a line from the
 * ball to one of the eight neighboring points, never along a line already drawn and never along the
 * field's border (side lines, end lines outside the goal mouth, the sides and back of each goal).
 *
 * If the ball lands on a point that already had a line through it, or on the border, it bounces and
 * the same player moves again. Reaching a point of the goal behind an end line scores for the
 * attacker of that goal — own goals count. A player who must move but cannot loses.
 *
 * Orange (seat 0) attacks the top goal and moves first; Teal attacks the bottom one. Points:
 * index = (y + 1)·9 + x with y from −1 (top goal) to 11 (bottom goal). Actions: a direction 0–7
 * (N, NE, E, SE, S, SW, W, NW).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const W = 8;
export const H = 10;
const COLS = W + 1;
const ROWS = H + 3;
export const POINTS = COLS * ROWS;
const MOUTH_L = W / 2 - 1;
const MOUTH_R = W / 2 + 1;

export const DX = [0, 1, 1, 1, 0, -1, -1, -1] as const;
export const DY = [-1, -1, 0, 1, 1, 1, 0, -1] as const;

export const pointAt = (x: number, y: number) => (y + 1) * COLS + x;
export const pointX = (p: number) => p % COLS;
export const pointY = (p: number) => Math.floor(p / COLS) - 1;
export const CENTER = pointAt(W / 2, H / 2);

export interface PaperSoccerState {
  ball: number;
  toMove: 0 | 1;
  /** edges[p·8 + d] = 1 when the line from point p in direction d is drawn (stored both ways). */
  edges: number[];
  /** Who drew each line, in order: [from, to, seat]. */
  lines: [number, number, 0 | 1][];
  history: string[];
  movers: (0 | 1)[];
  result: { winner: 0 | 1; reason: 'goal' | 'own-goal' | 'stuck' } | null;
}

export function isPoint(x: number, y: number): boolean {
  if (x < 0 || x > W) return false;
  if (y >= 0 && y <= H) return true;
  return (y === -1 || y === H + 1) && x >= MOUTH_L && x <= MOUTH_R;
}

/** Points on the border bounce the ball (side lines, the end lines outside the mouth, posts). */
export function isBorderPoint(x: number, y: number): boolean {
  if (x === 0 || x === W) return true;
  return (y === 0 || y === H) && (x <= MOUTH_L || x >= MOUTH_R);
}

/** Whether the segment from (x, y) one step in direction d runs along the border. */
function alongBorder(x: number, y: number, d: number): boolean {
  const x2 = x + DX[d]!;
  const y2 = y + DY[d]!;
  if (DX[d] === 0 && (x === 0 || x === W)) return true; // side lines
  if (DY[d] === 0) {
    if ((y === 0 || y === H) && Math.min(x, x2) < MOUTH_L) return true;
    if ((y === 0 || y === H) && Math.max(x, x2) > MOUTH_R) return true;
    if (y === -1 || y === H + 1) return true; // back of the goal
  }
  // The goal's sides: straight from a post into the goal.
  if (DX[d] === 0 && (x === MOUTH_L || x === MOUTH_R)) {
    const ys = [y, y2].sort((a, b) => a - b);
    if ((ys[0] === -1 && ys[1] === 0) || (ys[0] === H && ys[1] === H + 1)) return true;
  }
  return false;
}

export function createPaperSoccerState(): PaperSoccerState {
  return {
    ball: CENTER,
    toMove: 0,
    edges: new Array<number>(POINTS * 8).fill(0),
    lines: [],
    history: [],
    movers: [],
    result: null,
  };
}

export function canMove(edges: ArrayLike<number>, p: number, d: number): boolean {
  const x = pointX(p);
  const y = pointY(p);
  const x2 = x + DX[d]!;
  const y2 = y + DY[d]!;
  if (!isPoint(x2, y2) || edges[p * 8 + d]) return false;
  if (y === -1 || y === H + 1) return false;
  return !alongBorder(x, y, d);
}

export function legalPaperSoccerActions(s: PaperSoccerState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  for (let d = 0; d < 8; d++) if (canMove(s.edges, s.ball, d)) out.push(String(d));
  return out;
}

export const touched = (edges: ArrayLike<number>, p: number) => {
  for (let d = 0; d < 8; d++) if (edges[p * 8 + d]) return true;
  return false;
};

export function applyPaperSoccerAction(s: PaperSoccerState, a: string): PaperSoccerState {
  if (s.result || typeof a !== 'string' || !/^[0-7]$/.test(a))
    throw new IllegalActionError(`Illegal move ${String(a)}`);
  const d = Number(a);
  if (!canMove(s.edges, s.ball, d)) throw new IllegalActionError(`Illegal move ${a}`);
  const x = pointX(s.ball) + DX[d]!;
  const y = pointY(s.ball) + DY[d]!;
  const to = pointAt(x, y);
  const bounce = touched(s.edges, to) || isBorderPoint(x, y);
  const edges = s.edges.slice();
  edges[s.ball * 8 + d] = 1;
  edges[to * 8 + ((d + 4) % 8)] = 1;
  const me = s.toMove;
  const next: PaperSoccerState = {
    ball: to,
    toMove: bounce ? me : ((1 - me) as 0 | 1),
    edges,
    lines: [...s.lines, [s.ball, to, me]],
    history: [...s.history, a],
    movers: [...s.movers, me],
    result: null,
  };
  if (y === -1) next.result = { winner: 0, reason: me === 0 ? 'goal' : 'own-goal' };
  else if (y === H + 1) next.result = { winner: 1, reason: me === 1 ? 'goal' : 'own-goal' };
  else if (legalPaperSoccerActions(next).length === 0)
    next.result = { winner: (1 - next.toMove) as 0 | 1, reason: 'stuck' };
  return next;
}

export function replayPaperSoccer(history: readonly string[]): PaperSoccerState {
  return history.reduce((s, a) => applyPaperSoccerAction(s, a), createPaperSoccerState());
}

export function isValidPaperSoccerState(data: unknown): data is PaperSoccerState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayPaperSoccer(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
