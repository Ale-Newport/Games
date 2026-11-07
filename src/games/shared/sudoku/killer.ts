/**
 * Killer sudoku: the grid is split into cages, each showing the sum of its digits; digits never
 * repeat inside a cage. This module gives the solver a cage propagator, the technique solver two
 * cage techniques (cage combinations; the 45 rule's innies and outies), and the generator that
 * draws cages over a random solution until the puzzle has exactly one solution.
 */
import { Rng } from '../../../core/game-engine/random';
import { bit, digitsOf, type Geometry } from './grid';
import type { LogicState, Step, StepExtra } from './logic';
import { randomSolution, solveSudoku, type Extra } from './solver';

export interface Cage {
  cells: number[];
  sum: number;
}

/** Digit sets (masks) of each size and sum, for digits 1..n. */
const comboCache = new Map<number, Map<string, number[]>>();
function combos(n: number, size: number, sum: number): number[] {
  let table = comboCache.get(n);
  if (!table) {
    table = new Map();
    for (let m = 1; m < 1 << n; m++) {
      const ds = digitsOf(m);
      const key = `${ds.length}:${ds.reduce((a, b) => a + b, 0)}`;
      const list = table.get(key) ?? [];
      list.push(m);
      table.set(key, list);
    }
    comboCache.set(n, table);
  }
  return table.get(`${size}:${sum}`) ?? [];
}

export const cageIndex = (cells: number, cages: readonly Cage[]) => {
  const of = Array<number>(cells).fill(-1);
  cages.forEach((cage, i) => cage.cells.forEach((c) => (of[c] = i)));
  return of;
};

/**
 * The digits each empty cell of a cage can still take: the union over the cage's digit sets that
 * contain its placed digits and can be spread over its empty cells. Null on a contradiction.
 */
function cageAllowed(
  n: number,
  cage: Cage,
  value: (c: number) => number,
  mask: (c: number) => number,
): number | null {
  let placed = 0;
  const empty: number[] = [];
  for (const c of cage.cells) {
    const v = value(c);
    if (v) {
      if (placed & bit(v)) return null;
      placed |= bit(v);
    } else empty.push(c);
  }
  let allowed = 0;
  for (const set of combos(n, cage.cells.length, cage.sum)) {
    if ((set & placed) !== placed) continue;
    const rest = set & ~placed;
    // Every empty cell needs a digit of the rest, and together they must cover it.
    let union = 0;
    let ok = true;
    for (const c of empty) {
      const m = mask(c) & rest;
      if (!m) {
        ok = false;
        break;
      }
      union |= m;
    }
    if (ok && union === rest) allowed |= rest;
  }
  return empty.length && !allowed ? null : allowed;
}

/** The cage constraint for the exact solver. */
export function cageExtra(geo: Geometry, cages: readonly Cage[]): Extra {
  const of = cageIndex(geo.cells, cages);
  return {
    check: (values, cell) => {
      const cage = cages[of[cell]!];
      if (!cage) return true;
      let seen = 0;
      let sum = 0;
      let full = true;
      for (const c of cage.cells) {
        const v = values[c]!;
        if (!v) {
          full = false;
          continue;
        }
        if (seen & bit(v)) return false;
        seen |= bit(v);
        sum += v;
      }
      return full ? sum === cage.sum : sum < cage.sum;
    },
    prune: (values, masks) => {
      let changed = false;
      for (const cage of cages) {
        const allowed = cageAllowed(
          geo.size,
          cage,
          (c) => values[c]!,
          (c) => masks[c]!,
        );
        if (allowed === null) return -1;
        for (const c of cage.cells) {
          if (values[c] || (masks[c]! & allowed) === masks[c]) continue;
          masks[c]! &= allowed;
          if (!masks[c]) return -1;
          changed = true;
        }
      }
      return changed ? 1 : 0;
    },
  };
}

