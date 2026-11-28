/**
 * Equation Guess rules (pure). Find a hidden arithmetic equation — 6 or 8 characters over the
 * digits, + − × ÷ and = — in a few tries. Every guess must itself be a true equation; each
 * character comes back green (right place), yellow (in the equation, elsewhere) or grey (not
 * there, or not that many times). Puzzles: Mini (6 characters, 6 tries), Classic (8, 6 tries) and
 * Hard (8, 5 tries). Sessions: a three-puzzle daily (one of each) or endless puzzles of one size.
 * See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export interface EquationData {
  /** Answer pools (no trivial equations), with * and / for × and ÷. */
  six: string[];
  eight: string[];
}

export type Size = 'mini' | 'classic' | 'hard';
export const SIZES: Size[] = ['mini', 'classic', 'hard'];
export const LENGTH: Record<Size, 6 | 8> = { mini: 6, classic: 8, hard: 8 };
export const TRIES: Record<Size, number> = { mini: 6, classic: 6, hard: 5 };
/** Points for solving on try 1, 2, … */
export const POINTS = [100, 85, 70, 55, 40, 25];
export const SYMBOLS = '0123456789+-*/=';
export const answersFor = (d: EquationData, size: Size) => (LENGTH[size] === 6 ? d.six : d.eight);

/* ---------- validity ---------- */

type Frac = [number, number];
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const norm = ([n, d]: Frac): Frac => {
  if (d < 0) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
};
const isNumber = (t: string) => /^(0|[1-9]\d*)$/.test(t);

/** Why a guess is not acceptable, or null when it is a true equation of the right length. */
export function invalidReason(
  guess: string,
  length: number,
): 'length' | 'symbols' | 'equals' | 'syntax' | 'divzero' | 'false' | null {
  if (guess.length !== length) return 'length';
  if ([...guess].some((ch) => !SYMBOLS.includes(ch))) return 'symbols';
  const parts = guess.split('=');
  if (parts.length !== 2) return 'equals';
  const [left, right] = parts as [string, string];
  if (!isNumber(right)) return 'syntax';
  const tokens = left.split(/([+\-*/])/);
  if (tokens.length < 3) return 'syntax';
  for (let i = 0; i < tokens.length; i++)
    if (i % 2 === 0 ? !isNumber(tokens[i]!) : !'+-*/'.includes(tokens[i]!)) return 'syntax';
  // × and ÷ first, then + and −, in exact fractions.
  let cur: Frac = [Number(tokens[0]), 1];
  let acc: Frac = [0, 1];
  let sign = 1;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]!;
    const v = Number(tokens[i + 1]);
    if (op === '*') cur = norm([cur[0] * v, cur[1]]);
    else if (op === '/') {
      if (v === 0) return 'divzero';
      cur = norm([cur[0], cur[1] * v]);
    } else {
      acc = norm([acc[0] * cur[1] + sign * cur[0] * acc[1], acc[1] * cur[1]]);
      sign = op === '+' ? 1 : -1;
      cur = [v, 1];
    }
  }
  acc = norm([acc[0] * cur[1] + sign * cur[0] * acc[1], acc[1] * cur[1]]);
  return acc[1] === 1 && acc[0] === Number(right) ? null : 'false';
}
export const isValid = (guess: string, length: number) => invalidReason(guess, length) === null;

/* ---------- feedback ---------- */

export type Mark = 'correct' | 'present' | 'absent';
/** Marks a guess against the answer, counting repeated symbols correctly. */
export function mark(guess: string, answer: string): Mark[] {
  const out: Mark[] = [...guess].map(() => 'absent');
  const left = new Map<string, number>();
  [...answer].forEach((ch, i) => {
    if (guess[i] === ch) out[i] = 'correct';
    else left.set(ch, (left.get(ch) ?? 0) + 1);
  });
  [...guess].forEach((ch, i) => {
    if (out[i] === 'correct') return;
    const n = left.get(ch) ?? 0;
    if (n > 0) {
      out[i] = 'present';
      left.set(ch, n - 1);
    }
  });
  return out;
}
/** The pattern as a compact string (g / y / x), used for grouping by the solver. */
export const pattern = (m: Mark[]) =>
  m.map((x) => (x === 'correct' ? 'g' : x === 'present' ? 'y' : 'x')).join('');

/** Best known state of each symbol over the guesses so far (for the keypad). */
export function keyStates(guesses: string[], answer: string): Map<string, Mark> {
  const rank: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };
  const out = new Map<string, Mark>();
  for (const g of guesses)
    mark(g, answer).forEach((m, i) => {
      const ch = g[i]!;
      const prev = out.get(ch);
      if (!prev || rank[m] > rank[prev]) out.set(ch, m);
    });
  return out;
}

