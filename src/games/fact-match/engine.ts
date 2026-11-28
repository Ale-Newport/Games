/**
 * Fact Match rules (pure). A board shows five facts of one family — five years of one commodity's
 * price, five distances from one city, one property of five chemical elements, or one kind of
 * world fact for five places — and seven real numbers: the five answers and two decoys, which are
 * true values of other members of the same family. The player places numbers on facts and checks;
 * correct placements lock (20 points on the first check, 12 on the second, 6 on the third), wrong
 * ones come back with a cross for that pairing. Three checks per board. Sessions: a three-board
 * daily or an endless run by difficulty and topic. Data: the #233 / #234 bank. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  citiesFor,
  DIFFICULTIES,
  listKeys,
  question,
  TOPICS,
  topicOf,
  type Bank,
  type Difficulty,
  type QKey,
  type Topic,
} from '../rough-guess/engine';

export type { Bank, Difficulty, Topic };
export { DIFFICULTIES, TOPICS };

export const FACTS = 5;
export const NUMBERS = 7;
export const CHECKS = 3;
/** Points for a fact locked on check 1, 2, 3. */
export const CHECK_POINTS = [20, 12, 6];
export const DAILY_BOARDS = 3;
/** Values on one board differ by at least this ratio, so no two numbers look alike. */
export const MIN_GAP = 1.06;

/* ---------- families and boards ---------- */

/** A family id: `p:<commodity>`, `e:<property>`, `m:<kind>` or `d:<origin city>`. */
export type Family = string;

const famCache = new WeakMap<Bank, Map<Difficulty, Map<Family, QKey[]>>>();
/** Families with enough members to build a board, with their member keys. */
export function families(bank: Bank, d: Difficulty): Map<Family, QKey[]> {
  let c = famCache.get(bank);
  if (!c) famCache.set(bank, (c = new Map()));
  const hit = c.get(d);
  if (hit) return hit;
  const out = new Map<Family, QKey[]>();
  const add = (f: Family, k: QKey) => out.set(f, [...(out.get(f) ?? []), k]);
  for (const k of listKeys(bank, d)) {
    const [t, a, b] = k.split(':');
    if (t === 'p') add(`p:${a}`, k);
    else if (t === 'e') add(`e:${b}`, k);
    else add(`m:${question(bank, k).kind}`, k);
  }
  // Distances: from each well-known origin to the other well-known cities in other countries.
  const cities = citiesFor(bank, d);
  const c0 = bank.rough.cities;
  const origins = cities.filter((i) => c0[i]![6] >= (d === 'hard' ? 150 : 200));
  for (const o of origins)
    for (const j of cities)
      if (j !== o && c0[j]![5] !== c0[o]![5]) add(`d:${o}`, o < j ? `d:${o}:${j}` : `d:${j}:${o}`);
  for (const [f, keys] of out) if (keys.length < NUMBERS) out.delete(f);
  c.set(d, out);
  return out;
}

export const familyTopic = (bank: Bank, f: Family, sample: QKey): Exclude<Topic, 'all'> =>
  f.startsWith('d:') ? 'distances' : topicOf(question(bank, sample).kind);

/** For a distance family, the destination of a key (the city that is not the origin). */
export function destination(f: Family, key: QKey): number {
  const o = Number(f.split(':')[1]);
  const [, a, b] = key.split(':').map(Number);
  return a === o ? b! : a!;
}

export interface Board {
  family: Family;
  /** The five facts on the board. */
  facts: QKey[];
  /** What the two decoys are really the value of (shown after the board). */
  decoyFacts: QKey[];
  /** The seven numbers in display order: indices into `values`. */
  values: number[];
  /** Which number answers each fact (index into `values`). */
  answer: number[];
  /** placement[f] = number index placed on fact f, or null. */
  placement: (number | null)[];
  /** locked[f] = check number (1–3) on which fact f locked, or 0. */
  locked: number[];
  /** Pairings already checked and found wrong, as `fact*NUMBERS+number`. */
  wrong: number[];
  checks: number;
  score: number | null;
}

/** Picks seven family members whose values are all at least MIN_GAP apart (or null). */
function pickSeven(bank: Bank, rng: Rng, keys: QKey[]): QKey[] | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const order = rng.shuffle(keys);
    const out: QKey[] = [];
    const vals: number[] = [];
    for (const k of order) {
      const v = question(bank, k).value;
      if (vals.every((w) => Math.max(v, w) / Math.min(v, w) >= MIN_GAP)) {
        out.push(k);
        vals.push(v);
        if (out.length === NUMBERS) return out;
      }
    }
  }
  return null;
}

