/**
 * Pure rules for the survey games: seven open prompts per run, one accepted answer per prompt,
 * scored by how popular that answer is. `rare` polarity (#201 Rare Answer Dive) pays most for
 * answers few people give; `common` polarity (#202 Crowd Answer Climb) pays most for the answers
 * everybody gives. Matching forgives case, accents, articles, plurals, spacing and small typos.
 */
import { Rng } from '../../../core/game-engine/random';
import type { LocalizedText } from '../../../core/i18n';
import { BANDS, SHEETS, type Band, type SheetSource } from './sheets';

export type Polarity = 'rare' | 'common';
export type Lang = 'en' | 'es';
export type RunKind = 'daily' | 'unlimited' | 'party';

export const PROMPTS_PER_RUN = 7;
export const SECONDS_PER_PROMPT = 25;
export const PREVIEW_SECONDS = 3;
export const MAX_PLAYERS = 6;
/** Climb only: wrong answers allowed per prompt before it scores zero. */
export const CLIMB_TRIES = 3;

export const BAND_POINTS: Record<Polarity, Record<Band, number>> = {
  rare: { a: 10, b: 15, c: 30, d: 60, e: 85, f: 100 },
  common: { a: 100, b: 85, c: 60, d: 30, e: 15, f: 10 },
};

export interface Entry {
  band: Band;
  /** Display names. */
  name: LocalizedText;
  /** Normalized keys accepted per language. */
  keys: Record<Lang, string[]>;
}

export interface Sheet {
  id: string;
  q: LocalizedText;
  entries: Entry[];
  fact: LocalizedText;
}

// ---------------------------------------------------------------- normalization

const ARTICLES = new Set(['the', 'a', 'an', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas']);

function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 4 && /(ches|shes|xes|ses|zes|ces)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us'))
    return word.slice(0, -1);
  return word;
}

/** Comparison key: lower case, no accents/punctuation/articles, singular words, no spaces. */
export function normalize(text: string): string {
  const words = text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0);
  while (words.length > 1 && ARTICLES.has(words[0]!)) words.shift();
  return words.map(singular).join('');
}

// ---------------------------------------------------------------- sheets

function parseSheet(src: SheetSource): Sheet {
  const entries: Entry[] = [];
  for (const band of BANDS) {
    for (const raw of src[band].split(';')) {
      const item = raw.trim();
      if (!item) continue;
      const [en = '', es = ''] = item.split('|');
      const enNames = en.split('/').map((s) => s.trim());
      const esNames = es.split('/').map((s) => s.trim());
      entries.push({
        band,
        name: { en: enNames[0]!, es: esNames[0]! },
        keys: {
          en: [...new Set(enNames.map(normalize))],
          es: [...new Set(esNames.map(normalize))],
        },
      });
    }
  }
  return { id: src.id, q: src.q, entries, fact: src.fact };
}

export const ALL_SHEETS: readonly Sheet[] = SHEETS.map(parseSheet);
const BY_ID = new Map(ALL_SHEETS.map((s) => [s.id, s]));

