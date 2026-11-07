/**
 * Arithmetic cages (Calcudoku, the KenKen-style puzzle): each cage shows a target and an operation
 * — the sum, the product, or for two cells the difference or the quotient (larger by smaller) of its
 * digits; a one-cell cage simply states its digit. Digits may repeat inside a cage when they are in
 * different rows and columns. This module gives the solver a propagator over each cage's valid
 * digit tuples, the technique solver a cage-arithmetic step, and the generator.
 */
import { Rng } from '../../../core/game-engine/random';
import { bit, digitsOf, type Geometry } from './grid';
import { drawCages, pieces } from './killer';
import type { LogicState, Step, StepExtra } from './logic';
import { randomSolution, solveSudoku, type Extra } from './solver';

export type Op = '+' | '-' | '*' | '/' | '=';

export interface CalcCage {
  cells: number[];
  target: number;
  op: Op;
}

export function cageValue(op: Op, digits: readonly number[]): number {
  if (op === '+' || op === '=') return digits.reduce((a, b) => a + b, 0);
  if (op === '*') return digits.reduce((a, b) => a * b, 1);
  const [a, b] = [Math.max(...digits), Math.min(...digits)];
  return op === '-' ? a - b : b && a % b === 0 ? a / b : -1;
}

/** Every digit tuple (in cage-cell order) meeting the target, distinct within a row or column. */
const tupleCache = new Map<string, number[][]>();
export function cageTuples(geo: Geometry, cage: CalcCage): number[][] {
  const key = `${geo.size}|${cage.op}|${cage.target}|${cage.cells.join(',')}`;
  const hit = tupleCache.get(key);
  if (hit) return hit;
  const n = geo.size;
  const out: number[][] = [];
  const cur: number[] = [];
  const clash = (i: number, d: number) =>
    cage.cells.slice(0, i).some((c, j) => {
      const x = cage.cells[i]!;
      return cur[j] === d && (Math.floor(c / n) === Math.floor(x / n) || c % n === x % n);
    });
  const go = (i: number) => {
    if (i === cage.cells.length) {
      if (cageValue(cage.op, cur) === cage.target) out.push([...cur]);
      return;
    }
    for (let d = 1; d <= n; d++) {
      if (clash(i, d)) continue;
      cur.push(d);
      go(i + 1);
      cur.pop();
    }
  };
  go(0);
  tupleCache.set(key, out);
  return out;
}

/** Per cell of the cage, the digits some still-possible tuple gives it; null on a contradiction. */
function cageAllowed(
  geo: Geometry,
  cage: CalcCage,
  value: (c: number) => number,
  mask: (c: number) => number,
): number[] | null {
  const allowed = cage.cells.map(() => 0);
  let any = false;
  for (const tuple of cageTuples(geo, cage)) {
    const fits = cage.cells.every((c, i) => {
      const v = value(c);
      return v ? v === tuple[i] : !!(mask(c) & bit(tuple[i]!));
    });
    if (!fits) continue;
    any = true;
    tuple.forEach((d, i) => (allowed[i]! |= bit(d)));
  }
  return any ? allowed : null;
}

export function calcExtra(geo: Geometry, cages: readonly CalcCage[]): Extra {
  const of = Array<number>(geo.cells).fill(-1);
  cages.forEach((cage, i) => cage.cells.forEach((c) => (of[c] = i)));
  return {
    check: (values, cell) => {
      const cage = cages[of[cell]!];
      if (!cage) return true;
      const digits = cage.cells.map((c) => values[c]!);
      if (digits.some((d) => !d)) return true;
      return cageValue(cage.op, digits) === cage.target;
    },
    prune: (values, masks) => {
      let changed = false;
      for (const cage of cages) {
        const allowed = cageAllowed(
          geo,
          cage,
          (c) => values[c]!,
          (c) => masks[c]!,
        );
        if (!allowed) return -1;
        cage.cells.forEach((c, i) => {
          if (values[c] || (masks[c]! & allowed[i]!) === masks[c]) return;
          masks[c]! &= allowed[i]!;
          changed = true;
        });
        if (cage.cells.some((c) => !values[c] && !masks[c])) return -1;
      }
      return changed ? 1 : 0;
    },
  };
}

