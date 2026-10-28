/**
 * The shared core of code-guessing games (Code Breaker, Bulls and Cows): a code space of fixed
 * length over a symbol alphabet (with or without repeats), the exact/near score of a guess, the
 * codes still consistent with the scores so far, and a minimax guess chooser (Knuth's rule: the guess
 * whose worst answer leaves the fewest codes), with symmetry reduction over the symbols not yet tried
 * and a work budget for large spaces.
 */

export interface CodeRules {
  pegs: number;
  symbols: number;
  repeats: boolean;
}

export interface Scored {
  code: number[];
  /** Right symbol in the right place (black pegs, bulls). */
  exact: number;
  /** Right symbol in the wrong place (white pegs, cows). */
  near: number;
}

/** [exact, near]: right symbol and place; right symbol elsewhere (each peg counted once). */
export function score(secret: readonly number[], guess: readonly number[]): [number, number] {
  let exact = 0;
  const a = new Map<number, number>();
  const b = new Map<number, number>();
  for (let i = 0; i < secret.length; i++) {
    const x = secret[i]!;
    const y = guess[i]!;
    if (x === y) exact++;
    else {
      a.set(x, (a.get(x) ?? 0) + 1);
      b.set(y, (b.get(y) ?? 0) + 1);
    }
  }
  let near = 0;
  for (const [sym, n] of a) near += Math.min(n, b.get(sym) ?? 0);
  return [exact, near];
}

export function isCode(rules: CodeRules, code: unknown): code is number[] {
  if (!Array.isArray(code) || code.length !== rules.pegs) return false;
  if (!code.every((x) => Number.isInteger(x) && x >= 0 && x < rules.symbols)) return false;
  return rules.repeats || new Set(code).size === code.length;
}

/** All codes of a ruleset in lexicographic order, with per-code symbol counts for fast scoring. */
export class CodeSpace {
  readonly codes: Uint8Array;
  readonly counts: Uint8Array;
  readonly count: number;

  constructor(readonly rules: CodeRules) {
    const { pegs, symbols, repeats } = rules;
    const out: number[] = [];
    const cur: number[] = [];
    const used: boolean[] = [];
    const walk = (i: number) => {
      if (i === pegs) {
        out.push(...cur);
        return;
      }
      for (let s = 0; s < symbols; s++) {
        if (!repeats && used[s]) continue;
        cur[i] = s;
        used[s] = true;
        walk(i + 1);
        used[s] = false;
      }
    };
    walk(0);
    this.codes = Uint8Array.from(out);
    this.count = out.length / pegs;
    this.counts = new Uint8Array(this.count * symbols);
    for (let i = 0; i < this.count; i++)
      for (let k = 0; k < pegs; k++) this.counts[i * symbols + this.codes[i * pegs + k]!]!++;
  }

  code(i: number): number[] {
    const p = this.rules.pegs;
    return Array.from(this.codes.subarray(i * p, i * p + p));
  }

