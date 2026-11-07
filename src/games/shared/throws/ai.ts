/**
 * Throw predictors. Each reads only the finished rounds (never a pending throw) and predicts the
 * opponent's next throw; the player then throws what beats the prediction.
 *
 * - `random`: uniform throws — the unexploitable equilibrium.
 * - `frequency`: the opponent's most common throw, with older rounds fading.
 * - `markov`: what the opponent threw after the same last two rounds (both throws), falling back to
 *   the last round, then to frequency.
 * - `meta`: an ensemble in the spirit of "Iocaine Powder": several predictors (frequency, markov on
 *   one and two rounds, repeat-last, and the same predictors applied to its own throws, as the
 *   opponent might), each also shifted by one and two steps around the circle to catch
 *   second-guessing; every candidate is scored on how its throw would have fared, with fading, and
 *   the best-scoring one plays. With no evidence it throws at random.
 */
import { nextUint32, seedRng } from '../../../core/game-engine/random';
import { outcome, type Duel } from './engine';

/** A pseudo-random throw from the match seed and the round number (the same in replays). */
export function randomThrow(g: Duel, salt = 0): number {
  const [x] = nextUint32(
    seedRng((g.seed ^ Math.imul(g.rounds.length + 1 + salt * 977, 0x9e3779b1)) >>> 0),
  );
  return x % g.n;
}

/** Fading counts of what `who` (0 = seat 0, 1 = seat 1) threw, optionally after a context. */
function counts(
  rounds: Duel['rounds'],
  n: number,
  who: 0 | 1,
  ctx?: (i: number) => boolean,
): number[] {
  const c = new Array<number>(n).fill(0);
  let w = 1;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (!ctx || ctx(i)) c[who === 0 ? rounds[i]!.a : rounds[i]!.b]! += w;
    w *= 0.95;
  }
  return c;
}

const nonZero = (c: number[]) => c.some((v) => v > 0);

/** Predicts `who`'s next throw by frequency. */
const byFrequency = (rounds: Duel['rounds'], n: number, who: 0 | 1) => counts(rounds, n, who);

/** Predicts `who`'s next throw from what followed the same last k rounds. */
function byMarkov(rounds: Duel['rounds'], n: number, who: 0 | 1, k: number): number[] {
  if (rounds.length <= k) return new Array<number>(n).fill(0);
  const tail = rounds.slice(-k);
  const same = (i: number) =>
    i >= k && tail.every((r, j) => rounds[i - k + j]!.a === r.a && rounds[i - k + j]!.b === r.b);
  return counts(rounds, n, who, same);
}

const lastOf = (rounds: Duel['rounds'], n: number, who: 0 | 1) => {
  const c = new Array<number>(n).fill(0);
  if (rounds.length) c[who === 0 ? rounds.at(-1)!.a : rounds.at(-1)!.b] = 1;
  return c;
};

/** The throw that beats a predicted distribution best (and loses to it least). */
export function counter(dist: number[], n: number): number {
  let best = 0;
  let score = -Infinity;
  for (let m = 0; m < n; m++) {
    const s = dist.reduce((acc, p, x) => acc + p * outcome(n, m, x), 0);
    if (s > score + 1e-9) {
      score = s;
      best = m;
    }
  }
  return best;
}

export type Level = 'random' | 'frequency' | 'markov' | 'meta';

/** A seat's throw under each level, and whether it came from a read (or was random). */
export function decide(g: Duel, seat: 0 | 1, level: Level): { throw: number; read: boolean } {
  const rounds = g.rounds;
  const n = g.n;
  const opp: 0 | 1 = seat === 0 ? 1 : 0;
  if (level === 'random' || rounds.length === 0)
    return { throw: randomThrow(g, seat), read: false };
  if (level === 'frequency') return { throw: counter(byFrequency(rounds, n, opp), n), read: true };
  if (level === 'markov') {
    for (const k of [2, 1]) {
      const d = byMarkov(rounds, n, opp, k);
      if (nonZero(d)) return { throw: counter(d, n), read: true };
    }
    return { throw: counter(byFrequency(rounds, n, opp), n), read: true };
  }
  return metaThrow(g, seat);
}

export const chooseThrow = (g: Duel, seat: 0 | 1, level: Level) => decide(g, seat, level).throw;

/** The candidate throws of the ensemble after `rounds` (the throw each candidate would make now). */
function candidates(rounds: Duel['rounds'], n: number, seat: 0 | 1): number[] {
  const opp: 0 | 1 = seat === 0 ? 1 : 0;
  const out: number[] = [];
  const base: number[][] = [
    byFrequency(rounds, n, opp),
    byMarkov(rounds, n, opp, 1),
    byMarkov(rounds, n, opp, 2),
    lastOf(rounds, n, opp),
  ];
  // What the opponent would throw if it predicted us the same way: beat that.
  for (const mine of [
    byFrequency(rounds, n, seat),
    byMarkov(rounds, n, seat, 1),
    byMarkov(rounds, n, seat, 2),
    lastOf(rounds, n, seat),
  ]) {
    // (Always one entry per predictor, so candidates keep their positions from round to round.)
    const d = new Array<number>(n).fill(0);
    if (nonZero(mine)) d[counter(mine, n)] = 1;
    base.push(d);
  }
  for (const d of base) {
    const m = nonZero(d) ? counter(d, n) : -1;
    // The throw itself and the throws one and two steps on (second- and third-guessing).
    for (const s of [0, 1, 2]) out.push(m < 0 ? -1 : (m + s) % n);
  }
  return out;
}

/** Fading scores of each candidate over the finished rounds, then the best candidate's throw. */
function metaThrow(g: Duel, seat: 0 | 1): { throw: number; read: boolean } {
  const n = g.n;
  const rounds = g.rounds;
  let scores: number[] = [];
  for (let i = 0; i < rounds.length; i++) {
    const cands = candidates(rounds.slice(0, i), n, seat);
    if (!scores.length) scores = new Array<number>(cands.length).fill(0);
    const oppThrow = seat === 0 ? rounds[i]!.b : rounds[i]!.a;
    scores = scores.map((s, j) => s * 0.9 + (cands[j]! < 0 ? 0 : outcome(n, cands[j]!, oppThrow)));
  }
  const now = candidates(rounds, n, seat);
  let best = -1;
  for (let j = 0; j < now.length; j++)
    if (now[j]! >= 0 && (best < 0 || scores[j]! > scores[best]!)) best = j;
  // No predictor has earned trust yet: stay unpredictable.
  if (best < 0 || scores[best]! <= 0.5) return { throw: randomThrow(g, seat), read: false };
  return { throw: now[best]!, read: true };
}