export function makeBoard(bank: Bank, rng: Rng, family: Family, keys: QKey[]): Board | null {
  const seven = pickSeven(bank, rng, keys);
  if (!seven) return null;
  const facts = seven.slice(0, FACTS);
  // Facts in a natural reading order: by year for prices, else as drawn.
  if (family.startsWith('p:'))
    facts.sort((a, b) => question(bank, a).year - question(bank, b).year);
  const allValues = seven.map((k) => question(bank, k).value);
  const order = rng.shuffle(allValues.map((_, i) => i));
  const values = order.map((i) => allValues[i]!);
  const answer = facts.map((k) => values.indexOf(question(bank, k).value));
  return {
    family,
    facts,
    decoyFacts: seven.slice(FACTS),
    values,
    answer,
    placement: facts.map(() => null),
    locked: facts.map(() => 0),
    wrong: [],
    checks: 0,
    score: null,
  };
}

/* ---------- moves ---------- */

export const boardOver = (b: Board) => b.score !== null;
/** Places number n on fact f (moving it from wherever it was; replacing what was there). */
export function place(b: Board, f: number, n: number): Board {
  if (boardOver(b)) throw new Error('The board is over');
  if (!(f >= 0 && f < FACTS && n >= 0 && n < NUMBERS)) throw new Error('No such fact or number');
  if (b.locked[f]) throw new Error('That fact is locked');
  if (b.placement.some((p, i) => p === n && b.locked[i])) throw new Error('That number is locked');
  const placement = b.placement.map((p) => (p === n ? null : p));
  placement[f] = n;
  return { ...b, placement };
}
export function unplace(b: Board, f: number): Board {
  if (boardOver(b) || b.locked[f]) throw new Error('Nothing to take back');
  const placement = [...b.placement];
  placement[f] = null;
  return { ...b, placement };
}

/** Checks the board: right placements lock, wrong ones return and are remembered. */
export function check(b: Board): Board {
  if (boardOver(b)) throw new Error('The board is over');
  const checks = b.checks + 1;
  const locked = [...b.locked];
  const placement = [...b.placement];
  const wrong = [...b.wrong];
  b.facts.forEach((_, f) => {
    if (locked[f]) return;
    const n = placement[f];
    if (n === null || n === undefined) return;
    if (n === b.answer[f]) locked[f] = checks;
    else {
      placement[f] = null;
      if (!wrong.includes(f * NUMBERS + n)) wrong.push(f * NUMBERS + n);
    }
  });
  const done = checks >= CHECKS || locked.every((l) => l > 0);
  const score = done ? locked.reduce((s, l) => s + (l ? CHECK_POINTS[l - 1]! : 0), 0) : null;
  return { ...b, checks, locked, placement, wrong, score };
}

/** The numbers that answer no fact. */
export const decoys = (b: Board) => b.values.map((_, i) => i).filter((i) => !b.answer.includes(i));

/* ---------- sessions ---------- */

export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  topic: Topic;
  limit: number;
  rng: RngState;
  boards: Board[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}
const KEEP_BOARDS = 8;
const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 113, 2654435761) ^ 0x3f11_ac7d) >>> 0;
/** The daily's topics, in order: one price board, one science-or-distance board, one world board. */
const DAILY_TOPICS: Exclude<Topic, 'all'>[][] = [['prices'], ['science', 'distances'], ['world']];

function addBoard(s: Session, bank: Bank, avoid: ReadonlySet<Family>): Session {
  const rng = new Rng(s.rng);
  const fams = families(bank, s.difficulty);
  const recent = new Set([...avoid, ...s.boards.map((b) => b.family)]);
  const wanted = s.mode === 'daily' ? DAILY_TOPICS[s.boards.length % DAILY_TOPICS.length]! : null;
  let ids = [...fams.keys()].filter((f) => {
    const t = familyTopic(bank, f, fams.get(f)![0]!);
    return wanted ? wanted.includes(t) : s.topic === 'all' || t === s.topic;
  });
  // Topic first (distance origins would otherwise crowd the rest out), then the family.
  const byTopic = new Map<string, Family[]>();
  for (const f of ids) {
    const t = familyTopic(bank, f, fams.get(f)![0]!);
    byTopic.set(t, [...(byTopic.get(t) ?? []), f]);
  }
  const lastTopic = s.boards.length
    ? familyTopic(
        bank,
        s.boards[s.boards.length - 1]!.family,
        s.boards[s.boards.length - 1]!.facts[0]!,
      )
    : null;
  let topics = [...byTopic.keys()];
  if (topics.length > 1 && lastTopic && !wanted) topics = topics.filter((t) => t !== lastTopic);
  ids = byTopic.get(rng.pick(topics))!;
  const fresh = ids.filter((f) => !recent.has(f));
  if (fresh.length) ids = fresh;
  for (let attempt = 0; attempt < 40; attempt++) {
    const family = rng.pick(ids);
    const b = makeBoard(bank, rng, family, fams.get(family)!);
    if (b) {
      const boards = [...s.boards, b];
      return {
        ...s,
        rng: rng.state,
        boards: s.mode === 'daily' ? boards : boards.slice(-KEEP_BOARDS),
      };
    }
  }
  throw new Error('Could not build a board');
}