/* ---------- sessions ---------- */

export interface Puzzle {
  size: Size;
  answer: string;
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  score: number | null;
}
export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  size: Size;
  limit: number;
  rng: RngState;
  puzzles: Puzzle[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}
export const DAILY_SIZES: Size[] = ['mini', 'classic', 'hard'];
const KEEP = 12;
const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 211, 2246822519) ^ 0x6e9a_77b1) >>> 0;

function addPuzzle(s: Session, d: EquationData, avoid: ReadonlySet<string>): Session {
  const rng = new Rng(s.rng);
  const size = s.mode === 'daily' ? DAILY_SIZES[s.puzzles.length]! : s.size;
  const pool = answersFor(d, size);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.puzzles.map((p) => p.answer)]);
  const fresh = pool.filter((a) => !used.has(a));
  const answer = rng.pick(fresh.length ? fresh : pool);
  const puzzles = [
    ...s.puzzles,
    { size, answer, guesses: [], status: 'playing' as const, score: null },
  ];
  return { ...s, rng: rng.state, puzzles: s.mode === 'daily' ? puzzles : puzzles.slice(-KEEP) };
}
function base(
  mode: Session['mode'],
  day: number,
  size: Size,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    size,
    limit,
    rng: new Rng(seed >>> 0).state,
    puzzles: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}
export const newDaily = (d: EquationData, day: number) =>
  addPuzzle(base('daily', day, 'classic', DAILY_SIZES.length, dailySeed(day)), d, new Set());
export const newEndless = (
  d: EquationData,
  seed: number,
  size: Size,
  avoid: ReadonlySet<string> = new Set(),
  limit = 0,
) => addPuzzle(base('endless', -1, size, limit, seed), d, avoid);

export const current = (s: Session): Puzzle => s.puzzles[s.puzzles.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).status === 'playing';

export function submit(s: Session, guess: string): Session {
  if (!awaiting(s)) throw new Error('No puzzle is waiting for a guess');
  const p = current(s);
  const reason = invalidReason(guess, LENGTH[p.size]);
  if (reason) throw new Error(`Invalid guess: ${reason}`);
  const guesses = [...p.guesses, guess];
  let np: Puzzle = { ...p, guesses };
  if (guess === p.answer) np = { ...np, status: 'won', score: POINTS[guesses.length - 1]! };
  else if (guesses.length >= TRIES[p.size]) np = { ...np, status: 'lost', score: 0 };
  const puzzles = [...s.puzzles.slice(0, -1), np];
  if (np.status === 'playing') return { ...s, puzzles };
  const count = s.count + 1;
  return {
    ...s,
    puzzles,
    count,
    total: s.total + np.score!,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}
export function next(s: Session, d: EquationData, avoid: ReadonlySet<string> = new Set()): Session {
  if (s.status !== 'playing' || current(s).status === 'playing')
    throw new Error('Nothing to advance');
  return addPuzzle(s, d, avoid);
}
export function finish(s: Session): Session {
  const puzzles = current(s).status === 'playing' ? s.puzzles.slice(0, -1) : s.puzzles;
  return { ...s, puzzles, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq: Record<Mark, string> = { correct: '🟩', present: '🟨', absent: '⬛' };
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  const blocks = s.puzzles
    .filter((p) => p.status !== 'playing')
    .map(
      (p) =>
        `${p.status === 'won' ? p.guesses.length : 'X'}/${TRIES[p.size]}\n${p.guesses
          .map((g) =>
            mark(g, p.answer)
              .map((m) => sq[m])
              .join(''),
          )
          .join('\n')}`,
    );
  return `${head}\n${blocks.join('\n\n')}`;
}

/** Shows an equation with proper signs: × ÷ −. */
export const pretty = (e: string) => e.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    SIZES.includes(s.size) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.puzzles) &&
    (s.puzzles.length > 0 || s.status === 'done') &&
    s.puzzles.every(
      (p) =>
        SIZES.includes(p.size) &&
        typeof p.answer === 'string' &&
        isValid(p.answer, LENGTH[p.size]) &&
        Array.isArray(p.guesses) &&
        p.guesses.length <= TRIES[p.size] &&
        p.guesses.every((g) => typeof g === 'string' && isValid(g, LENGTH[p.size])) &&
        (p.status === 'playing'
          ? p.score === null
          : (p.status === 'won' || p.status === 'lost') && isNum(p.score)),
    )
  );
}
