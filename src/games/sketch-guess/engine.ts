/**
 * Pure rules for #213 Sketch & Guess (ruleset `sketch-guess-classic`): players take turns drawing
 * a word chosen from three; the others type guesses while the clock runs. The word shows as blanks
 * and letters are revealed as hints over time. Earlier correct guesses score more; the drawer scores
 * for every player who gets it. After every player has drawn once per round for R rounds, the
 * highest total wins.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { editDistance } from '../shared/survey/engine';
import { CLASS_NAMES } from '../shared/doodle/words';

export type Lang = 'en' | 'es';
export const WORDS: readonly string[] = Object.keys(CLASS_NAMES);
export const DRAW_TIMES = [60, 80, 120] as const;
export const ROUNDS = [2, 3, 4] as const;
export const MAX_BOTS = 7;

export function names(word: string, lang: Lang): string[] {
  const [en = '', es = ''] = CLASS_NAMES[word]!.split('|');
  return (lang === 'en' ? en : es).split('/');
}
export const displayWord = (word: string, lang: Lang) => names(word, lang)[0]!;

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '');

export type GuessResult = 'correct' | 'close' | 'wrong';

/** A typed guess is correct if it matches a name of the word (either language), close if one edit away. */
export function judge(word: string, text: string, lang: Lang): GuessResult {
  const key = fold(text);
  if (!key) return 'wrong';
  const all = [...names(word, lang), ...names(word, lang === 'en' ? 'es' : 'en')].map(fold);
  if (all.includes(key)) return 'correct';
  return names(word, lang).some((n) => fold(n).length >= 4 && editDistance(fold(n), key, 1) === 1)
    ? 'close'
    : 'wrong';
}

/** Letters shown at a given fraction of the turn: none until 40%, then one more each 20% of the clock. */
export function revealedCount(word: string, lang: Lang, elapsed: number): number {
  const letters = displayWord(word, lang).replace(/\s/g, '').length;
  const max = Math.max(0, Math.floor(letters / 2) - 0);
  if (elapsed < 0.4) return 0;
  return Math.min(max, 1 + Math.floor((elapsed - 0.4) / 0.2));
}

/** The hint line: blanks with some letters shown (positions chosen by the seed). */
export function hintLine(word: string, lang: Lang, shown: number, seed: number): string {
  const w = displayWord(word, lang);
  const slots = [...w].flatMap((ch, i) => (ch === ' ' ? [] : [i]));
  const open = new Set(new Rng(seed >>> 0).shuffle(slots).slice(0, shown));
  return [...w]
    .map((ch, i) => (ch === ' ' ? '  ' : open.has(i) ? ch.toUpperCase() : '_'))
    .join(' ');
}

export interface Player {
  name: string;
  bot: boolean;
  /** Bot skill: confidence it needs before guessing, and typing delay (s). */
  skill?: { threshold: number; delay: number };
  score: number;
}

export interface TurnState {
  drawer: number;
  options: string[];
  word: string | null;
  /** Seconds elapsed in the drawing phase. */
  elapsed: number;
  /** Players who guessed, in order, with the time they did. */
  guessed: { player: number; at: number }[];
  /** Points earned this turn. */
  earned: number[];
  done: boolean;
}

export interface SketchState {
  lang: Lang;
  seconds: (typeof DRAW_TIMES)[number];
  rounds: (typeof ROUNDS)[number];
  players: Player[];
  round: number;
  turnIndex: number;
  turn: TurnState;
  rng: RngState;
  used: string[];
  status: 'playing' | 'over';
}

const BOT_NAMES = ['Pixel', 'Doodle', 'Inky', 'Scribbles', 'Crayon', 'Sketchy', 'Marker'];

export function newGame(o: {
  lang: Lang;
  seconds: SketchState['seconds'];
  rounds: SketchState['rounds'];
  bots: number;
  humanName: string;
  seed: number;
}): SketchState {
  const rng = new Rng(o.seed >>> 0);
  const bots = Math.max(1, Math.min(MAX_BOTS, o.bots));
  const players: Player[] = [
    { name: o.humanName || 'You', bot: false, score: 0 },
    ...Array.from({ length: bots }, (_, i) => ({
      name: BOT_NAMES[i]!,
      bot: true,
      skill: { threshold: 0.35 + rng.float() * 0.35, delay: 1 + rng.float() * 3 },
      score: 0,
    })),
  ];
  const base: SketchState = {
    lang: o.lang,
    seconds: o.seconds,
    rounds: o.rounds,
    players,
    round: 1,
    turnIndex: 0,
    turn: {
      drawer: 0,
      options: [],
      word: null,
      elapsed: 0,
      guessed: [],
      earned: players.map(() => 0),
      done: false,
    },
    rng: rng.state,
    used: [],
    status: 'playing',
  };
  return startTurn(base, 0);
}