/** Technique: remove candidates that no arithmetic tuple of the cage allows. */
function cageArithmetic(geo: Geometry, st: LogicState, cages: readonly CalcCage[]): Step | null {
  for (const cage of cages) {
    const allowed = cageAllowed(
      geo,
      cage,
      (c) => st.values[c]!,
      (c) => st.cands[c]!,
    );
    if (!allowed) continue;
    const remove = cage.cells.flatMap((c, i) =>
      st.values[c]
        ? []
        : digitsOf(st.cands[c]! & ~allowed[i]!).map((digit) => ({ cell: c, digit })),
    );
    if (remove.length)
      return {
        technique: 'cage-arithmetic',
        remove,
        cells: cage.cells,
        digits: [...new Set(allowed.flatMap(digitsOf))],
        sum: cage.target,
      };
  }
  return null;
}

export const calcSteps = (cages: readonly CalcCage[]): StepExtra[] => [
  { level: 1, find: (geo, st) => cageArithmetic(geo, st, cages) },
];

/** An operation for a group of cells over the solution (subtraction and division for pairs). */
function cageFor(cells: number[], solution: readonly number[], rng: Rng): CalcCage {
  const digits = cells.map((c) => solution[c]!);
  if (cells.length === 1) return { cells, target: digits[0]!, op: '=' };
  let op: Op;
  if (cells.length === 2) {
    const [a, b] = [Math.max(...digits), Math.min(...digits)];
    const roll = rng.float();
    op = a % b === 0 && a !== b && roll < 0.45 ? '/' : roll < 0.7 ? '-' : roll < 0.85 ? '+' : '*';
  } else op = rng.float() < 0.5 ? '+' : '*';
  return { cells: [...cells].sort((x, y) => x - y), target: cageValue(op, digits), op };
}

export interface CalcPuzzle {
  solution: number[];
  cages: CalcCage[];
}

/**
 * A Calcudoku with a unique solution: a random Latin square, cages drawn over it with operations,
 * then — while the solver finds a second solution or gives up — the cage holding a differing cell
 * is split there into connected pieces (each getting a new operation).
 */
export function generateCalc(
  geo: Geometry,
  seed: number,
  spec: { min: number; max: number; maxNodes: number; singles?: number },
  accept: (cages: CalcCage[]) => boolean,
  attempts = 30,
): CalcPuzzle {
  const singles = (cages: CalcCage[]) => cages.filter((c) => c.op === '=').length;
  let best: CalcPuzzle | null = null;
  const rng = new Rng(seed);
  let last: CalcPuzzle | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const solution = randomSolution(geo, rng);
    let cages = drawCages(geo, solution, rng, spec.min, spec.max, false).map((g) =>
      cageFor(g, solution, rng),
    );
    let unique = false;
    for (let round = 0; round < 80; round++) {
      const r = solveSudoku(geo, Array<number>(geo.cells).fill(0), {
        limit: 2,
        extra: calcExtra(geo, cages),
        maxNodes: spec.maxNodes,
        keep: true,
      });
      if (r.count === 1 && !r.aborted) {
        unique = true;
        break;
      }
      const other = r.solutions.find((x) => x.some((v, c) => v !== solution[c]));
      const diff = other
        ? rng.shuffle(solution.map((v, c) => (v !== other[c] ? c : -1)).filter((c) => c >= 0))[0]!
        : -1;
      const ci =
        diff >= 0
          ? cages.findIndex((g) => g.cells.includes(diff))
          : cages.reduce(
              (best, g, i) => (g.cells.length > cages[best]!.cells.length ? i : best),
              0,
            );
      const cage = cages[ci]!;
      if (cage.cells.length > 1 && rng.float() < 0.6) {
        // Another operation often settles it without splitting the cage.
        cages = cages.map((g, i) => (i === ci ? cageFor(g.cells, solution, rng) : g));
        continue;
      }
      if (cage.cells.length === 1) {
        // Already a stated digit: draw a fresh operation for a neighbouring pair instead.
        cages = cages.map((g) => (g.cells.length > 1 ? cageFor(g.cells, solution, rng) : g));
        continue;
      }
      const cut = diff >= 0 ? diff : cage.cells[rng.int(cage.cells.length)]!;
      cages = [
        ...cages.slice(0, ci),
        ...cages.slice(ci + 1),
        cageFor([cut], solution, rng),
        ...pieces(
          geo,
          cage.cells.filter((c) => c !== cut),
        ).map((g) => cageFor(g, solution, rng)),
      ];
    }
    if (!unique) continue;
    last = { solution, cages };
    if (!accept(cages)) continue;
    // Keep the one with the fewest one-cell cages (stated digits).
    if (!best || singles(cages) < singles(best.cages)) best = last;
    if (singles(cages) <= (spec.singles ?? 0)) break;
  }
  const out = best ?? last;
  if (!out) throw new Error('No calcudoku puzzle');
  return out;
}