/** Technique: remove candidates no digit set of the cage allows. */
function cageCombination(geo: Geometry, st: LogicState, cages: readonly Cage[]): Step | null {
  for (const cage of cages) {
    const allowed = cageAllowed(
      geo.size,
      cage,
      (c) => st.values[c]!,
      (c) => st.cands[c]!,
    );
    if (allowed === null) continue;
    const remove = cage.cells.flatMap((c) =>
      st.values[c] ? [] : digitsOf(st.cands[c]! & ~allowed).map((digit) => ({ cell: c, digit })),
    );
    if (remove.length)
      return {
        technique: 'cage-combination',
        remove,
        cells: cage.cells,
        digits: digitsOf(allowed),
        sum: cage.sum,
      };
  }
  return null;
}

/**
 * Technique: the 45 rule. A unit's digits add up to 1+…+n. With the cages wholly inside a unit
 * known, a single empty cell left over (an innie) is forced; with the cages touching it, a single
 * empty cell sticking out (an outie) is forced.
 */
function rule45(geo: Geometry, st: LogicState, cages: readonly Cage[]): Step | null {
  const of = cageIndex(geo.cells, cages);
  const total = (geo.size * (geo.size + 1)) / 2;
  for (let u = 0; u < geo.units.length; u++) {
    const unit = geo.units[u]!;
    const inUnit = new Set(unit);
    const touching = [...new Set(unit.map((c) => of[c]!))].filter((i) => i >= 0);
    const inside = touching.filter((i) => cages[i]!.cells.every((c) => inUnit.has(c)));
    const covered = new Set(inside.flatMap((i) => cages[i]!.cells));
    // Innie.
    const rest = unit.filter((c) => !covered.has(c));
    const restEmpty = rest.filter((c) => !st.values[c]);
    if (restEmpty.length === 1) {
      const cell = restEmpty[0]!;
      const digit =
        total -
        inside.reduce((a, i) => a + cages[i]!.sum, 0) -
        rest.reduce((a, c) => a + st.values[c]!, 0);
      if (digit >= 1 && digit <= geo.size && st.cands[cell]! & bit(digit))
        return {
          technique: 'innie',
          place: { cell, digit },
          remove: [],
          cells: [...covered, cell],
          digits: [digit],
          unit: u,
          sum: inside.reduce((a, i) => a + cages[i]!.sum, 0),
        };
    }
    // Outie.
    const all = touching.flatMap((i) => cages[i]!.cells);
    const out = all.filter((c) => !inUnit.has(c));
    const outEmpty = out.filter((c) => !st.values[c]);
    if (outEmpty.length === 1) {
      const cell = outEmpty[0]!;
      const sum = touching.reduce((a, i) => a + cages[i]!.sum, 0);
      const digit = sum - total - out.reduce((a, c) => a + st.values[c]!, 0);
      if (digit >= 1 && digit <= geo.size && st.cands[cell]! & bit(digit))
        return {
          technique: 'outie',
          place: { cell, digit },
          remove: [],
          cells: all,
          digits: [digit],
          unit: u,
          sum,
        };
    }
  }
  return null;
}

export const killerSteps = (cages: readonly Cage[]): StepExtra[] => [
  { level: 1, find: (geo, st) => cageCombination(geo, st, cages) },
  { level: 2, find: (geo, st) => rule45(geo, st, cages) },
];

/**
 * Draws cages of the given sizes over a solution: random orthogonal growth (with no repeated digit
 * inside a cage when `distinct`).
 */
