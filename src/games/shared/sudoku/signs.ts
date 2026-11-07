/**
 * Inequality signs between orthogonal neighbours (Futoshiki): a sign says which of the two cells
 * holds the smaller digit. This module gives the solver a propagator (a cell below another can be
 * no larger than that cell's largest candidate minus one, and so on), the technique solver an
 * inequality step, and the choice of signs over a solution.
 */
import type { Rng } from '../../../core/game-engine/random';
import { bit, digitsOf, type Geometry } from './grid';
import type { LogicState, Step, StepExtra } from './logic';
import type { Extra } from './solver';

/** `less` holds a smaller digit than `more`. */
export interface Sign {
  less: number;
  more: number;
}

const highest = (m: number) => 31 - Math.clz32(m) + 1;
const lowest = (m: number) => 31 - Math.clz32(m & -m) + 1;
/** Digits strictly below / above a digit. */
const below = (d: number) => (1 << (d - 1)) - 1;
const above = (n: number, d: number) => ((1 << n) - 1) & ~((1 << d) - 1);

/** The masks after one pass over the signs (placed digits count as one-digit masks). */
function narrow(
  n: number,
  signs: readonly Sign[],
  value: (c: number) => number,
  mask: (c: number) => number,
) {
  const out = new Map<number, number>();
  const m = (c: number) => out.get(c) ?? (value(c) ? bit(value(c)) : mask(c));
  for (const { less, more } of signs) {
    const ml = m(less);
    const mm = m(more);
    if (!ml || !mm) continue;
    out.set(less, ml & below(highest(mm)));
    out.set(more, mm & above(n, lowest(ml)));
  }
  return out;
}

export function signExtra(geo: Geometry, signs: readonly Sign[]): Extra {
  const touching = Array.from({ length: geo.cells }, () => [] as Sign[]);
  for (const s of signs) {
    touching[s.less]!.push(s);
    touching[s.more]!.push(s);
  }
  return {
    check: (values, cell) =>
      touching[cell]!.every(
        ({ less, more }) => !values[less] || !values[more] || values[less]! < values[more]!,
      ),
    prune: (values, masks) => {
      const next = narrow(
        geo.size,
        signs,
        (c) => values[c]!,
        (c) => masks[c]!,
      );
      let changed = false;
      for (const [c, m] of next) {
        if (values[c]) {
          if (!(m & bit(values[c]!))) return -1;
          continue;
        }
        if (!m) return -1;
        if (m !== masks[c]) {
          masks[c] = m;
          changed = true;
        }
      }
      return changed ? 1 : 0;
    },
  };
}

/** Technique: candidates a sign rules out (too big below a smaller-than, too small above it). */
function inequality(geo: Geometry, st: LogicState, signs: readonly Sign[]): Step | null {
  for (const sign of signs) {
    const next = narrow(
      geo.size,
      [sign],
      (c) => st.values[c]!,
      (c) => st.cands[c]!,
    );
    const remove = [...next].flatMap(([c, m]) =>
      st.values[c] ? [] : digitsOf(st.cands[c]! & ~m).map((digit) => ({ cell: c, digit })),
    );
    if (remove.length)
      return {
        technique: 'inequality',
        remove,
        cells: [sign.less, sign.more],
        digits: [...new Set(remove.map((r) => r.digit))],
      };
  }
  return null;
}

export const signSteps = (signs: readonly Sign[]): StepExtra[] => [
  { level: 1, find: (geo, st) => inequality(geo, st, signs) },
];

/** A random share of the orthogonal neighbour pairs, signed by the solution. */
export function drawSigns(
  geo: Geometry,
  solution: readonly number[],
  rng: Rng,
  share: number,
): Sign[] {
  const n = geo.size;
  const out: Sign[] = [];
  for (let c = 0; c < geo.cells; c++)
    for (const x of [c % n < n - 1 ? c + 1 : -1, c + n < geo.cells ? c + n : -1])
      if (x >= 0 && rng.float() < share)
        out.push(solution[c]! < solution[x]! ? { less: c, more: x } : { less: x, more: c });
  return out;
}
