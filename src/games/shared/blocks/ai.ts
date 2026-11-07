/**
 * Falling-block players. For the current piece they try every rotation and column reachable by
 * rotating, sliding and dropping straight down, score each resulting board with the published
 * "El-Tetris" weights (landing height, rows cleared, row and column transitions, holes, wells), and
 * then press the keys that get the piece there: rotate, tap sideways, drop.
 */
import { boxSize, cells, type Kind } from './pieces';
import { COLS, dropY, fits, ROWS, type BlockRules, type Blocks, type Piece } from './sim';

const W = {
  height: -4.500158825082766,
  rows: 3.4181268101392694,
  rowT: -3.2178882868487753,
  colT: -9.348695305445199,
  holes: -7.899265427351652,
  wells: -3.3855972247263626,
};

export function evaluate(board: (Kind | null)[], p: Piece): number {
  const b = [...board];
  let maxY = 0;
  let minY = ROWS;
  for (const [cx, cy] of cells(p.kind, p.r)) {
    const y = p.y + cy;
    if (y >= 0) b[y * COLS + p.x + cx] = p.kind;
    maxY = Math.max(maxY, y);
    minY = Math.min(minY, y);
  }
  const full: number[] = [];
  for (let y = 0; y < ROWS; y++)
    if (b.slice(y * COLS, (y + 1) * COLS).every((c) => c !== null)) full.push(y);
  let pieceCellsCleared = 0;
  for (const [, cy] of cells(p.kind, p.r)) if (full.includes(p.y + cy)) pieceCellsCleared++;
  const after = [
    ...new Array<Kind | null>(full.length * COLS).fill(null),
    ...b.filter((_, i) => !full.includes(Math.floor(i / COLS))),
  ];
  const filled = (x: number, y: number) =>
    x < 0 || x >= COLS || y >= ROWS || (y >= 0 && after[y * COLS + x] !== null);
  let rowT = 0;
  let colT = 0;
  let holes = 0;
  let wells = 0;
  for (let y = 0; y < ROWS; y++)
    for (let x = -1; x < COLS; x++) if (filled(x, y) !== filled(x + 1, y)) rowT++;
  for (let x = 0; x < COLS; x++) {
    let seen = false;
    for (let y = 0; y <= ROWS; y++) {
      if (filled(x, y - 1) !== filled(x, y)) colT++;
      if (y < ROWS && filled(x, y)) seen = true;
      else if (y < ROWS && seen) holes++;
    }
    // Wells: empty cells with both sides filled, counted with depth.
    let depth = 0;
    for (let y = 0; y < ROWS; y++) {
      if (!filled(x, y) && filled(x - 1, y) && filled(x + 1, y)) {
        depth++;
        wells += depth;
      } else depth = 0;
    }
  }
  const landing = ROWS - (maxY + minY) / 2;
  return (
    W.height * landing +
    W.rows * full.length * pieceCellsCleared +
    W.rowT * rowT +
    W.colT * colT +
    W.holes * holes +
    W.wells * wells
  );
}

/** Placements already worked out, per board (boards are replaced, never changed, when a piece locks). */
const cache = new WeakMap<object, Map<string, { r: number; x: number } | null>>();

/** The best final placement (rotation, column) for the current piece, judged from where it spawned. */
export function bestPlacement(s: Blocks): { r: number; x: number } | null {
  const cur = s.piece;
  if (!cur) return null;
  const key = `${cur.kind}`;
  const known = cache.get(s.board)?.get(key);
  if (known !== undefined) return known;
  const p = { ...cur, r: 0, x: boxSize(cur.kind) === 2 ? 4 : 3, y: 0 };
  const found = search(s, p);
  if (!cache.has(s.board)) cache.set(s.board, new Map());
  cache.get(s.board)!.set(key, found);
  return found;
}

function search(s: Blocks, p: Piece): { r: number; x: number } | null {
  let best: { r: number; x: number } | null = null;
  let score = -Infinity;
  for (let r = 0; r < 4; r++) {
    if (
      (p.kind === 'O' && r > 0) ||
      ((p.kind === 'I' || p.kind === 'S' || p.kind === 'Z') && r > 1)
    )
      continue;
    const rotated = { ...p, r };
    if (!fits(s.board, rotated)) continue;
    for (let x = -2; x < COLS; x++) {
      const placed = { ...rotated, x };
      if (!fits(s.board, placed)) continue;
      // Reachable by sliding at the spawn height.
      const step = x < p.x ? -1 : 1;
      let ok = true;
      for (let xx = p.x; xx !== x; xx += step)
        if (!fits(s.board, { ...rotated, x: xx })) ok = false;
      if (!ok) continue;
      const landed = { ...placed, y: dropY(s.board, placed) };
      const v = evaluate(s.board, landed);
      if (v > score) {
        score = v;
        best = { r, x };
      }
    }
  }
  return best;
}

/** Key presses towards the best placement: rotate, then tap sideways, then drop. */
export function plannerAction(rules: BlockRules, s: Blocks): string {
  const p = s.piece;
  if (!p) return 'idle';
  const t = bestPlacement(s);
  if (!t) return rules.modern ? 'H' : 'S';
  // Presses need a release in between: alternate with an idle step.
  const tap = s.prev === '' || s.prev === 'idle';
  if (p.r !== t.r) return tap ? ((t.r - p.r + 4) % 4 === 3 ? 'A' : 'C') : 'idle';
  if (p.x !== t.x) return tap ? (t.x < p.x ? 'L' : 'R') : 'idle';
  return rules.modern ? (tap ? 'H' : 'idle') : 'S';
}

/** A weak player: drops each piece where it is, rotated at random-looking intervals. */
export function dropperAction(rules: BlockRules, s: Blocks): string {
  if (!s.piece) return 'idle';
  if (s.steps % 40 === 0) return 'C';
  return rules.modern ? (s.steps % 2 ? 'H' : 'idle') : 'S';
}
