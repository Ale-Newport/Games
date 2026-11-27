/**
 * Closest Call rules (pure). A game-show contest of eight rounds for 2–4 contestants (people
 * and/or computer players). Each round asks for a real quantity; contestants answer one after
 * another — rotating who goes first — and see the answers already given. Every answer scores by
 * how close it is (target rings, measured as a ratio to the truth) and the closest answer earns a
 * bonus. Rounds get harder; the last one counts double. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { domain, pickQuestion, question, type Bank, type QKey } from '../rough-guess/engine';
import { belief, type Level } from './beliefs';

export type { Level };
export const LEVELS: Level[] = ['easy', 'normal', 'hard'];
export const ROUNDS = 8;
export const CLOSEST_BONUS = 3;

/** Ring thresholds (ratio to the answer) and points, from the bullseye out. */
export const RINGS: { ratio: number; points: number }[] = [
  { ratio: 1.02, points: 10 },
  { ratio: 1.05, points: 8 },
  { ratio: 1.1, points: 6 },
  { ratio: 1.25, points: 4 },
  { ratio: 1.5, points: 3 },
  { ratio: 2, points: 2 },
  { ratio: 10, points: 1 },
];
export const ringIndex = (ratio: number) => {
  const i = RINGS.findIndex((r) => ratio <= r.ratio * (1 + 1e-12));
  return i < 0 ? RINGS.length : i;
};
export const ringPoints = (ratio: number) => RINGS[ringIndex(ratio)]?.points ?? 0;
export const ratioOf = (guess: number, answer: number) => Math.max(guess / answer, answer / guess);

/** Question difficulty per round: two easy, three normal, three hard (the last doubled). */
export const ROUND_DIFFICULTY = [
  'easy',
  'easy',
  'normal',
  'normal',
  'normal',
  'hard',
  'hard',
  'hard',
] as const;
export const roundMultiplier = (round: number) => (round === ROUNDS - 1 ? 2 : 1);

export interface Player {
  name: string;
  /** null for a person; the level for a computer contestant. */
  bot: Level | null;
}

export interface RoundState {
  key: QKey;
  /** Who answers first this round. */
  first: number;
  guesses: (number | null)[];
  /** Points per player once settled. */
  points: number[] | null;
}

export interface Game {
  mode: 'daily' | 'custom';
  day: number;
  players: Player[];
  rng: RngState;
  rounds: RoundState[];
  scores: number[];
  status: 'playing' | 'done';
}

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 41, 2246822519) ^ 0x7e57_1235) >>> 0;

function addRound(g: Game, bank: Bank): Game {
  const rng = new Rng(g.rng);
  const r = g.rounds.length;
  const used = new Set(g.rounds.map((x) => x.key));
  const last = g.rounds.length ? question(bank, g.rounds[g.rounds.length - 1]!.key).kind : null;
  const key = pickQuestion(bank, rng, ROUND_DIFFICULTY[r]!, 'all', used, last);
  return {
    ...g,
    rng: rng.state,
    rounds: [
      ...g.rounds,
      { key, first: r % g.players.length, guesses: g.players.map(() => null), points: null },
    ],
  };
}

export function newGame(
  bank: Bank,
  players: Player[],
  seed: number,
  mode: Game['mode'] = 'custom',
  day = -1,
): Game {
  if (players.length < 2 || players.length > 4)
    throw new Error('Closest Call needs 2–4 contestants');
  return addRound(
    {
      mode,
      day,
      players,
      rng: new Rng(seed >>> 0).state,
      rounds: [],
      scores: players.map(() => 0),
      status: 'playing',
    },
    bank,
  );
}

export const DAILY_BOTS: Player[] = [
  { name: 'Ada', bot: 'normal' },
  { name: 'Bruno', bot: 'normal' },
  { name: 'Chiara', bot: 'normal' },
];
export const newDaily = (bank: Bank, day: number, you: string) =>
  newGame(bank, [{ name: you, bot: null }, ...DAILY_BOTS], dailySeed(day), 'daily', day);

export const currentRound = (g: Game): RoundState => g.rounds[g.rounds.length - 1]!;
/** Index of the contestant whose turn it is, or -1 when every answer is in. */
export function turn(g: Game): number {
  if (g.status !== 'playing') return -1;
  const r = currentRound(g);
  if (r.points) return -1;
  for (let k = 0; k < g.players.length; k++) {
    const p = (r.first + k) % g.players.length;
    if (r.guesses[p] === null) return p;
  }
  return -1;
}

/** Records the current contestant's answer; the last answer settles the round. */
export function guess(g: Game, bank: Bank, value: number): Game {
  const p = turn(g);
  if (p < 0) throw new Error('Nobody is due to answer');
  const q = question(bank, currentRound(g).key);
  const [lo, hi] = domain(bank, q);
  if (!(value > 0) || !Number.isFinite(value)) throw new Error('Answers are positive numbers');
  const l = Math.log10(value);
  if (l < lo - 1e-9 || l > hi + 1e-9) throw new Error('The answer is off the scale');
  const r = currentRound(g);
  const guesses = r.guesses.map((x, i) => (i === p ? value : x));
  let next: RoundState = { ...r, guesses };
  let scores = g.scores;
  if (guesses.every((x) => x !== null)) {
    const points = settle(guesses as number[], q.value, g.rounds.length - 1);
    next = { ...next, points };
    scores = g.scores.map((s, i) => s + points[i]!);
  }
  const rounds = [...g.rounds.slice(0, -1), next];
  const done = next.points !== null && g.rounds.length === ROUNDS;
  return { ...g, rounds, scores, status: done ? 'done' : 'playing' };
}