function startTurn(s: SketchState, drawer: number): SketchState {
  const rng = Rng.from(s.rng);
  const fresh = WORDS.filter((w) => !s.used.includes(w));
  const options = rng.shuffle(fresh.length >= 3 ? fresh : WORDS).slice(0, 3);
  return {
    ...s,
    rng: rng.state,
    turn: {
      drawer,
      options,
      word: null,
      elapsed: 0,
      guessed: [],
      earned: s.players.map(() => 0),
      done: false,
    },
  };
}

export function chooseWord(s: SketchState, word: string): SketchState {
  if (s.turn.word || !s.turn.options.includes(word)) return s;
  return { ...s, turn: { ...s.turn, word }, used: [...s.used, word] };
}

/** Guesser points: up to 400 for an instant guess, at least 50, minus 25 per earlier guesser. */
export function guesserPoints(at: number, seconds: number, order: number): number {
  const left = Math.max(0, 1 - at / seconds);
  return Math.max(50, Math.round(50 + 350 * left) - 25 * order);
}

export const guessersOf = (s: SketchState) =>
  s.players.map((_, i) => i).filter((i) => i !== s.turn.drawer);

/** A player submits a guess at the current time. Correct guesses score and are recorded once. */
export function submitGuess(
  s: SketchState,
  player: number,
  text: string,
): { state: SketchState; result: GuessResult } {
  const t = s.turn;
  if (!t.word || t.done || player === t.drawer || t.guessed.some((g) => g.player === player))
    return { state: s, result: 'wrong' };
  const result = judge(t.word, text, s.lang);
  if (result !== 'correct') return { state: s, result };
  const pts = guesserPoints(t.elapsed, s.seconds, t.guessed.length);
  const earned = t.earned.map((e, i) => (i === player ? e + pts : e));
  const guessed = [...t.guessed, { player, at: t.elapsed }];
  const allIn = guessed.length === guessersOf(s).length;
  return { state: { ...s, turn: { ...t, guessed, earned, done: allIn } }, result };
}

export function tick(s: SketchState, seconds: number): SketchState {
  const t = s.turn;
  if (!t.word || t.done) return s;
  const elapsed = Math.min(s.seconds, t.elapsed + seconds);
  return { ...s, turn: { ...t, elapsed, done: elapsed >= s.seconds } };
}

/** Closes the turn: the drawer earns 100 per correct guesser plus a bonus for being guessed fast. */
export function endTurn(s: SketchState): SketchState {
  const t = s.turn;
  const n = t.guessed.length;
  const drawerPts =
    n === 0 ? 0 : Math.round(100 * n + 100 * (1 - t.guessed.at(-1)!.at / s.seconds));
  const earned = t.earned.map((e, i) => (i === t.drawer ? e + drawerPts : e));
  const players = s.players.map((p, i) => ({ ...p, score: p.score + earned[i]! }));
  return { ...s, players, turn: { ...t, earned, done: true } };
}

/** Moves to the next drawer, the next round, or the end of the game. */
export function nextTurn(s: SketchState): SketchState {
  let { round, turnIndex } = s;
  turnIndex++;
  if (turnIndex >= s.players.length) {
    turnIndex = 0;
    round++;
  }
  if (round > s.rounds) return { ...s, status: 'over' };
  return startTurn({ ...s, round, turnIndex }, turnIndex);
}

export function ranking(s: SketchState): number[] {
  return s.players.map((_, i) => i).sort((a, b) => s.players[b]!.score - s.players[a]!.score);
}

export function isValidState(v: unknown): v is SketchState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as SketchState;
  return (
    (s.lang === 'en' || s.lang === 'es') &&
    Array.isArray(s.players) &&
    typeof s.round === 'number' &&
    typeof s.turn === 'object' &&
    s.turn !== null &&
    Array.isArray(s.used) &&
    Array.isArray(s.rng) &&
    (s.status === 'playing' || s.status === 'over')
  );
}
