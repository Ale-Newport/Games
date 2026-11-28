/**
 * Builds `src/games/equation-guess/equations.json` for Equation Guess (#246): the answer pool —
 * every valid equation of 6 and of 8 characters over 0–9 + − × ÷ = that is not trivial.
 *
 * Valid means: one “=”, a left side of numbers joined by + − × ÷ (no leading zeros, no unary
 * signs, no two operators in a row), evaluated with the usual precedence (× and ÷ before + and −,
 * left to right) in exact fractions, equal to a right side that is a single non-negative whole
 * number without leading zeros. Division by zero is invalid. Written with * and / internally.
 * (Guesses are validated by the game itself with the same rules; only answers are shipped.)
 *
 * Not trivial means: no number 0 on the left (no ×0, 0÷, +0…), no ×1 or ÷1, and a result above 0.
 *
 *   npx tsx tools/generate-equations.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(import.meta.dirname, '..', 'src', 'games', 'equation-guess', 'equations.json');
const OPS = ['+', '-', '*', '/'];

/** Numbers of `len` digits without leading zeros (0 itself allowed alone). */
function* numbers(len: number): Generator<string> {
  if (len === 1) {
    for (let d = 0; d <= 9; d++) yield String(d);
    return;
  }
  const lo = 10 ** (len - 1);
  for (let n = lo; n < lo * 10; n++) yield String(n);
}

/** All left sides of exactly `len` characters: numbers and operators alternating. */
function* lefts(len: number): Generator<string[]> {
  // A left side has k numbers and k − 1 operators; lengths of numbers sum to len − (k − 1).
  function* rec(remaining: number, needOp: boolean, acc: string[]): Generator<string[]> {
    if (remaining === 0) {
      if (!needOp) return;
      if (acc.length >= 3) yield acc; // at least one operator
      return;
    }
    if (needOp) {
      for (const op of OPS) yield* rec(remaining - 1, false, [...acc, op]);
      return;
    }
    for (let l = 1; l <= remaining; l++)
      for (const n of numbers(l)) yield* rec(remaining - l, true, [...acc, n]);
  }
  yield* rec(len, false, []);
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
type Frac = [bigint, bigint];
const norm = ([n, d]: Frac): Frac => {
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return [n / g, d / g];
};

/** Value of a token list with precedence, or null on division by zero. */
function evaluate(tokens: string[]): Frac | null {
  // First fold × and ÷ into terms, then sum with + and −.
  const terms: Frac[] = [];
  const signs: number[] = [1];
  let cur: Frac = [BigInt(tokens[0]!), 1n];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]!;
    const v: Frac = [BigInt(tokens[i + 1]!), 1n];
    if (op === '*') cur = norm([cur[0] * v[0], cur[1] * v[1]]);
    else if (op === '/') {
      if (v[0] === 0n) return null;
      cur = norm([cur[0] * v[1], cur[1] * v[0]]);
    } else {
      terms.push(cur);
      signs.push(op === '+' ? 1 : -1);
      cur = v;
    }
  }
  terms.push(cur);
  let acc: Frac = [0n, 1n];
  terms.forEach(
    (t, k) => (acc = norm([acc[0] * t[1] + BigInt(signs[k]!) * t[0] * acc[1], acc[1] * t[1]])),
  );
  return acc;
}

function build(total: number): string[] {
  const outList: string[] = [];
  // The right side has r digits; the left side total − 1 − r characters.
  for (let r = 1; r <= total - 4; r++) {
    for (const left of lefts(total - 1 - r)) {
      const v = evaluate(left);
      if (!v || v[1] !== 1n || v[0] < 0n) continue;
      const rhs = v[0].toString();
      if (rhs.length !== r) continue;
      if (rhs === '0') continue;
      if (
        left.some(
          (t, k) =>
            t === '0' ||
            (t === '1' && (left[k - 1] === '*' || left[k - 1] === '/' || left[k + 1] === '*')),
        )
      )
        continue;
      outList.push(`${left.join('')}=${rhs}`);
    }
  }
  return [...new Set(outList)].sort();
}

const six = build(6);
const eight = build(8);
writeFileSync(out, JSON.stringify({ six, eight }));
console.log(six.length, 'six-character and', eight.length, 'eight-character equations');
