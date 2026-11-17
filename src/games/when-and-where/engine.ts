/**
 * When & Where rules: five scenes per game. For each, drop a pin on the world map and pick a
 * year; each guess scores up to 5,000 for the place (falling with distance) and 5,000 for the year
 * (falling with the years off), so a game is out of 50,000. An optional clock limits each round;
 * running out of time scores what was entered (nothing for a missing pin).
 */
import { Rng } from '../../core/game-engine/random';
import { BY_SCENE, SCENES, YEAR_MAX, YEAR_MIN } from './scenes';

export const ROUNDS = 5;
export const MAX_PART = 5000;

export interface Guess {
  lat: number | null;
  lon: number | null;
  year: number;
}

export interface RoundResult {
  scene: string;
  guess: Guess;
  km: number | null;
  place: number;
  when: number;
}

export interface Play {
  seed: number;
  scenes: string[];
  results: RoundResult[];
  /** Seconds per round, or 0 for no limit. */
  limit: number;
}

export function newPlay(seed: number, limit: number): Play {
  const scenes = new Rng(seed >>> 0).shuffle(SCENES.map((s) => s.id)).slice(0, ROUNDS);
  return { seed, scenes, results: [], limit };
}

export const currentScene = (p: Play) =>
  p.results.length < ROUNDS ? BY_SCENE.get(p.scenes[p.results.length]!)! : null;
export const finished = (p: Play) => p.results.length >= ROUNDS;
export const total = (p: Play) => p.results.reduce((a, r) => a + r.place + r.when, 0);

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** 5,000 within 25 km, then halving roughly every 1,000 km. */
export function placeScore(km: number): number {
  if (km <= 25) return MAX_PART;
  return Math.round(MAX_PART * Math.exp(-(km - 25) / 1450));
}

/** 5,000 for the exact year, then falling: about 3,000 at 5 years off, 1,000 at 18. */
export function yearScore(off: number): number {
  return Math.round(MAX_PART * Math.exp(-Math.abs(off) / 11));
}

export function submit(p: Play, g: Guess): Play {
  const s = currentScene(p);
  if (!s) return p;
  const year = Math.max(YEAR_MIN, Math.min(YEAR_MAX, Math.round(g.year)));
  const km = g.lat === null || g.lon === null ? null : haversineKm(g.lat, g.lon, s.lat, s.lon);
  const place = km === null ? 0 : placeScore(km);
  const when = yearScore(year - s.year);
  return { ...p, results: [...p.results, { scene: s.id, guess: { ...g, year }, km, place, when }] };
}

export function isPlay(v: unknown): v is Play {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Play;
  return (
    Array.isArray(p.scenes) &&
    p.scenes.length === ROUNDS &&
    p.scenes.every((id) => BY_SCENE.has(id)) &&
    Array.isArray(p.results) &&
    typeof p.limit === 'number'
  );
}
