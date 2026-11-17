/**
 * Pure rules for #209 Country Shape (ruleset `country-shape-6`): name the country from its
 * silhouette in six guesses. Each wrong guess shows the distance between the two countries'
 * centroids, a compass arrow towards the target and a proximity percentage. After the round,
 * two bonus questions: the capital and the flag, each from four options.
 */
import { Rng } from '../../core/game-engine/random';
import { COUNTRIES, arrowFor, bearing, centroidKm, centroidOf } from '../shared/world/world';

export const MAX_GUESSES = 6;
export const MAX_DISTANCE = 20000;
export const EPOCH = Date.UTC(2026, 0, 1);

/** Targets: countries large enough to recognise (1,000 km² or more), excluding non-sovereign shapes. */
export const TARGETS: readonly string[] = COUNTRIES.filter(
  (c) => c.area >= 1000 && !['GL', 'PR', 'EH'].includes(c.iso2),
).map((c) => c.iso2);
export const GUESSABLE = new Set(COUNTRIES.map((c) => c.iso2));

export type BonusResult = 'pending' | 'right' | 'wrong';

export interface ShapeState {
  target: string;
  gameNo: number | null;
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  capitalOptions: string[];
  flagOptions: string[];
  capital: BonusResult;
  flag: BonusResult;
}

export interface Clue {
  iso2: string;
  km: number;
  /** Degrees clockwise from north, from the guess towards the target. */
  bearing: number;
  arrow: string;
  proximity: number;
}

export function clue(guess: string, target: string): Clue {
  const km = centroidKm(guess, target);
  const deg = guess === target ? 0 : bearing(centroidOf(guess), centroidOf(target));
  return {
    iso2: guess,
    km,
    bearing: deg,
    arrow: guess === target ? '🎉' : arrowFor(deg),
    proximity: guess === target ? 100 : Math.max(0, Math.floor((1 - km / MAX_DISTANCE) * 100)),
  };
}

export function gameNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}

export function dailyTarget(gameNo: number): string {
  const order = new Rng(20260209).shuffle(TARGETS);
  return order[((gameNo % order.length) + order.length) % order.length]!;
}

/** Four options including the target: its nearest other countries make good decoys. */
function options(target: string, rng: Rng): string[] {
  const near = TARGETS.filter((c) => c !== target)
    .sort((a, b) => centroidKm(a, target) - centroidKm(b, target))
    .slice(0, 8);
  return rng.shuffle([target, ...rng.shuffle(near).slice(0, 3)]);
}

export function newGame(target: string, gameNo: number | null, seed: number): ShapeState {
  const rng = new Rng(seed >>> 0);
  return {
    target,
    gameNo,
    guesses: [],
    status: 'playing',
    capitalOptions: options(target, rng),
    flagOptions: options(target, rng),
    capital: 'pending',
    flag: 'pending',
  };
}

export function randomGame(seed: number): ShapeState {
  return newGame(new Rng(seed >>> 0).pick(TARGETS), null, seed);
}

export function guess(s: ShapeState, iso2: string): ShapeState {
  if (s.status !== 'playing' || !GUESSABLE.has(iso2) || s.guesses.includes(iso2)) return s;
  const guesses = [...s.guesses, iso2];
  const status = iso2 === s.target ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
  return { ...s, guesses, status };
}

export function answerBonus(s: ShapeState, kind: 'capital' | 'flag', iso2: string): ShapeState {
  if (s.status === 'playing' || s[kind] !== 'pending') return s;
  return { ...s, [kind]: iso2 === s.target ? 'right' : 'wrong' };
}

export function share(s: ShapeState, label: string): string {
  const rows = s.guesses.map((g) => {
    const c = clue(g, s.target);
    const full = Math.floor(c.proximity / 20);
    const half = c.proximity % 20 >= 10 ? 1 : 0;
    return `${'🟩'.repeat(full)}${'🟨'.repeat(half)}${'⬜'.repeat(5 - full - half)}${c.arrow}`;
  });
  const best = Math.max(0, ...s.guesses.map((g) => clue(g, s.target).proximity));
  const head = `${label}${s.gameNo !== null ? ` #${s.gameNo + 1}` : ''} ${s.status === 'won' ? s.guesses.length : 'X'}/${MAX_GUESSES} (${best}%)`;
  const stars = `${s.capital === 'right' ? '⭐' : ''}${s.flag === 'right' ? '⭐' : ''}`;
  return [head, ...rows, stars].filter(Boolean).join('\n');
}

export function isValidState(v: unknown): v is ShapeState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as ShapeState;
  return (
    typeof s.target === 'string' &&
    GUESSABLE.has(s.target) &&
    Array.isArray(s.guesses) &&
    s.guesses.every((g) => GUESSABLE.has(g)) &&
    Array.isArray(s.capitalOptions) &&
    Array.isArray(s.flagOptions) &&
    ['playing', 'won', 'lost'].includes(s.status)
  );
}
