/**
 * Pure rules for #212 Hot & Cold Globe (ruleset `globe-hot-cold`): find the mystery country on a
 * globe with unlimited guesses. Each guess is coloured by how close its border is to the mystery
 * country's border — white when far, deep red when touching — and listed from closest to farthest.
 */
import { Rng } from '../../core/game-engine/random';
import { COUNTRIES, borderKm } from '../shared/world/world';

export const EPOCH = Date.UTC(2026, 0, 1);
export const TARGETS: readonly string[] = COUNTRIES.filter(
  (c) => !['GL', 'PR', 'EH'].includes(c.iso2),
).map((c) => c.iso2);
export const GUESSABLE = new Set(COUNTRIES.map((c) => c.iso2));

export interface GlobeState {
  target: string;
  gameNo: number | null;
  guesses: string[];
  status: 'playing' | 'won' | 'gave-up';
}

export function gameNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}

export function dailyTarget(gameNo: number): string {
  const order = new Rng(20260212).shuffle(TARGETS);
  return order[((gameNo % order.length) + order.length) % order.length]!;
}

export const newGame = (target: string, gameNo: number | null = null): GlobeState => ({
  target,
  gameNo,
  guesses: [],
  status: 'playing',
});
export const randomGame = (seed: number) => newGame(new Rng(seed >>> 0).pick(TARGETS));

export function guess(s: GlobeState, iso2: string): GlobeState {
  if (s.status !== 'playing' || !GUESSABLE.has(iso2) || s.guesses.includes(iso2)) return s;
  return { ...s, guesses: [...s.guesses, iso2], status: iso2 === s.target ? 'won' : 'playing' };
}

export const giveUp = (s: GlobeState): GlobeState =>
  s.status === 'playing' ? { ...s, status: 'gave-up' } : s;

/** Border distance from a guess to the target, km (0 when they touch or it is the target). */
export const distanceOf = (s: GlobeState, iso2: string) => borderKm(iso2, s.target);

/** Guesses sorted closest first. */
export function ranked(s: GlobeState): { iso2: string; km: number }[] {
  return s.guesses.map((g) => ({ iso2: g, km: distanceOf(s, g) })).sort((a, b) => a.km - b.km);
}

/** Heat colour: deep red when touching, through orange and yellow, to near-white past 5,000 km. */
export function heat(km: number, target = false): string {
  if (target) return '#3ddc84';
  const t = Math.min(1, km / 5000);
  const stops: [number, [number, number, number]][] = [
    [0, [140, 18, 18]],
    [0.12, [214, 48, 32]],
    [0.35, [244, 128, 54]],
    [0.6, [250, 200, 110]],
    [1, [255, 244, 222]],
  ];
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]!;
    const [t0, c0] = stops[i - 1]!;
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      const c = c0.map((v, k) => Math.round(v + (c1[k]! - v) * f));
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
  }
  return 'rgb(255, 244, 222)';
}

export function share(s: GlobeState, label: string): string {
  const emoji = (km: number) => (km === 0 ? '🟥' : km < 1000 ? '🟧' : km < 3000 ? '🟨' : '⬜');
  const line = s.guesses.map((g) => (g === s.target ? '🌎' : emoji(distanceOf(s, g)))).join('');
  return `${label}${s.gameNo !== null ? ` #${s.gameNo + 1}` : ''} ${s.status === 'won' ? s.guesses.length : 'X'}\n${line}`;
}

export function isValidState(v: unknown): v is GlobeState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as GlobeState;
  return (
    typeof s.target === 'string' &&
    GUESSABLE.has(s.target) &&
    Array.isArray(s.guesses) &&
    s.guesses.every((g) => GUESSABLE.has(g)) &&
    ['playing', 'won', 'gave-up'].includes(s.status)
  );
}
