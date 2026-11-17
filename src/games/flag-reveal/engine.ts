/**
 * Pure rules for #211 Flag Reveal (ruleset `flag-reveal-6`): a flag hides behind six tiles. Name
 * its country in six guesses; each wrong guess lifts one tile (in a seeded order) and shows how far
 * away, in which direction and how close the guess is. The whole flag shows at the end.
 */
import { Rng } from '../../core/game-engine/random';
import { clue } from '../shared/world/clues';
import { COUNTRIES } from '../shared/world/world';

export const MAX_GUESSES = 6;
export const TILES = 6;
export const EPOCH = Date.UTC(2026, 0, 1);

/** Every sovereign state's flag can be the answer (dependent territories excluded). */
export const TARGETS: readonly string[] = COUNTRIES.filter(
  (c) => !['GL', 'PR', 'EH'].includes(c.iso2),
).map((c) => c.iso2);
export const GUESSABLE = new Set(COUNTRIES.map((c) => c.iso2));

export interface FlagState {
  target: string;
  gameNo: number | null;
  /** Tile indices (0–5, 3 columns × 2 rows) in reveal order. */
  order: number[];
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
}

export { clue };

export function gameNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}

export function dailyTarget(gameNo: number): string {
  const order = new Rng(20260211).shuffle(TARGETS);
  return order[((gameNo % order.length) + order.length) % order.length]!;
}

export function newGame(target: string, gameNo: number | null, seed: number): FlagState {
  return {
    target,
    gameNo,
    order: new Rng(seed >>> 0).shuffle([0, 1, 2, 3, 4, 5]),
    guesses: [],
    status: 'playing',
  };
}

export const randomGame = (seed: number) => newGame(new Rng(seed >>> 0).pick(TARGETS), null, seed);

/** Tiles currently lifted: one per wrong guess, all once the round is over. */
export function revealed(s: FlagState): Set<number> {
  if (s.status !== 'playing') return new Set([0, 1, 2, 3, 4, 5]);
  return new Set(s.order.slice(0, s.guesses.length));
}

export function guess(s: FlagState, iso2: string): FlagState {
  if (s.status !== 'playing' || !GUESSABLE.has(iso2) || s.guesses.includes(iso2)) return s;
  const guesses = [...s.guesses, iso2];
  return {
    ...s,
    guesses,
    status: iso2 === s.target ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing',
  };
}

export function share(s: FlagState, label: string): string {
  const rows = s.guesses.map((g) => {
    const c = clue(g, s.target);
    return `${c.arrow} ${c.proximity}%`;
  });
  const head = `${label}${s.gameNo !== null ? ` #${s.gameNo + 1}` : ''} ${s.status === 'won' ? s.guesses.length : 'X'}/${MAX_GUESSES}`;
  const tiles = Array.from({ length: TILES }, (_, i) =>
    s.order.indexOf(i) < s.guesses.length - (s.status === 'won' ? 1 : 0) ? '🟥' : '🟦',
  );
  return [head, tiles.slice(0, 3).join(''), tiles.slice(3).join(''), ...rows].join('\n');
}

export function isValidState(v: unknown): v is FlagState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as FlagState;
  return (
    typeof s.target === 'string' &&
    GUESSABLE.has(s.target) &&
    Array.isArray(s.order) &&
    s.order.length === TILES &&
    Array.isArray(s.guesses) &&
    s.guesses.every((g) => GUESSABLE.has(g)) &&
    ['playing', 'won', 'lost'].includes(s.status)
  );
}
