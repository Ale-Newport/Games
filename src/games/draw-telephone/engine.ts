/**
 * Pure rules for #214 Draw Telephone (ruleset `draw-telephone-classic`): every player writes a
 * starting sentence; the sentences then travel along a chain, each player in turn drawing the
 * sentence they received or describing the drawing they received, without seeing earlier steps.
 * After as many steps as players, each chain's album is revealed from first sentence to last.
 */
import type { Stroke } from '../shared/doodle/doodle';

export interface Player {
  name: string;
  bot: boolean;
}

export type Entry =
  { kind: 'text'; text: string; by: number } | { kind: 'drawing'; strokes: Stroke[]; by: number };

export interface TelephoneState {
  lang: 'en' | 'es';
  players: Player[];
  /** chains[c][k]: the k-th entry of chain c (chain c starts with player c's sentence). */
  chains: Entry[][];
  /** Current step: 0 = write, odd = draw, even > 0 = describe. */
  step: number;
  /** Players who have handed in this step. */
  done: number[];
  /** Seconds per step (drawing steps get this; writing steps half). */
  seconds: number;
  status: 'playing' | 'album';
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;

export function newGame(lang: 'en' | 'es', players: Player[], seconds = 90): TelephoneState {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) throw new Error('3–8 players');
  return {
    lang,
    players,
    chains: players.map(() => []),
    step: 0,
    done: [],
    seconds,
    status: 'playing',
  };
}

export const steps = (s: TelephoneState) => s.players.length;
export const stepKind = (step: number): 'write' | 'draw' | 'describe' =>
  step === 0 ? 'write' : step % 2 === 1 ? 'draw' : 'describe';

/** The chain a player works on at a step (each step passes chains one seat to the left). */
export const chainFor = (s: TelephoneState, player: number, step = s.step) =>
  (player - step + s.players.length * 4) % s.players.length;

/** What a player receives this step: the previous entry of their chain (nothing when writing). */
export function received(s: TelephoneState, player: number): Entry | null {
  if (s.step === 0) return null;
  return s.chains[chainFor(s, player)]![s.step - 1] ?? null;
}

/** A player hands in their entry; when everyone has, the step advances (or the album opens). */
export function handIn(s: TelephoneState, player: number, entry: Entry): TelephoneState {
  if (s.status !== 'playing' || s.done.includes(player)) return s;
  const kind = stepKind(s.step);
  if ((kind === 'draw') !== (entry.kind === 'drawing')) throw new Error('Wrong kind of entry');
  const c = chainFor(s, player);
  const chains = s.chains.map((ch, i) => (i === c ? [...ch, { ...entry, by: player }] : ch));
  const done = [...s.done, player];
  if (done.length < s.players.length) return { ...s, chains, done };
  const step = s.step + 1;
  return { ...s, chains, done: [], step, status: step >= steps(s) ? 'album' : 'playing' };
}

/** Clean up a typed sentence (trimmed, single spaces, at most 80 characters, never empty). */
export function cleanText(text: string, fallback: string): string {
  const t = text.replace(/\s+/g, ' ').trim().slice(0, 80);
  return t || fallback;
}

export function isValidState(v: unknown): v is TelephoneState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as TelephoneState;
  return (
    (s.lang === 'en' || s.lang === 'es') &&
    Array.isArray(s.players) &&
    s.players.length >= MIN_PLAYERS &&
    Array.isArray(s.chains) &&
    s.chains.length === s.players.length &&
    typeof s.step === 'number' &&
    Array.isArray(s.done) &&
    (s.status === 'playing' || s.status === 'album')
  );
}