function base(
  mode: Session['mode'],
  day: number,
  d: Difficulty,
  topic: Topic,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: d,
    topic,
    limit,
    rng: new Rng(seed >>> 0).state,
    boards: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}
export const newDaily = (bank: Bank, day: number) =>
  addBoard(base('daily', day, 'normal', 'all', DAILY_BOARDS, dailySeed(day)), bank, new Set());
export const newEndless = (
  bank: Bank,
  seed: number,
  d: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<Family> = new Set(),
  limit = 0,
) => addBoard(base('endless', -1, d, topic, limit, seed), bank, avoid);

export const current = (s: Session): Board => s.boards[s.boards.length - 1]!;
const withBoard = (s: Session, b: Board): Session => ({
  ...s,
  boards: [...s.boards.slice(0, -1), b],
});

export function placeIn(s: Session, f: number, n: number): Session {
  if (s.status !== 'playing') throw new Error('The session is over');
  return withBoard(s, place(current(s), f, n));
}
export function unplaceIn(s: Session, f: number): Session {
  if (s.status !== 'playing') throw new Error('The session is over');
  return withBoard(s, unplace(current(s), f));
}
export function checkIn(s: Session): Session {
  if (s.status !== 'playing') throw new Error('The session is over');
  const b = check(current(s));
  const n = withBoard(s, b);
  if (b.score === null) return n;
  const count = s.count + 1;
  return {
    ...n,
    count,
    total: s.total + b.score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}
export function next(s: Session, bank: Bank, avoid: ReadonlySet<Family> = new Set()): Session {
  if (s.status !== 'playing' || !boardOver(current(s))) throw new Error('Nothing to advance');
  return addBoard(s, bank, avoid);
}
export function finish(s: Session): Session {
  const boards = boardOver(current(s)) ? s.boards : s.boards.slice(0, -1);
  return { ...s, boards, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const cell = (l: number) => (l === 1 ? '🟩' : l === 2 ? '🟨' : l === 3 ? '🟧' : '⬛');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.boards
    .filter(boardOver)
    .map((b) => b.locked.map(cell).join(''))
    .join('\n')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isIdx = (v: unknown, n: number) => isNum(v) && Number.isInteger(v) && v >= 0 && v < n;
export function isBoard(v: unknown, bank?: Bank): v is Board {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Board;
  const okKey = (k: unknown) => {
    if (typeof k !== 'string') return false;
    if (!bank) return true;
    try {
      question(bank, k);
      return true;
    } catch {
      return false;
    }
  };
  return (
    typeof b.family === 'string' &&
    Array.isArray(b.facts) &&
    b.facts.length === FACTS &&
    b.facts.every(okKey) &&
    Array.isArray(b.decoyFacts) &&
    b.decoyFacts.length === NUMBERS - FACTS &&
    b.decoyFacts.every(okKey) &&
    Array.isArray(b.values) &&
    b.values.length === NUMBERS &&
    b.values.every((x) => isNum(x) && x > 0) &&
    Array.isArray(b.answer) &&
    b.answer.length === FACTS &&
    b.answer.every((x) => isIdx(x, NUMBERS)) &&
    new Set(b.answer).size === FACTS &&
    Array.isArray(b.placement) &&
    b.placement.length === FACTS &&
    b.placement.every((x) => x === null || isIdx(x, NUMBERS)) &&
    Array.isArray(b.locked) &&
    b.locked.length === FACTS &&
    b.locked.every((x) => isIdx(x, CHECKS + 1)) &&
    Array.isArray(b.wrong) &&
    b.wrong.every((x) => isIdx(x, FACTS * NUMBERS)) &&
    isIdx(b.checks, CHECKS + 1) &&
    (b.score === null || isNum(b.score))
  );
}
export function isSession(v: unknown, bank?: Bank): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.boards) &&
    (s.boards.length > 0 || s.status === 'done') &&
    s.boards.every((b) => isBoard(b, bank))
  );
}
