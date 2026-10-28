/**
 * Bulls and Cows rules: secret numbers of distinct digits (leading zeros allowed), guesses scored
 * in bulls (right digit, right place) and cows (right digit, wrong place). Solo: crack the
 * computer's number. Duel: each side cracks the other's number in turn; when the first player
 * cracks it, the second gets one last guess to draw.
 */
import { Rng } from '../../core/game-engine/random';
import { isCode, score, type CodeRules, type Scored } from '../shared/codeguess/engine';

export * from '../shared/codeguess/engine';

export interface BullsVariant extends CodeRules {
  maxGuesses: number;
}

const digits = (pegs: number): BullsVariant => ({
  pegs,
  symbols: 10,
  repeats: false,
  maxGuesses: 15,
});

export const VARIANTS: Record<string, BullsVariant> = {
  three: digits(3),
  four: digits(4),
  five: digits(5),
};

export interface BullsState {
  variant: string;
  seed: number;
  mode: 'solo' | 'duel';
  /** `secrets[p]` is the number player p must crack (in the duel, the other side chose it). */
  secrets: number[][];
  /** Whether `secrets[1]` (the number the computer cracks in the duel) was chosen by the player. */
  playerSet: boolean;
  guesses: Scored[][];
  turn: number;
  status: 'playing' | 'done';
  /** The winning seat, or null for a draw (duel) or running out of guesses (solo). */
  winner: number | null;
  hints: number;
  /** Per digit: 0 unmarked, 1 ruled out, 2 known to be in the number (the solo player's notes). */
  notes: number[];
  elapsedMs: number;
}

export const variantOf = (s: { variant: string }) => VARIANTS[s.variant] ?? VARIANTS.four!;

export function secretFor(v: BullsVariant, seed: number): number[] {
  const rng = new Rng(seed >>> 0);
  const free = Array.from({ length: v.symbols }, (_, i) => i);
  return Array.from({ length: v.pegs }, () => free.splice(rng.int(free.length), 1)[0]!);
}

export function newBulls(
  variant: string,
  mode: 'solo' | 'duel',
  seed: number,
  playerNumber?: number[],
): BullsState {
  const name = VARIANTS[variant] ? variant : 'four';
  const v = VARIANTS[name]!;
  const secrets =
    mode === 'solo'
      ? [secretFor(v, seed)]
      : [secretFor(v, seed), playerNumber ? [...playerNumber] : secretFor(v, seed ^ 0x5bd1e995)];
  return {
    variant: name,
    seed: seed >>> 0,
    mode,
    secrets,
    playerSet: mode === 'duel' && !!playerNumber,
    guesses: secrets.map(() => []),
    turn: 0,
    status: 'playing',
    winner: null,
    hints: 0,
    notes: Array.from({ length: 10 }, () => 0),
    elapsedMs: 0,
  };
}

export const cracked = (s: BullsState, p: number) => {
  const g = s.guesses[p]!;
  return g.length > 0 && g[g.length - 1]!.exact === variantOf(s).pegs;
};

export function makeGuess(s: BullsState, code: number[]): BullsState {
  const v = variantOf(s);
  if (s.status !== 'playing' || !isCode(v, code)) return s;
  const p = s.turn;
  const [exact, near] = score(s.secrets[p]!, code);
  const guesses = s.guesses.map((g, i) => (i === p ? [...g, { code: [...code], exact, near }] : g));
  const next: BullsState = { ...s, guesses };
  if (s.mode === 'solo') {
    if (exact === v.pegs) return { ...next, status: 'done', winner: 0 };
    if (guesses[0]!.length >= v.maxGuesses) return { ...next, status: 'done', winner: null };
    return next;
  }
  if (p === 0) {
    // The second player always gets the same number of guesses.
    return { ...next, turn: 1 };
  }
  const first = cracked(next, 0);
  const second = cracked(next, 1);
  if (first || second)
    return { ...next, status: 'done', winner: first && second ? null : first ? 0 : 1 };
  if (guesses[1]!.length >= v.maxGuesses) return { ...next, status: 'done', winner: null };
  return { ...next, turn: 0 };
}

export function isValidBullsState(d: unknown): d is BullsState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as BullsState;
  const v = VARIANTS[s.variant];
  if (!v || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (s.mode !== 'solo' && s.mode !== 'duel') return false;
  if (typeof s.playerSet !== 'boolean' || (s.playerSet && s.mode !== 'duel')) return false;
  if (!Array.isArray(s.secrets) || !Array.isArray(s.guesses)) return false;
  if (!s.secrets.every((x) => isCode(v, x))) return false;
  const fresh = newBulls(s.variant, s.mode, s.seed, s.playerSet ? s.secrets[1] : undefined);
  if (JSON.stringify(fresh.secrets) !== JSON.stringify(s.secrets)) return false;
  if (!Number.isInteger(s.hints) || s.hints < 0) return false;
  if (typeof s.elapsedMs !== 'number' || !(s.elapsedMs >= 0)) return false;
  if (!Array.isArray(s.notes) || s.notes.length !== 10) return false;
  if (!s.notes.every((n) => n === 0 || n === 1 || n === 2)) return false;
  if (s.guesses.length !== fresh.guesses.length) return false;
  // Replay the guesses in turn order and compare every score.
  let replay = fresh;
  const at = s.guesses.map(() => 0);
  const total = s.guesses.reduce((n, g) => n + (Array.isArray(g) ? g.length : -999), 0);
  if (total < 0) return false;
  for (let k = 0; k < total; k++) {
    if (replay.status !== 'playing') return false;
    const p = replay.turn;
    const g = s.guesses[p]![at[p]!];
    if (!g || typeof g !== 'object' || !isCode(v, g.code)) return false;
    at[p]!++;
    replay = makeGuess(replay, g.code);
    const last = replay.guesses[p]![replay.guesses[p]!.length - 1]!;
    if (last.exact !== g.exact || last.near !== g.near) return false;
  }
  return replay.status === s.status && replay.turn === s.turn && replay.winner === s.winner;
}
