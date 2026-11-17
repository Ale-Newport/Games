/**
 * Pure rules for #215 Code Words (ruleset `code-words-5x5`): two teams, red and blue, race to
 * find their secret agents among 25 code words. Each turn the team's spymaster, who sees the key,
 * gives a one-word clue and a number; the operatives then touch words one at a time. Their own
 * agent: keep going (up to number + 1 guesses); a bystander or an enemy agent: the turn ends;
 * the assassin: the team loses at once. The first team to reveal all its agents wins.
 */
import { Rng } from '../../core/game-engine/random';
import { CLASSES } from '../shared/doodle/doodle';
import { SECRETS } from '../word-rank/secrets';

export type Team = 'red' | 'blue';
export type Role = Team | 'bystander' | 'assassin';

/** Code words: the project's own concrete nouns (single English words, all in the vector vocabulary). */
export const WORD_POOL: readonly string[] = [
  ...new Set([...SECRETS, ...CLASSES.filter((c) => !c.includes(' '))]),
].sort();

export interface Clue {
  team: Team;
  word: string;
  number: number;
}

export interface CodeState {
  words: string[];
  roles: Role[];
  revealed: boolean[];
  starter: Team;
  turn: Team;
  phase: 'clue' | 'guess';
  clue: Clue | null;
  guessesLeft: number;
  guessedThisTurn: number;
  log: (
    | { kind: 'clue'; clue: Clue }
    | { kind: 'guess'; team: Team; index: number }
    | { kind: 'pass'; team: Team }
  )[];
  status: 'playing' | 'over';
  winner: Team | null;
  /** How the game ended. */
  reason: 'agents' | 'assassin' | null;
}

export const other = (t: Team): Team => (t === 'red' ? 'blue' : 'red');

export function newGame(seed: number): CodeState {
  const rng = new Rng(seed >>> 0);
  const words = rng.shuffle(WORD_POOL).slice(0, 25);
  const starter: Team = rng.chance(0.5) ? 'red' : 'blue';
  const roles = rng.shuffle<Role>([
    ...Array<Role>(9).fill(starter),
    ...Array<Role>(8).fill(other(starter)),
    ...Array<Role>(7).fill('bystander'),
    'assassin',
  ]);
  return {
    words,
    roles,
    revealed: words.map(() => false),
    starter,
    turn: starter,
    phase: 'clue',
    clue: null,
    guessesLeft: 0,
    guessedThisTurn: 0,
    log: [],
    status: 'playing',
    winner: null,
    reason: null,
  };
}

export const remaining = (s: CodeState, team: Team) =>
  s.roles.filter((r, i) => r === team && !s.revealed[i]).length;

export type ClueProblem = 'not-a-word' | 'on-board' | 'number' | null;

/** A clue must be one word made of letters, not a board word or part of one, number 1–9. */
export function clueProblem(
  s: CodeState,
  word: string,
  number: number,
  isWord: (w: string) => boolean,
): ClueProblem {
  const w = word.trim().toLowerCase();
  if (!/^[a-z]{2,}$/.test(w) || !isWord(w)) return 'not-a-word';
  if (s.words.some((b, i) => !s.revealed[i] && (b === w || b.includes(w) || w.includes(b))))
    return 'on-board';
  if (!Number.isInteger(number) || number < 1 || number > 9) return 'number';
  return null;
}

export function giveClue(s: CodeState, word: string, number: number): CodeState {
  if (s.status !== 'playing' || s.phase !== 'clue') return s;
  const clue = { team: s.turn, word: word.trim().toLowerCase(), number };
  return {
    ...s,
    phase: 'guess',
    clue,
    guessesLeft: number + 1,
    guessedThisTurn: 0,
    log: [...s.log, { kind: 'clue', clue }],
  };
}

function endTurn(s: CodeState): CodeState {
  return {
    ...s,
    turn: other(s.turn),
    phase: 'clue',
    clue: null,
    guessesLeft: 0,
    guessedThisTurn: 0,
  };
}

/** An operative touches a word. */
export function guess(s: CodeState, index: number): CodeState {
  if (
    s.status !== 'playing' ||
    s.phase !== 'guess' ||
    s.revealed[index] ||
    index < 0 ||
    index >= 25
  )
    return s;
  const revealed = s.revealed.map((r, i) => r || i === index);
  const role = s.roles[index]!;
  const team = s.turn;
  let next: CodeState = {
    ...s,
    revealed,
    log: [...s.log, { kind: 'guess', team, index }],
    guessedThisTurn: s.guessedThisTurn + 1,
  };
  if (role === 'assassin')
    return { ...next, status: 'over', winner: other(team), reason: 'assassin' };
  for (const t of ['red', 'blue'] as Team[])
    if (remaining(next, t) === 0) return { ...next, status: 'over', winner: t, reason: 'agents' };
  if (role !== team) return endTurn(next);
  next = { ...next, guessesLeft: s.guessesLeft - 1 };
  return next.guessesLeft <= 0 ? endTurn(next) : next;
}

/** Operatives may stop after at least one guess. */
export function pass(s: CodeState): CodeState {
  if (s.status !== 'playing' || s.phase !== 'guess' || s.guessedThisTurn === 0) return s;
  return endTurn({ ...s, log: [...s.log, { kind: 'pass', team: s.turn }] });
}

export function isValidState(v: unknown): v is CodeState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as CodeState;
  return (
    Array.isArray(s.words) &&
    s.words.length === 25 &&
    Array.isArray(s.roles) &&
    s.roles.length === 25 &&
    Array.isArray(s.revealed) &&
    (s.turn === 'red' || s.turn === 'blue') &&
    (s.phase === 'clue' || s.phase === 'guess') &&
    Array.isArray(s.log) &&
    (s.status === 'playing' || s.status === 'over')
  );
}
