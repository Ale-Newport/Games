/**
 * Pure rules for #217 Syllable Bomb (ruleset `syllable-bomb-classic`): players sit round a bomb
 * with a hidden fuse. The holder must type a dictionary word containing the prompt letters that
 * nobody has used yet; a valid word passes the bomb (with a new prompt) to the next player. The
 * fuse keeps burning across passes; whoever holds the bomb when it explodes loses a life, and a new
 * bomb starts with the next player. Using every bonus letter in your words earns a life back.
 * The last player standing wins.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { PROMPTS } from './prompts';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
/** The bonus alphabet (no K, W, X, Y, Z). */
export const BONUS_LETTERS = 'abcdefghijlmnopqrstuv';
export const START_LIVES = 2;
export const MAX_LIVES = 3;
export const FUSE_MIN = 10;
export const FUSE_MAX = 30;

export interface Player {
  name: string;
  bot: boolean;
  lives: number;
  letters: string;
  /** Bots: seconds to think, typing speed (chars/s) and how wide their vocabulary is (0–1). */
  skill?: { think: number; cps: number; breadth: number };
}

export interface BombState {
  players: Player[];
  holder: number;
  prompt: string;
  used: string[];
  /** Seconds left on the hidden fuse. */
  fuse: number;
  difficulty: Difficulty;
  turns: number;
  rng: RngState;
  status: 'playing' | 'over';
  winner: number | null;
  /** Last event, for the interface. */
  event:
    | { kind: 'word'; player: number; word: string; life: boolean }
    | { kind: 'boom'; player: number }
    | null;
}

export type WordProblem = 'too-short' | 'missing-prompt' | 'used' | 'unknown' | null;

export function pickPrompt(difficulty: Difficulty, turns: number, rng: Rng): string {
  const tier: 'easy' | 'medium' | 'hard' =
    difficulty === 'mixed'
      ? turns < 8
        ? 'easy'
        : turns < 24
          ? 'medium'
          : rng.chance(0.5)
            ? 'medium'
            : 'hard'
      : difficulty;
  return rng.pick(PROMPTS[tier])[0];
}

export function newGame(
  names: { name: string; bot: boolean; skill?: Player['skill'] }[],
  difficulty: Difficulty,
  seed: number,
): BombState {
  const rng = new Rng(seed >>> 0);
  const players = names.map((p) => ({ ...p, lives: START_LIVES, letters: '' }));
  const holder = rng.int(players.length);
  return {
    players,
    holder,
    prompt: pickPrompt(difficulty, 0, rng),
    used: [],
    fuse: FUSE_MIN + rng.float() * (FUSE_MAX - FUSE_MIN),
    difficulty,
    turns: 0,
    rng: rng.state,
    status: 'playing',
    winner: null,
    event: null,
  };
}

export const alive = (s: BombState) => s.players.flatMap((p, i) => (p.lives > 0 ? [i] : []));

function nextAlive(s: BombState, from: number): number {
  for (let k = 1; k <= s.players.length; k++) {
    const i = (from + k) % s.players.length;
    if (s.players[i]!.lives > 0) return i;
  }
  return from;
}

export function wordProblem(
  s: BombState,
  text: string,
  isWord: (w: string) => boolean,
): WordProblem {
  const w = text.trim().toLowerCase();
  if (w.length < 3) return 'too-short';
  if (!w.includes(s.prompt)) return 'missing-prompt';
  if (s.used.includes(w)) return 'used';
  if (!isWord(w)) return 'unknown';
  return null;
}

/** The holder plays a word (already checked). The bomb passes with a new prompt. */
export function playWord(s: BombState, text: string): BombState {
  const w = text.trim().toLowerCase();
  const rng = Rng.from(s.rng);
  const p = s.players[s.holder]!;
  let letters = [...new Set([...p.letters, ...w])]
    .filter((c) => BONUS_LETTERS.includes(c))
    .sort()
    .join('');
  let lives = p.lives;
  let life = false;
  if (letters.length === BONUS_LETTERS.length) {
    letters = '';
    if (lives < MAX_LIVES) {
      lives++;
      life = true;
    }
  }
  const players = s.players.map((q, i) => (i === s.holder ? { ...q, letters, lives } : q));
  const next = { ...s, players };
  return {
    ...next,
    used: [...s.used, w],
    holder: nextAlive(next, s.holder),
    prompt: pickPrompt(s.difficulty, s.turns + 1, rng),
    turns: s.turns + 1,
    rng: rng.state,
    event: { kind: 'word', player: s.holder, word: w, life },
  };
}

/** Burns the fuse; when it runs out the holder loses a life and a new bomb starts. */
export function burn(s: BombState, seconds: number): BombState {
  if (s.status !== 'playing') return s;
  const fuse = s.fuse - seconds;
  if (fuse > 0) return { ...s, fuse };
  const rng = Rng.from(s.rng);
  const players = s.players.map((p, i) => (i === s.holder ? { ...p, lives: p.lives - 1 } : p));
  const next: BombState = { ...s, players, event: { kind: 'boom', player: s.holder } };
  const left = alive(next);
  if (left.length <= 1) return { ...next, fuse: 0, status: 'over', winner: left[0] ?? null };
  return {
    ...next,
    holder: nextAlive(next, s.holder),
    prompt: pickPrompt(s.difficulty, s.turns, rng),
    fuse: FUSE_MIN + rng.float() * (FUSE_MAX - FUSE_MIN),
    rng: rng.state,
  };
}

export function isValidState(v: unknown): v is BombState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as BombState;
  return (
    Array.isArray(s.players) &&
    typeof s.holder === 'number' &&
    typeof s.prompt === 'string' &&
    Array.isArray(s.used) &&
    (s.status === 'playing' || s.status === 'over')
  );
}
