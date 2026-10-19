/**
 * Exact solver for small m,n,k-games (rows × cols ≤ 25) using bitboards, symmetry reduction,
 * a persistent transposition table, dead-position detection and forced-move pruning.
 * Used as the "Perfect" opponent and as a test oracle. Supports misère play.
 */
import { allLines } from '../../../core/game-engine/grid';
import type { MnkRules, MnkState } from './engine';

/** Game-theoretic value for the side to move: 1 win, 0 draw, -1 loss. */
export type ExactValue = -1 | 0 | 1;

const TWO_POW_25 = 33554432;

export class MnkSolver {
  readonly cells: number;
  private readonly lines: number[];
  /** Lines (as masks) that pass through each cell. */
  private readonly linesByCell: number[][];
  /** Symmetry permutations of cell indices (identity first). */
  private readonly symmetries: number[][];
  /** symTables[s][byteIndex][byte] = image of that byte's bits under symmetry s. */
  private readonly symTables: Int32Array[][];
  private readonly table = new Map<number, ExactValue>();
  nodes = 0;

  constructor(private readonly rules: MnkRules) {
    this.cells = rules.rows * rules.cols;
    if (this.cells > 25) throw new Error('MnkSolver supports at most 25 cells');
    this.lines = allLines(rules, rules.k).map((line) =>
      line.reduce((mask, c) => mask | (1 << c), 0),
    );
    this.linesByCell = Array.from({ length: this.cells }, (_, c) =>
      this.lines.filter((m) => m & (1 << c)),
    );
    this.symmetries = buildSymmetries(rules.rows, rules.cols);
    const bytes = Math.ceil(this.cells / 8);
    this.symTables = this.symmetries.map((perm) =>
      Array.from({ length: bytes }, (_, byteIndex) => {
        const table = new Int32Array(256);
        for (let value = 0; value < 256; value++) {
          let image = 0;
          for (let bit = 0; bit < 8; bit++) {
            const cell = byteIndex * 8 + bit;
            if (cell < this.cells && value & (1 << bit)) image |= 1 << perm[cell]!;
          }
          table[value] = image;
        }
        return table;
      }),
    );
  }

  get tableSize(): number {
    return this.table.size;
  }

  /** Exact value of a non-terminal or terminal engine state, from the side to move. */
  value(state: MnkState): ExactValue {
    if (state.result) {
      if (state.result.kind === 'draw') return 0;
      return state.result.winner === state.toMove ? 1 : -1;
    }
    const [own, opp] = this.masks(state);
    return this.solve(own, opp);
  }

  /** Exact value of every legal move, from the mover's perspective. */
  moveValues(state: MnkState): Map<number, ExactValue> {
    const values = new Map<number, ExactValue>();
    if (state.result) return values;
    const [own, opp] = this.masks(state);
    const occupied = own | opp;
    for (let c = 0; c < this.cells; c++) {
      if (occupied & (1 << c)) continue;
      values.set(c, this.afterMove(own, opp, c));
    }
    return values;
  }

  private masks(state: MnkState): [number, number] {
    const ownMark = state.toMove === 0 ? 1 : 2;
    let own = 0;
    let opp = 0;
    state.board.forEach((cell, i) => {
      if (cell === ownMark) own |= 1 << i;
      else if (cell !== 0) opp |= 1 << i;
    });
    return [own, opp];
  }

  private completes(mask: number, cell: number): boolean {
    for (const line of this.linesByCell[cell]!) if ((mask & line) === line) return true;
    return false;
  }

  /** Value for the player who just played `cell` (own) — i.e. the mover's result. */
  private afterMove(own: number, opp: number, cell: number): ExactValue {
    const next = own | (1 << cell);
    if (this.completes(next, cell)) return this.rules.misere ? -1 : 1;
    if ((next | opp) >>> 0 === (2 ** this.cells - 1) >>> 0) return 0;
    return negate(this.solve(opp, next));
  }

  private solve(own: number, opp: number): ExactValue {
    this.nodes++;
    if (this.isDead(own, opp)) return 0;
    const key = this.canonicalKey(own, opp);
    const cached = this.table.get(key);
    if (cached !== undefined) return cached;

    const occupied = own | opp;
    const empty: number[] = [];
    for (let c = 0; c < this.cells; c++) if (!(occupied & (1 << c))) empty.push(c);

    let best: ExactValue = -1;
    if (!this.rules.misere) {
      // Immediate win, else forced block when the opponent threatens one cell, else full search.
      for (const c of empty) if (this.completes(own | (1 << c), c)) return this.store(key, 1);
      const threats = empty.filter((c) => this.completes(opp | (1 << c), c));
      if (threats.length > 1) return this.store(key, -1);
      const candidates = threats.length === 1 ? threats : empty;
      for (const c of candidates) {
        const v = this.afterMove(own, opp, c);
        if (v > best) best = v;
        if (best === 1) break;
      }
    } else {
      let anySafe = false;
      for (const c of empty) {
        if (this.completes(own | (1 << c), c)) continue; // completing a line loses
        anySafe = true;
        const v = this.afterMove(own, opp, c);
        if (v > best) best = v;
        if (best === 1) break;
      }
      if (!anySafe) best = -1;
    }
    return this.store(key, best);
  }

  private store(key: number, value: ExactValue): ExactValue {
    this.table.set(key, value);
    return value;
  }

  /** No line can ever be completed by either player → the game is a draw. */
  private isDead(own: number, opp: number): boolean {
    for (const line of this.lines) {
      if ((line & opp) === 0 || (line & own) === 0) return false;
    }
    return true;
  }

  private canonicalKey(own: number, opp: number): number {
    let best = Infinity;
    for (const tables of this.symTables) {
      let a = 0;
      let b = 0;
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i]!;
        a |= table[(own >>> (i * 8)) & 255]!;
        b |= table[(opp >>> (i * 8)) & 255]!;
      }
      const key = (a >>> 0) + (b >>> 0) * TWO_POW_25;
      if (key < best) best = key;
    }
    return best;
  }
}

const negate = (v: ExactValue): ExactValue => (v === 0 ? 0 : (-v as ExactValue));

/** Index permutations for the symmetries of a rows × cols grid (8 for squares, 4 otherwise). */
export function buildSymmetries(rows: number, cols: number): number[][] {
  const maps: ((r: number, c: number) => [number, number])[] = [
    (r, c) => [r, c],
    (r, c) => [r, cols - 1 - c],
    (r, c) => [rows - 1 - r, c],
    (r, c) => [rows - 1 - r, cols - 1 - c],
  ];
  if (rows === cols) {
    maps.push(
      (r, c) => [c, r],
      (r, c) => [c, rows - 1 - r],
      (r, c) => [cols - 1 - c, r],
      (r, c) => [cols - 1 - c, rows - 1 - r],
    );
  }
  return maps.map((f) =>
    Array.from({ length: rows * cols }, (_, i) => {
      const [r, c] = f(Math.floor(i / cols), i % cols);
      return r * cols + c;
    }),
  );
}
