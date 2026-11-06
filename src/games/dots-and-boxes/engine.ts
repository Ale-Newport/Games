/**
 * Dots and Boxes on a 4×4 grid of boxes (5×5 dots, 40 lines). Players take turns drawing one line
 * between two adjacent dots. Completing the fourth side of a box (or two boxes at once) claims it
 * and the same player must draw again. When every line is drawn, the player with more boxes wins;
 * 8–8 is a draw.
 *
 * Actions are line indices: horizontal line (r, c) → r·4 + c (0–19, r = 0–4 from the top), vertical
 * line (r, c) → 20 + r·5 + c (20–39, c = 0–4 from the left).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const ROWS = 4;
export const COLS = 4;
export const H_LINES = (ROWS + 1) * COLS;
export const LINES = H_LINES + ROWS * (COLS + 1);
export const BOXES = ROWS * COLS;

export const hLine = (r: number, c: number) => r * COLS + c;
export const vLine = (r: number, c: number) => H_LINES + r * (COLS + 1) + c;

/** The four lines of each box: top, bottom, left, right. */
export const BOX_LINES: readonly (readonly number[])[] = Array.from({ length: BOXES }, (_, b) => {
  const r = Math.floor(b / COLS);
  const c = b % COLS;
  return [hLine(r, c), hLine(r + 1, c), vLine(r, c), vLine(r, c + 1)];
});

/** The one or two boxes each line borders. */
export const LINE_BOXES: readonly number[][] = Array.from({ length: LINES }, () => []);
BOX_LINES.forEach((lines, b) => lines.forEach((l) => (LINE_BOXES[l] as number[]).push(b)));

export interface DotsState {
  /** 0 = not drawn, otherwise seat + 1 of the player who drew it. */
  lines: number[];
  /** −1 = open, otherwise the seat that claimed the box. */
  boxes: number[];
  toMove: 0 | 1;
  /** Seat that drew each line of `history` (a player keeps drawing after claiming a box). */
  movers: (0 | 1)[];
  history: number[];
  scores: [number, number];
  result: { winner: 0 | 1 } | { draw: true } | null;
}

export function createDotsState(): DotsState {
  return {
    lines: new Array<number>(LINES).fill(0),
    boxes: new Array<number>(BOXES).fill(-1),
    toMove: 0,
    movers: [],
    history: [],
    scores: [0, 0],
    result: null,
  };
}

export const sidesDrawn = (lines: readonly number[], b: number) =>
  BOX_LINES[b]!.reduce((n, l) => n + (lines[l] ? 1 : 0), 0);

export function legalDotsActions(s: DotsState): number[] {
  if (s.result) return [];
  const out: number[] = [];
  for (let l = 0; l < LINES; l++) if (!s.lines[l]) out.push(l);
  return out;
}

export function applyDotsAction(s: DotsState, line: number): DotsState {
  if (s.result || !Number.isInteger(line) || line < 0 || line >= LINES || s.lines[line])
    throw new IllegalActionError(`Illegal line ${line}`);
  const me = s.toMove;
  const lines = s.lines.slice();
  lines[line] = me + 1;
  const boxes = s.boxes.slice();
  const scores: [number, number] = [...s.scores];
  let claimed = 0;
  for (const b of LINE_BOXES[line]!)
    if (sidesDrawn(lines, b) === 4) {
      boxes[b] = me;
      scores[me]++;
      claimed++;
    }
  const toMove = claimed ? me : ((1 - me) as 0 | 1);
  let result: DotsState['result'] = null;
  if (scores[0] + scores[1] === BOXES)
    result = scores[0] === scores[1] ? { draw: true } : { winner: scores[0] > scores[1] ? 0 : 1 };
  return {
    lines,
    boxes,
    toMove,
    movers: [...s.movers, me],
    history: [...s.history, line],
    scores,
    result,
  };
}

export function replayDots(history: readonly number[]): DotsState {
  return history.reduce((s, a) => applyDotsAction(s, a), createDotsState());
}

export function isValidDotsState(data: unknown): data is DotsState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'number')) return false;
  try {
    return JSON.stringify(replayDots(data.history as number[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
