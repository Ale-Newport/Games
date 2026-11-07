/**
 * Code Breaker rules: a hidden code of colored pegs (chosen by the computer from the seed, or by
 * the player for the AI to break), guesses scored with solid pegs (right color, right place) and
 * hollow pegs (right color, wrong place), and a limited number of guesses.
 */
import { Rng } from '../../core/game-engine/random';
import { isCode, score, type CodeRules, type Scored } from '../shared/codeguess/engine';

export * from '../shared/codeguess/engine';

export interface Variant extends CodeRules {
  maxGuesses: number;
}

export const VARIANTS: Record<string, Variant> = {
  easy: { pegs: 4, symbols: 6, repeats: false, maxGuesses: 10 },
  classic: { pegs: 4, symbols: 6, repeats: true, maxGuesses: 10 },
  hard: { pegs: 5, symbols: 8, repeats: true, maxGuesses: 12 },
};

export interface CodeBreakerState {
  variant: string;
  seed: number;
  /** Who chose the code: the computer (from the seed) or the player (for the AI to break). */
  setter: 'computer' | 'player';
  secret: number[];
  guesses: Scored[];
  status: 'playing' | 'won' | 'lost';
  hints: number;
  elapsedMs: number;
}

export function secretFor(variant: Variant, seed: number): number[] {
  const rng = new Rng(seed >>> 0);
  const free = Array.from({ length: variant.symbols }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < variant.pegs; i++) {
    if (variant.repeats) out.push(rng.int(variant.symbols));
    else out.push(free.splice(rng.int(free.length), 1)[0]!);
  }
  return out;
}

export function newCodeBreaker(variant: string, seed: number, secret?: number[]): CodeBreakerState {
  const v = VARIANTS[variant] ?? VARIANTS.classic!;
  const name = VARIANTS[variant] ? variant : 'classic';
  return {
    variant: name,
    seed: seed >>> 0,
    setter: secret ? 'player' : 'computer',
    secret: secret ? [...secret] : secretFor(v, seed),
    guesses: [],
    status: 'playing',
    hints: 0,
    elapsedMs: 0,
  };
}

export const variantOf = (s: { variant: string }) => VARIANTS[s.variant] ?? VARIANTS.classic!;

export function makeGuess(s: CodeBreakerState, code: number[]): CodeBreakerState {
  const v = variantOf(s);
  if (s.status !== 'playing' || !isCode(v, code)) return s;
  const [exact, near] = score(s.secret, code);
  const guesses = [...s.guesses, { code: [...code], exact, near }];
  const status = exact === v.pegs ? 'won' : guesses.length >= v.maxGuesses ? 'lost' : 'playing';
  return { ...s, guesses, status };
}

export function isValidCodeBreakerState(d: unknown): d is CodeBreakerState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as CodeBreakerState;
  const v = VARIANTS[s.variant];
  if (!v || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (s.setter !== 'computer' && s.setter !== 'player') return false;
  if (!isCode(v, s.secret)) return false;
  if (s.setter === 'computer' && secretFor(v, s.seed).join() !== s.secret.join()) return false;
  if (!Number.isInteger(s.hints) || s.hints < 0) return false;
  if (typeof s.elapsedMs !== 'number' || !(s.elapsedMs >= 0)) return false;
  if (!Array.isArray(s.guesses) || s.guesses.length > v.maxGuesses) return false;
  let replay = newCodeBreaker(s.variant, s.seed, s.secret);
  for (const g of s.guesses) {
    if (replay.status !== 'playing' || typeof g !== 'object' || g === null) return false;
    if (!isCode(v, g.code)) return false;
    replay = makeGuess(replay, g.code);
    const last = replay.guesses[replay.guesses.length - 1]!;
    if (last.exact !== g.exact || last.near !== g.near) return false;
  }
  return replay.status === s.status;
}