export function drawCages(
  geo: Geometry,
  solution: readonly number[],
  rng: Rng,
  min: number,
  max: number,
  distinct = true,
): number[][] {
  const n = geo.size;
  const owner = Array<number>(geo.cells).fill(-1);
  const groups: number[][] = [];
  for (const start of rng.shuffle(Array.from({ length: geo.cells }, (_, c) => c))) {
    if (owner[start]! >= 0) continue;
    const target = min + rng.int(max - min + 1);
    const group = [start];
    owner[start] = groups.length;
    let digits = bit(solution[start]!);
    while (group.length < target) {
      const options = group
        .flatMap((c) => {
          const r = Math.floor(c / n);
          const col = c % n;
          return [
            r > 0 ? c - n : -1,
            r < n - 1 ? c + n : -1,
            col > 0 ? c - 1 : -1,
            col < n - 1 ? c + 1 : -1,
          ];
        })
        .filter((c) => c >= 0 && owner[c]! < 0 && !(distinct && digits & bit(solution[c]!)));
      if (!options.length) break;
      const next = options[rng.int(options.length)]!;
      owner[next] = groups.length;
      group.push(next);
      digits |= bit(solution[next]!);
    }
    groups.push(group);
  }
  return groups;
}

/** Splits cells into orthogonally connected pieces. */
export function pieces(geo: Geometry, cells: readonly number[]): number[][] {
  const n = geo.size;
  const left = new Set(cells);
  const out: number[][] = [];
  for (const start of cells) {
    if (!left.has(start)) continue;
    const piece = [start];
    left.delete(start);
    for (let i = 0; i < piece.length; i++) {
      const c = piece[i]!;
      const r = Math.floor(c / n);
      const col = c % n;
      for (const x of [
        r > 0 ? c - n : -1,
        r < n - 1 ? c + n : -1,
        col > 0 ? c - 1 : -1,
        col < n - 1 ? c + 1 : -1,
      ])
        if (x >= 0 && left.has(x)) {
          left.delete(x);
          piece.push(x);
        }
    }
    out.push(piece);
  }
  return out;
}

const toCages = (groups: number[][], solution: readonly number[]): Cage[] =>
  groups.map((cells) => ({
    cells: [...cells].sort((a, b) => a - b),
    sum: cells.reduce((a, c) => a + solution[c]!, 0),
  }));

export interface KillerPuzzle {
  solution: number[];
  cages: Cage[];
}

/**
 * A killer puzzle with a unique solution: cages are drawn, then, while the solver finds a second
 * solution (or runs out of budget), a cage holding a cell where two solutions differ is split.
 */
export function generateKiller(
  geo: Geometry,
  seed: number,
  spec: { min: number; max: number; maxNodes: number },
  accept: (cages: Cage[], solution: number[]) => boolean,
  attempts = 20,
): KillerPuzzle {
  const rng = new Rng(seed);
  let last: KillerPuzzle | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const solution = randomSolution(geo, rng);
    let groups = drawCages(geo, solution, rng, spec.min, spec.max);
    for (let round = 0; round < 60; round++) {
      const cages = toCages(groups, solution);
      const r = solveSudoku(geo, Array<number>(geo.cells).fill(0), {
        limit: 2,
        extra: cageExtra(geo, cages),
        maxNodes: spec.maxNodes,
        keep: true,
      });
      if (r.count === 1 && !r.aborted) {
        last = { solution, cages };
        break;
      }
      // Split a cage at a cell where another solution differs (or any big cage after a give-up).
      const other = r.solutions.find((x) => x.some((v, c) => v !== solution[c]));
      const diff = other
        ? rng.shuffle(solution.map((v, c) => (v !== other[c] ? c : -1)).filter((c) => c >= 0))[0]!
        : -1;
      const gi =
        diff >= 0
          ? groups.findIndex((g) => g.includes(diff))
          : groups.reduce((best, g, i) => (g.length > groups[best]!.length ? i : best), 0);
      const group = groups[gi]!;
      if (group.length === 1) continue;
      const cut = diff >= 0 ? diff : group[rng.int(group.length)]!;
      groups = [
        ...groups.slice(0, gi),
        ...groups.slice(gi + 1),
        [cut],
        ...pieces(
          geo,
          group.filter((c) => c !== cut),
        ),
      ];
    }
    if (last && last.solution === solution && accept(last.cages, solution)) return last;
  }
  if (!last) throw new Error('No killer puzzle');
  return last;
}
