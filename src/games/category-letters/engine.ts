/**
 * Pure rules for #203 Category Letters (ruleset `category-letters-classic`): roll a letter, fill a
 * list of categories with answers that start with it before the timer ends, then score one point
 * per valid answer nobody else gave (plus an optional alliteration bonus). Known answers validate
 * automatically; unknown ones go to a table vote. Bots answer from the category bank.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import type { LocalizedText } from '../../core/i18n';
import { normalize as surveyNormalize } from '../shared/survey/engine';
import { SHEETS, type Band } from '../shared/survey/sheets';
import { EXTRA_CATEGORIES } from './categories';

export type Lang = 'en' | 'es';
export type Skill = 'easy' | 'normal' | 'hard';

export const LIST_SIZES = [6, 9, 12] as const;
export const TIMERS = [60, 90, 120, 180] as const;
export const ROUND_COUNTS = [1, 3, 5] as const;
export const MAX_BOTS = 5;
export const MAX_HUMANS = 4;

/** The classic 20-sided die leaves out the hardest letters. */
export const DIE: Record<Lang, string> = {
  en: 'ABCDEFGHIJKLMNOPRSTW',
  es: 'ABCDEFGHIJLMNOPRSTV',
};
export const ALL_LETTERS: Record<Lang, string> = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ',
};

// ---------------------------------------------------------------- categories

export interface Known {
  key: string;
  name: string;
  weight: number;
}

export interface Category {
  id: string;
  name: LocalizedText;
  known: Record<Lang, Known[]>;
}

const BAND_WEIGHT: Record<Band, number> = { a: 8, b: 5, c: 4, d: 2, e: 1, f: 0.5 };

function categoryName(q: string): string {
  return q.replace(/^(Name|Nombra)\s+/i, '').replace(/^./, (c) => c.toUpperCase());
}

function buildBank(): Category[] {
  const out: Category[] = [];
  for (const sheet of SHEETS) {
    const known: Record<Lang, Known[]> = { en: [], es: [] };
    for (const band of ['a', 'b', 'c', 'd', 'e', 'f'] as const) {
      for (const raw of sheet[band].split(';')) {
        const [en = '', es = ''] = raw.trim().split('|');
        for (const [lang, names] of [
          ['en', en],
          ['es', es],
        ] as const) {
          const list = names
            .split('/')
            .map((s) => s.trim())
            .filter(Boolean);
          list.forEach((name, i) =>
            known[lang].push({
              key: normalize(name),
              name,
              weight: i === 0 ? BAND_WEIGHT[band] : 0,
            }),
          );
        }
      }
    }
    out.push({
      id: sheet.id,
      name: { en: categoryName(sheet.q.en), es: categoryName(sheet.q.es) },
      known,
    });
  }
  for (const c of EXTRA_CATEGORIES) {
    const known: Record<Lang, Known[]> = { en: [], es: [] };
    for (const lang of ['en', 'es'] as const)
      for (const name of c[lang]
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean))
        known[lang].push({ key: normalize(name), name, weight: 3 });
    out.push({ id: c.id, name: c.name, known });
  }
  return out;
}

/** Comparison key (see the survey module) — articles, accents, plurals and spacing ignored. */
export function normalize(text: string): string {
  return surveyNormalize(text);
}

export const BANK: readonly Category[] = buildBank();
const BY_ID = new Map(BANK.map((c) => [c.id, c]));