/** Ring points plus the closest bonus (shared by ties), times the round multiplier. */
export function settle(guesses: number[], answer: number, round: number): number[] {
  const ratios = guesses.map((v) => ratioOf(v, answer));
  const best = Math.min(...ratios);
  const m = roundMultiplier(round);
  return ratios.map((r) => m * (ringPoints(r) + (Math.abs(r - best) < 1e-12 ? CLOSEST_BONUS : 0)));
}

export function nextRound(g: Game, bank: Bank): Game {
  if (g.status !== 'playing' || !currentRound(g).points) throw new Error('The round is not over');
  return addRound(g, bank);
}

/** Final standings: player indices from first to last (ties keep seat order). */
export const standings = (g: Game) =>
  g.players.map((_, i) => i).sort((a, b) => g.scores[b]! - g.scores[a]! || a - b);
export const winners = (g: Game) => {
  const top = Math.max(...g.scores);
  return g.players.map((_, i) => i).filter((i) => g.scores[i] === top);
};

/* ---------- computer contestants ---------- */

/** Standard normal density. */
const phi = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/**
 * The expected value of answering `x` (log10) given a belief about the answer and the answers
 * already given: E[ring points + bonus if strictly closest] over the belief, integrated on a grid.
 * Later contestants are ignored (their answers are not known yet).
 */
export function expectedValue(x: number, mean: number, sd: number, others: number[]): number {
  let total = 0;
  let weight = 0;
  for (let k = -40; k <= 40; k++) {
    const t = mean + (k / 10) * sd;
    const w = phi(k / 10);
    const d = Math.abs(x - t);
    const pts = ringPoints(Math.pow(10, d));
    const closest = others.every((o) => d < Math.abs(o - t) - 1e-12) ? CLOSEST_BONUS : 0;
    total += w * (pts + closest);
    weight += w;
  }
  return total / weight;
}

/**
 * A computer contestant's answer. Easy answers a draw from its (wide) belief. Normal and Hard
 * search their belief's range for the answer with the best expected value against the answers
 * already given — e.g. stepping just beside a rival's answer to take the larger side.
 */
export function botGuess(g: Game, bank: Bank, level: Level, rng: Rng): number {
  const r = currentRound(g);
  const q = question(bank, r.key);
  const [lo, hi] = domain(bank, q);
  const b = belief(bank, r.key, level);
  const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
  // Round to readable figures, unless rounding would step off the scale.
  const tidy = (logV: number, digits: number) => {
    const exact = Math.pow(10, logV);
    const r = Number(exact.toPrecision(digits));
    const l = Math.log10(r);
    return l >= lo && l <= hi ? r : exact;
  };
  if (level === 'easy') {
    // Box–Muller draw from the belief.
    const u = Math.max(1e-9, rng.float());
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng.float());
    return tidy(clamp(b.mean + z * b.sd), 3);
  }
  const others = r.guesses.filter((x): x is number => x !== null).map(Math.log10);
  const best = clamp(b.mean);
  let bestV = -1;
  const candidates = new Set<number>();
  for (let k = -30; k <= 30; k++) candidates.add(clamp(b.mean + (k / 10) * b.sd));
  // Just beside each rival answer, on both sides.
  for (const o of others) for (const e of [-0.004, 0.004]) candidates.add(clamp(o + e));
  // Score each candidate as it will actually be answered (rounded): an exact value that rounds
  // onto a rival's answer would tie with it rather than beat it.
  let answer = tidy(best, 4);
  for (const x of candidates) {
    const rounded = tidy(x, 4);
    const v = expectedValue(Math.log10(rounded), b.mean, b.sd, others);
    if (v > bestV + 1e-12) {
      bestV = v;
      answer = rounded;
    }
  }
  return answer;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isGame(v: unknown): v is Game {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Game;
  const n = Array.isArray(g.players) ? g.players.length : 0;
  return (
    (g.mode === 'daily' || g.mode === 'custom') &&
    isNum(g.day) &&
    n >= 2 &&
    n <= 4 &&
    g.players.every(
      (p) => typeof p.name === 'string' && (p.bot === null || LEVELS.includes(p.bot)),
    ) &&
    Array.isArray(g.rng) &&
    g.rng.length === 4 &&
    Array.isArray(g.scores) &&
    g.scores.length === n &&
    g.scores.every(isNum) &&
    (g.status === 'playing' || g.status === 'done') &&
    Array.isArray(g.rounds) &&
    g.rounds.length >= 1 &&
    g.rounds.length <= ROUNDS &&
    g.rounds.every(
      (r) =>
        typeof r.key === 'string' &&
        isNum(r.first) &&
        Array.isArray(r.guesses) &&
        r.guesses.length === n &&
        r.guesses.every((x) => x === null || (isNum(x) && x > 0)) &&
        (r.points === null ||
          (Array.isArray(r.points) && r.points.length === n && r.points.every(isNum))),
    )
  );
}
