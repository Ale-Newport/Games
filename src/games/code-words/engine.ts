/**
 * Pure rules for #215 Code Words (ruleset `code-words-5x5`): two teams, red and blue, race to
 * find their secret agents among 25 code words. Each turn the team's spymaster, who sees the key,
 * gives a one-word clue and a number; the operatives then touch words one at a time. Their own
 * agent: keep going (up to number + 1 guesses); a bystander or an enemy agent: the turn ends;
 * the assassin: the team loses at once. The first team to reveal all its agents wins.
 * Boards and clues are in English or Spanish (`lang`), each with its own word pool.
 */
import { Rng } from '../../core/game-engine/random';
import { CLASSES } from '../shared/doodle/doodle';
import { CLASS_NAMES } from '../shared/doodle/words';
import { fold, type SemanticLang } from '../shared/semantic/semantic';
import { SECRETS, SECRETS_ES } from '../word-rank/secrets';

export type Team = 'red' | 'blue';
export type Role = Team | 'bystander' | 'assassin';

/** Code words: the project's own concrete nouns (single English words, all in the vector vocabulary). */
export const WORD_POOL: readonly string[] = [
  ...new Set([...SECRETS, ...CLASSES.filter((c) => !c.includes(' '))]),
].sort();

/** Spanish code words: the Spanish concrete nouns plus the doodle classes' one-word names. */
export const WORD_POOL_ES: readonly string[] = [
  ...new Set([
    ...SECRETS_ES,
    ...Object.values(CLASS_NAMES)
      .map((names) => names.split('|')[1]?.split('/')[0] ?? '')
      .filter((w) => /^[a-záéíóúüñ]{3,}$/.test(w)),
  ]),
].sort((a, b) => a.localeCompare(b, 'es'));

export const wordPoolFor = (lang: SemanticLang) => (lang === 'es' ? WORD_POOL_ES : WORD_POOL);

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
  /** Board language; saves from before Spanish existed have none and are English. */
  lang?: SemanticLang;
}

export const langOf = (s: CodeState): SemanticLang => s.lang ?? 'en';

export const other = (t: Team): Team => (t === 'red' ? 'blue' : 'red');

export function newGame(seed: number, lang: SemanticLang = 'en'): CodeState {
  const rng = new Rng(seed >>> 0);
  const words = rng.shuffle(wordPoolFor(lang)).slice(0, 25);
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
    lang,
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
  const lang = langOf(s);
  const w = word.trim().toLowerCase();
  const letters = lang === 'es' ? /^[a-záéíóúüñ]{2,}$/ : /^[a-z]{2,}$/;
  if (!letters.test(w) || !isWord(w)) return 'not-a-word';
  // Compared without accents: "arbol" may not hint at "árbol".
  const k = fold(w, lang);
  if (
    s.words.some((b, i) => {
      const f = fold(b, lang);
      return !s.revealed[i] && (f === k || f.includes(k) || k.includes(f));
    })
  )
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
  if (s.lang !== undefined && s.lang !== 'en' && s.lang !== 'es') return false;
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