export function categoryById(id: string): Category {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown category ${id}`);
  return c;
}

/** First letter that counts: accents folded (Ñ kept), leading articles skipped. */
export function keyLetter(answer: string): string {
  const words = answer
    .trim()
    .toUpperCase()
    .split('')
    .map((ch) => (ch === 'Ñ' ? ch : ch.normalize('NFD').replace(/\p{Diacritic}/gu, '')))
    .join('')
    .split(/[^A-ZÑ0-9]+/)
    .filter(Boolean);
  const articles = new Set([
    'THE',
    'A',
    'AN',
    'EL',
    'LA',
    'LOS',
    'LAS',
    'UN',
    'UNA',
    'UNOS',
    'UNAS',
  ]);
  while (words.length > 1 && articles.has(words[0]!)) words.shift();
  return words[0]?.[0] ?? '';
}

/** Answers this category knows that start with the letter. */
export function candidates(c: Category, lang: Lang, letter: string): Known[] {
  return c.known[lang].filter((k) => keyLetter(k.name) === letter);
}

export function isKnown(c: Category, lang: Lang, answer: string): boolean {
  const key = normalize(answer);
  return (
    key.length > 0 &&
    (c.known[lang].some((k) => k.key === key) ||
      c.known[lang === 'en' ? 'es' : 'en'].some((k) => k.key === key))
  );
}

/**
 * The bots' vote on an answer the bank does not know: they accept it when it looks like a real
 * word (letters only, at least three, a vowel, no letter tripled) — they cannot judge meaning.
 */
export function looksLikeWord(answer: string): boolean {
  const s = answer.trim().toLowerCase();
  if (s.length < 3 || s.length > 40) return false;
  if (!/^[\p{L}][\p{L}' -]*$/u.test(s)) return false;
  const plain = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (!/[aeiouy]/.test(plain)) return false;
  return !/(.)\1\1/.test(plain.replace(/[ '-]/g, ''));
}

/** Extra points for alliteration: one per further word that also starts with the letter. */
export function alliterationBonus(answer: string, letter: string): number {
  const words = answer
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (words.length < 2) return 0;
  const starts = words.filter((w) => keyLetter(w) === letter).length;
  return keyLetter(answer) === letter ? Math.max(0, starts - 1) : 0;
}

// ---------------------------------------------------------------- state

export interface Settings {
  lang: Lang;
  size: (typeof LIST_SIZES)[number];
  seconds: (typeof TIMERS)[number];
  rounds: (typeof ROUND_COUNTS)[number];
  bots: number;
  skill: Skill;
  humans: number;
  alliteration: boolean;
  allLetters: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  size: 12,
  seconds: 120,
  rounds: 3,
  bots: 3,
  skill: 'normal',
  humans: 1,
  alliteration: false,
  allLetters: false,
};

export interface Player {
  name: string;
  bot: boolean;
}

export type Verdict = 'empty' | 'wrong-letter' | 'known' | 'accepted' | 'rejected' | 'duplicate';

export interface Round {
  letter: string;
  categories: string[];
  /** answers[player][category] */
  answers: string[][];
  /** Table decisions on unknown answers, keyed `${player}:${category}` (true = accept). */
  votes: Record<string, boolean>;
}

export interface CLState {
  settings: Settings;
  seed: number;
  rng: RngState;
  players: Player[];
  rounds: Round[];
  /** Index of the human filling the list (fill phase). */
  filler: number;
  /** Env helper: next category to answer for player 0 (AI interface only). */
  cursor: number;
  phase: 'fill' | 'review' | 'done';
  /** Totals after each confirmed round. */
  totals: number[];
}

const BOT_NAMES = ['Ada', 'Bruno', 'Cleo', 'Dario', 'Elsa'];

export function newGame(settings: Settings, seed: number, humanNames: string[] = []): CLState {
  const humans = Math.max(1, Math.min(MAX_HUMANS, settings.humans));
  const bots = Math.max(0, Math.min(MAX_BOTS, settings.bots));
  const players: Player[] = [
    ...Array.from({ length: humans }, (_, i) => ({
      name: humanNames[i] || `P${i + 1}`,
      bot: false,
    })),
    ...Array.from({ length: bots }, (_, i) => ({ name: BOT_NAMES[i]!, bot: true })),
  ];
  const base: CLState = {
    settings: { ...settings, humans, bots },
    seed: seed >>> 0,
    rng: new Rng(seed >>> 0).state,
    players,
    rounds: [],
    filler: 0,
    cursor: 0,
    phase: 'fill',
    totals: players.map(() => 0),
  };
  return startRound(base);
}

function botAnswer(c: Category, s: Settings, letter: string, rng: Rng): string {
  const fill = { easy: 0.45, normal: 0.72, hard: 0.92 }[s.skill];
  const list = candidates(c, s.lang, letter).filter((k) => k.weight > 0);
  if (list.length === 0 || !rng.chance(fill)) return '';
  const power = { easy: 1.6, normal: 1, hard: 0.15 }[s.skill];
  const weights = list.map((k) => Math.pow(k.weight, power));
  let r = rng.float() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return list[i]!.name;
  }
  return list.at(-1)!.name;
}

function startRound(s: CLState): CLState {
  const rng = Rng.from(s.rng);
  const letters = s.settings.allLetters ? ALL_LETTERS[s.settings.lang] : DIE[s.settings.lang];
  const used = new Set(s.rounds.map((r) => r.letter));
  const fresh = [...letters].filter((l) => !used.has(l));
  const letter = rng.pick(fresh.length ? fresh : [...letters]);
  const categories = rng.shuffle(BANK.map((c) => c.id)).slice(0, s.settings.size);
  const answers = s.players.map((p) =>
    p.bot
      ? categories.map((id) => botAnswer(categoryById(id), s.settings, letter, rng))
      : categories.map(() => ''),
  );
  return {
    ...s,
    rng: rng.state,
    rounds: [...s.rounds, { letter, categories, answers, votes: {} }],
    filler: 0,
    cursor: 0,
    phase: 'fill',
  };
}

export const currentRound = (s: CLState): Round => s.rounds[s.rounds.length - 1]!;
export const humanIndexes = (s: CLState) => s.players.flatMap((p, i) => (p.bot ? [] : [i]));

/** A human hands in their list (answers in category order); after the last human, review. */
export function submitList(s: CLState, answers: string[]): CLState {
  if (s.phase !== 'fill') throw new Error('Not filling');
  const humans = humanIndexes(s);
  const who = humans[s.filler]!;
  const round = currentRound(s);
  const clean = round.categories.map((_, i) => (answers[i] ?? '').trim().slice(0, 40));
  const nextRound: Round = {
    ...round,
    answers: round.answers.map((a, p) => (p === who ? clean : a)),
  };
  const rounds = [...s.rounds.slice(0, -1), nextRound];
  const filler = s.filler + 1;
  return filler >= humans.length
    ? { ...s, rounds, filler, phase: 'review' }
    : { ...s, rounds, filler };
}

export interface Scored {
  verdict: Verdict;
  points: number;
}

/** The table's default decision on an unknown answer (before any human vote). */
export function defaultVote(answer: string): boolean {
  return looksLikeWord(answer);
}

/** Who may cast the human vote on a player's unknown answer: any other human at the table. */
export function humansCanVote(s: CLState, author: number): boolean {
  return humanIndexes(s).some((h) => h !== author);
}

/** Scores a round: verdicts and points per player per category. */
export function scoreRound(s: CLState, roundIndex = s.rounds.length - 1): Scored[][] {
  const round = s.rounds[roundIndex]!;
  const { lang, alliteration } = s.settings;
  const verdicts: Verdict[][] = round.answers.map((list, p) =>
    list.map((answer, c) => {
      if (!answer.trim()) return 'empty';
      if (keyLetter(answer) !== round.letter) return 'wrong-letter';
      const cat = categoryById(round.categories[c]!);
      if (isKnown(cat, lang, answer)) return 'known';
      const key = `${p}:${c}`;
      const vote =
        humansCanVote(s, p) && key in round.votes ? round.votes[key]! : defaultVote(answer);
      return vote ? 'accepted' : 'rejected';
    }),
  );
  // Duplicates: valid answers with the same key in the same category cancel out.
  round.categories.forEach((_, c) => {
    const counts = new Map<string, number>();
    round.answers.forEach((list, p) => {
      const v = verdicts[p]![c]!;
      if (v === 'known' || v === 'accepted') {
        const k = normalize(list[c]!);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    });
    round.answers.forEach((list, p) => {
      const v = verdicts[p]![c]!;
      if ((v === 'known' || v === 'accepted') && (counts.get(normalize(list[c]!)) ?? 0) > 1)
        verdicts[p]![c] = 'duplicate';
    });
  });
  return verdicts.map((row, p) =>
    row.map((verdict, c) => {
      const valid = verdict === 'known' || verdict === 'accepted';
      const answer = round.answers[p]![c]!;
      return {
        verdict,
        points: valid ? 1 + (alliteration ? alliterationBonus(answer, round.letter) : 0) : 0,
      };
    }),
  );
}

export function roundPoints(s: CLState, roundIndex = s.rounds.length - 1): number[] {
  return scoreRound(s, roundIndex).map((row) => row.reduce((a, b) => a + b.points, 0));
}

/** Records the table's vote on an unknown answer during review. */
export function setVote(s: CLState, player: number, category: number, accept: boolean): CLState {
  if (s.phase !== 'review') return s;
  const round = currentRound(s);
  const next: Round = { ...round, votes: { ...round.votes, [`${player}:${category}`]: accept } };
  return { ...s, rounds: [...s.rounds.slice(0, -1), next] };
}

/** Confirms the review: adds the round's points and starts the next round or ends the game. */
export function confirmRound(s: CLState): CLState {
  if (s.phase !== 'review') throw new Error('Not reviewing');
  const pts = roundPoints(s);
  const totals = s.totals.map((t, i) => t + pts[i]!);
  if (s.rounds.length >= s.settings.rounds) return { ...s, totals, phase: 'done' };
  return startRound({ ...s, totals });
}

export function winners(s: CLState): number[] {
  const best = Math.max(...s.totals);
  return s.totals.flatMap((t, i) => (t === best ? [i] : []));
}

// ---------------------------------------------------------------- validation

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isValidState(v: unknown): v is CLState {
  if (!isObj(v) || !isObj(v.settings) || !Array.isArray(v.players) || !Array.isArray(v.rounds))
    return false;
  const st = v.settings;
  if (st.lang !== 'en' && st.lang !== 'es') return false;
  if (!LIST_SIZES.includes(st.size as never) || !TIMERS.includes(st.seconds as never)) return false;
  if (!ROUND_COUNTS.includes(st.rounds as never)) return false;
  if (!Array.isArray(v.rng) || v.rng.length !== 4) return false;
  if (!Array.isArray(v.totals) || v.totals.length !== v.players.length) return false;
  if (v.phase !== 'fill' && v.phase !== 'review' && v.phase !== 'done') return false;
  for (const r of v.rounds) {
    if (!isObj(r) || typeof r.letter !== 'string' || !Array.isArray(r.categories)) return false;
    if (!r.categories.every((c) => typeof c === 'string' && BY_ID.has(c))) return false;
    if (!Array.isArray(r.answers) || r.answers.length !== v.players.length) return false;
    const size = r.categories.length;
    if (!r.answers.every((a) => Array.isArray(a) && a.length === size)) return false;
    if (!isObj(r.votes)) return false;
  }
  return v.rounds.length >= 1 && typeof v.filler === 'number' && typeof v.cursor === 'number';
}