export function sheetById(id: string): Sheet {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown survey sheet ${id}`);
  return s;
}

// ---------------------------------------------------------------- matching

/** Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps). */
export function editDistance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const prev2: number[] = new Array<number>(b.length + 1).fill(0);
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, prev2[j - 2]! + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j]!;
    prev = cur;
    if (rowMin > cap) return cap + 1;
  }
  return prev[b.length]!;
}

const tolerance = (len: number) => (len >= 9 ? 2 : len >= 5 ? 1 : 0);

export interface Match {
  entry: number;
  /** True when the input was accepted as a misspelling. */
  fuzzy: boolean;
}

/**
 * Finds the answer an input refers to: an exact key in the run's language, then an exact key in
 * the other language, then a unique closest key within the typo tolerance. Ambiguous typos and
 * unknown answers are rejected (`null`).
 */
export function matchAnswer(sheet: Sheet, input: string, lang: Lang): Match | null {
  const key = normalize(input);
  if (key.length < 2) return null;
  const other: Lang = lang === 'en' ? 'es' : 'en';
  for (const l of [lang, other]) {
    const i = sheet.entries.findIndex((e) => e.keys[l].includes(key));
    if (i >= 0) return { entry: i, fuzzy: false };
  }
  const tol = tolerance(key.length);
  if (tol === 0) return null;
  let best = tol + 1;
  let found: number[] = [];
  sheet.entries.forEach((e, i) => {
    for (const k of e.keys[lang]) {
      if (k.length < 4) continue;
      const d = editDistance(key, k, tol);
      if (d < best) {
        best = d;
        found = [i];
      } else if (d === best && !found.includes(i)) found.push(i);
    }
  });
  return best <= tol && found.length === 1 ? { entry: found[0]!, fuzzy: true } : null;
}

// ---------------------------------------------------------------- state

export interface Answer {
  /** Index into the sheet's entries, or null when the prompt timed out / ran out of tries. */
  entry: number | null;
  band: Band | null;
  points: number;
  /** Rejected attempts before the answer. */
  misses: number;
  /** What the player typed for the accepted answer. */
  typed: string;
}

export interface SurveyState {
  polarity: Polarity;
  lang: Lang;
  kind: RunKind;
  seed: number;
  /** Date key YYYYMMDD for daily runs. */
  day: number | null;
  prompts: string[];
  players: number;
  /** answers[prompt][player] */
  answers: (Answer | null)[][];
  /** Rejected attempts on the current turn. */
  misses: number;
  prompt: number;
  player: number;
  status: 'playing' | 'done';
}

export type SurveyAction = `e:${number}` | 'timeout';

/** Days since 1970-01-01 for a YYYYMMDD key. */
export function dayNumber(day: number): number {
  const y = Math.floor(day / 10000);
  const m = Math.floor((day % 10000) / 100);
  const d = day % 100;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * The daily prompts: the sheet bank is shuffled once per cycle (seeded by cycle and polarity) and
 * each day takes the next seven, so prompts never repeat within a cycle.
 */
export function dailyPrompts(day: number, polarity: Polarity): string[] {
  const perCycle = Math.floor(ALL_SHEETS.length / PROMPTS_PER_RUN);
  const n = dayNumber(day);
  const cycle = Math.floor(n / perCycle);
  const slot = n - cycle * perCycle;
  const order = new Rng((cycle * 7919 + (polarity === 'rare' ? 17 : 29)) >>> 0).shuffle(
    ALL_SHEETS.map((s) => s.id),
  );
  return order.slice(slot * PROMPTS_PER_RUN, slot * PROMPTS_PER_RUN + PROMPTS_PER_RUN);
}

export function randomPrompts(seed: number): string[] {
  return new Rng(seed >>> 0).shuffle(ALL_SHEETS.map((s) => s.id)).slice(0, PROMPTS_PER_RUN);
}

export interface NewRun {
  polarity: Polarity;
  lang: Lang;
  kind: RunKind;
  seed: number;
  day?: number;
  players?: number;
}

export function newRun(o: NewRun): SurveyState {
  const players = o.kind === 'party' ? Math.max(2, Math.min(MAX_PLAYERS, o.players ?? 2)) : 1;
  const day = o.kind === 'daily' ? (o.day ?? 19700101) : null;
  const prompts = day !== null ? dailyPrompts(day, o.polarity) : randomPrompts(o.seed);
  return {
    polarity: o.polarity,
    lang: o.lang,
    kind: o.kind,
    seed: o.seed >>> 0,
    day,
    prompts,
    players,
    answers: prompts.map(() => Array.from({ length: players }, () => null)),
    misses: 0,
    prompt: 0,
    player: 0,
    status: 'playing',
  };
}

export function currentSheet(s: SurveyState): Sheet {
  return sheetById(s.prompts[Math.min(s.prompt, s.prompts.length - 1)]!);
}

export function legalActions(s: SurveyState): SurveyAction[] {
  if (s.status !== 'playing') return [];
  const n = currentSheet(s).entries.length;
  return [...Array.from({ length: n }, (_, i) => `e:${i}` as SurveyAction), 'timeout'];
}

function advance(s: SurveyState): SurveyState {
  let { prompt, player } = s;
  player++;
  if (player >= s.players) {
    player = 0;
    prompt++;
  }
  return {
    ...s,
    prompt: Math.min(prompt, s.prompts.length),
    player,
    misses: 0,
    status: prompt >= s.prompts.length ? 'done' : 'playing',
  };
}

/** Applies an accepted answer or a timeout; throws on anything else. */
export function applyAction(s: SurveyState, action: SurveyAction, typed = ''): SurveyState {
  if (s.status !== 'playing') throw new Error('Run is over');
  const sheet = currentSheet(s);
  let answer: Answer;
  if (action === 'timeout') {
    answer = { entry: null, band: null, points: 0, misses: s.misses, typed: '' };
  } else {
    const m = /^e:(\d+)$/.exec(action);
    const entry = m ? Number(m[1]) : -1;
    const e = sheet.entries[entry];
    if (!e) throw new Error(`Illegal action ${action}`);
    answer = {
      entry,
      band: e.band,
      points: BAND_POINTS[s.polarity][e.band],
      misses: s.misses,
      typed: typed || e.name[s.lang],
    };
  }
  const answers = s.answers.map((row, p) =>
    p === s.prompt ? row.map((a, i) => (i === s.player ? answer : a)) : row,
  );
  return advance({ ...s, answers });
}

/** Records a rejected attempt. In a climb the third miss ends the prompt with zero points. */
export function recordMiss(s: SurveyState): SurveyState {
  if (s.status !== 'playing') return s;
  const next = { ...s, misses: s.misses + 1 };
  return s.polarity === 'common' && next.misses >= CLIMB_TRIES
    ? applyAction(next, 'timeout')
    : next;
}

/** Interprets typed text: an accepted answer advances the run, anything else is a miss. */
export function submitText(
  s: SurveyState,
  text: string,
): { state: SurveyState; match: Match | null } {
  const match = matchAnswer(currentSheet(s), text, s.lang);
  if (!match) return { state: recordMiss(s), match: null };
  return { state: applyAction(s, `e:${match.entry}`, text.trim()), match };
}

export function playerScore(s: SurveyState, player: number): number {
  return s.answers.reduce((sum, row) => sum + (row[player]?.points ?? 0), 0);
}

export const maxScore = () => PROMPTS_PER_RUN * 100;

/** Metres (dive) or kilometres (climb) reached. */
export function progressUnits(polarity: Polarity, points: number): number {
  return polarity === 'rare' ? points * 10 : points;
}

/** Spoiler-free result line, one symbol per prompt (band or timeout). */
export function shareGlyphs(s: SurveyState, player = 0): string {
  const glyph: Record<Band, string> =
    s.polarity === 'rare'
      ? { a: '🟦', b: '🟪', c: '🟩', d: '🟨', e: '🟧', f: '💎' }
      : { a: '⭐', b: '🟧', c: '🟨', d: '🟩', e: '🟦', f: '🟪' };
  return s.answers.map((row) => (row[player]?.band ? glyph[row[player].band] : '⬛')).join('');
}

// ---------------------------------------------------------------- validation

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isValidSurveyState(v: unknown): v is SurveyState {
  if (!isObj(v)) return false;
  if (v.polarity !== 'rare' && v.polarity !== 'common') return false;
  if (v.lang !== 'en' && v.lang !== 'es') return false;
  if (v.kind !== 'daily' && v.kind !== 'unlimited' && v.kind !== 'party') return false;
  if (!Array.isArray(v.prompts) || v.prompts.length !== PROMPTS_PER_RUN) return false;
  if (!v.prompts.every((p) => typeof p === 'string' && BY_ID.has(p))) return false;
  const players = v.players;
  if (typeof players !== 'number' || players < 1 || players > MAX_PLAYERS) return false;
  if (!Array.isArray(v.answers) || v.answers.length !== PROMPTS_PER_RUN) return false;
  for (const row of v.answers) {
    if (!Array.isArray(row) || row.length !== players) return false;
    for (const a of row) {
      if (a === null) continue;
      if (!isObj(a) || typeof a.points !== 'number' || typeof a.misses !== 'number') return false;
      if (a.entry !== null && typeof a.entry !== 'number') return false;
    }
  }
  return (
    typeof v.prompt === 'number' &&
    typeof v.player === 'number' &&
    typeof v.misses === 'number' &&
    typeof v.seed === 'number' &&
    (v.status === 'playing' || v.status === 'done')
  );
}