  /** Index of a code, or -1 when it is not one of this space. */
  index(code: readonly number[]): number {
    if (!isCode(this.rules, code)) return -1;
    const p = this.rules.pegs;
    let lo = 0;
    let hi = this.count - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      let cmp = 0;
      for (let k = 0; k < p && !cmp; k++) cmp = this.codes[mid * p + k]! - code[k]!;
      if (!cmp) return mid;
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  /** Score key, exact × (pegs + 1) + near, of code `i` scored against guess `g`. */
  key(i: number, g: number): number {
    const { pegs: p, symbols: n } = this.rules;
    const c = this.codes;
    const k = this.counts;
    let exact = 0;
    for (let x = 0; x < p; x++) if (c[i * p + x] === c[g * p + x]) exact++;
    let common = 0;
    for (let s = 0; s < n; s++) common += Math.min(k[i * n + s]!, k[g * n + s]!);
    return exact * (p + 1) + common - exact;
  }
}

const spaces = new Map<string, CodeSpace>();
export function spaceFor(rules: CodeRules): CodeSpace {
  const k = `${rules.pegs}-${rules.symbols}-${rules.repeats}`;
  let s = spaces.get(k);
  if (!s) {
    s = new CodeSpace(rules);
    spaces.set(k, s);
  }
  return s;
}

export const keyOf = (pegs: number, exact: number, near: number) => exact * (pegs + 1) + near;

/** Indices of the codes that would have given every recorded score. */
export function consistent(space: CodeSpace, guesses: readonly Scored[]): number[] {
  const p = space.rules.pegs;
  const gs = guesses.map((g) => ({ i: space.index(g.code), k: keyOf(p, g.exact, g.near) }));
  const out: number[] = [];
  outer: for (let i = 0; i < space.count; i++) {
    for (const g of gs) if (g.i < 0 || space.key(i, g.i) !== g.k) continue outer;
    out.push(i);
  }
  return out;
}

/** For each guess that contradicts an earlier score: that guess's row and the score it would get. */
export function contradiction(
  guesses: readonly Scored[],
  code: readonly number[],
): { row: number; exact: number; near: number } | null {
  for (let r = 0; r < guesses.length; r++) {
    const g = guesses[r]!;
    const [exact, near] = score(code, g.code);
    if (exact !== g.exact || near !== g.near) return { row: r, exact, near };
  }
  return null;
}

/**
 * Codes worth trying as a guess: symbols never used in any guess are interchangeable, so only codes
 * that introduce them in a fixed order are kept.
 */
export function guessPool(space: CodeSpace, guesses: readonly Scored[]): number[] {
  const { pegs, symbols } = space.rules;
  const tried = new Set(guesses.flatMap((g) => g.code));
  const fresh: number[] = [];
  for (let s = 0; s < symbols; s++) if (!tried.has(s)) fresh.push(s);
  const rank = new Map(fresh.map((s, r) => [s, r]));
  const out: number[] = [];
  for (let i = 0; i < space.count; i++) {
    let next = 0;
    let ok = true;
    const seen = new Set<number>();
    for (let k = 0; k < pegs && ok; k++) {
      const s = space.codes[i * pegs + k]!;
      const r = rank.get(s);
      if (r === undefined || seen.has(s)) continue;
      if (r !== next) ok = false;
      seen.add(s);
      next++;
    }
    if (ok) out.push(i);
  }
  return out;
}

export interface Choice {
  index: number;
  /** Codes left in the worst case after this guess. */
  worst: number;
  /** Average codes left after this guess (if the secret is any consistent code). */
  expected: number;
  /** Whether the guess itself could be the code. */
  possible: boolean;
}

const EPS = 1e-9;
function better(a: Choice, b: Choice, rule: 'worst' | 'expected'): boolean {
  const byWorst = a.worst - b.worst;
  const byExpected = Math.abs(a.expected - b.expected) <= EPS ? 0 : a.expected - b.expected;
  const first = rule === 'worst' ? byWorst : byExpected;
  const second = rule === 'worst' ? byExpected : byWorst;
  if (first) return first < 0;
  if (second) return second < 0;
  return a.possible && !b.possible;
}

/**
 * The minimax guess: smallest worst case, then smallest expected size, then one that could win,
 * then the first in order (with `rule: 'expected'`, the expected size comes first). When candidates × pool exceeds `budget`, the pool is thinned evenly
 * (half of it from the consistent candidates) so the choice stays fast.
 */
export function chooseGuess(
  space: CodeSpace,
  guesses: readonly Scored[],
  candidates: readonly number[] = consistent(space, guesses),
  budget = 2_500_000,
  rule: 'worst' | 'expected' = 'worst',
): Choice {
  if (candidates.length <= 2)
    return {
      index: candidates[0] ?? 0,
      worst: candidates.length ? 1 : 0,
      expected: candidates.length ? 1 : 0,
      possible: candidates.length > 0,
    };
  const isCand = new Set(candidates);
  let pool = guessPool(space, guesses);
  const room = Math.max(8, Math.floor(budget / candidates.length));
  if (pool.length > room) {
    const thin = (list: readonly number[], n: number) => {
      if (list.length <= n) return [...list];
      const step = list.length / n;
      return Array.from({ length: n }, (_, j) => list[Math.floor(j * step)]!);
    };
    const fromCand = thin(candidates, Math.ceil(room / 2));
    pool = [...new Set([...fromCand, ...thin(pool, room - fromCand.length)])];
  }
  const buckets = new Int32Array((space.rules.pegs + 1) * (space.rules.pegs + 1));
  let best: Choice | null = null;
  for (const g of pool) {
    buckets.fill(0);
    for (const c of candidates) buckets[space.key(c, g)]!++;
    let worst = 0;
    let squares = 0;
    for (const b of buckets) {
      if (b > worst) worst = b;
      squares += b * b;
    }
    const choice: Choice = {
      index: g,
      worst,
      expected: squares / candidates.length,
      possible: isCand.has(g),
    };
    if (!best || better(choice, best, rule)) best = choice;
  }
  return best!;
}
