/**
 * Size Sense rules (pure). Each round shows a mystery object (name, kind and the dimension asked)
 * next to a reference drawn at true scale; the player resizes the mystery silhouette and locks the
 * guess in. Scores are proportional: guessing half or double the real size scores the same.
 * Sessions: a five-object daily challenge or an endless run. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export type Dim = 'height' | 'length' | 'diameter' | 'wingspan';
export type Family =
  | 'skyscraper'
  | 'tower'
  | 'lighthouse'
  | 'statue'
  | 'pyramid'
  | 'dam'
  | 'wheel'
  | 'coaster'
  | 'tree'
  | 'rocket'
  | 'bridge'
  | 'ship'
  | 'sailship'
  | 'submarine'
  | 'plane'
  | 'wings'
  | 'car'
  | 'train'
  | 'coin'
  | 'planet'
  | 'star'
  | 'person'
  | 'card'
  | 'disc'
  | 'pitch';

export interface SizeData {
  source: string;
  /** [Wikidata id, family, dimension, metres, English name, Spanish name, Wikipedia sitelinks]. */
  objects: [string, Family, Dim, number, string, string, number][];
}

export interface Thing {
  /** Wikidata id, or `ref:<name>` for a built-in standard reference. */
  id: string;
  family: Family;
  dim: Dim;
  metres: number;
  name: { en: string; es: string };
  fame: number;
}

/**
 * Standard references (not from Wikidata): a typical adult, an ID-1 card (ISO/IEC 7810: 85.60 mm
 * wide), a CD (ECMA-130: 120 mm across) and a football pitch (the 105 m length FIFA recommends).
 */
export const BUILT_IN: Thing[] = [
  {
    id: 'ref:person',
    family: 'person',
    dim: 'height',
    metres: 1.75,
    name: { en: 'An adult (1.75 m)', es: 'Una persona adulta (1,75 m)' },
    fame: 999,
  },
  {
    id: 'ref:card',
    family: 'card',
    dim: 'length',
    metres: 0.0856,
    name: { en: 'A bank card', es: 'Una tarjeta bancaria' },
    fame: 999,
  },
  {
    id: 'ref:cd',
    family: 'disc',
    dim: 'diameter',
    metres: 0.12,
    name: { en: 'A CD', es: 'Un CD' },
    fame: 999,
  },
  {
    id: 'ref:pitch',
    family: 'pitch',
    dim: 'length',
    metres: 105,
    name: { en: 'A football pitch', es: 'Un campo de fútbol' },
    fame: 999,
  },
];

export type Topic = 'all' | 'structures' | 'transport' | 'space';
export const TOPICS: Topic[] = ['all', 'structures', 'transport', 'space'];
const TOPIC_OF: Record<Family, Topic> = {
  skyscraper: 'structures',
  tower: 'structures',
  lighthouse: 'structures',
  statue: 'structures',
  pyramid: 'structures',
  dam: 'structures',
  wheel: 'structures',
  coaster: 'structures',
  tree: 'structures',
  bridge: 'structures',
  rocket: 'transport',
  ship: 'transport',
  sailship: 'transport',
  submarine: 'transport',
  plane: 'transport',
  wings: 'transport',
  car: 'transport',
  train: 'transport',
  coin: 'all',
  planet: 'space',
  star: 'space',
  person: 'all',
  card: 'all',
  disc: 'all',
  pitch: 'all',
};
export const topicOf = (f: Family) => TOPIC_OF[f];

/** Families compared on the same axis: vertical heights, horizontal lengths, discs. */
export type Axis = 'vertical' | 'horizontal' | 'disc';
const AXIS: Record<Family, Axis> = {
  skyscraper: 'vertical',
  tower: 'vertical',
  lighthouse: 'vertical',
  statue: 'vertical',
  pyramid: 'vertical',
  dam: 'vertical',
  wheel: 'vertical',
  coaster: 'vertical',
  tree: 'vertical',
  rocket: 'vertical',
  person: 'vertical',
  bridge: 'horizontal',
  ship: 'horizontal',
  sailship: 'horizontal',
  submarine: 'horizontal',
  plane: 'horizontal',
  wings: 'horizontal',
  car: 'horizontal',
  train: 'horizontal',
  card: 'horizontal',
  pitch: 'horizontal',
  coin: 'disc',
  disc: 'disc',
  planet: 'disc',
  star: 'disc',
};
export const axisOf = (f: Family) => AXIS[f];

export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
/** Minimum Wikipedia sitelinks (fame) of mystery objects, and the reference ratio range. */
export const LEVELS: Record<Difficulty, { fame: number; ratio: [number, number] }> = {
  easy: { fame: 30, ratio: [1.25, 3] },
  normal: { fame: 15, ratio: [1.3, 5] },
  hard: { fame: 0, ratio: [1.4, 8] },
};

export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;
/** The guess range around the reference: from 1/GUESS_SPAN to GUESS_SPAN times its size. */
export const GUESS_SPAN = 40;

export function thingAt(data: SizeData, i: number): Thing {
  const [id, family, dim, metres, en, es, fame] = data.objects[i]!;
  return { id, family, dim, metres, name: { en, es }, fame };
}

/** A round's reference: an object index, or a built-in reference id. */
export type RefId = number | string;
export function refThing(data: SizeData, ref: RefId): Thing {
  if (typeof ref === 'number') return thingAt(data, ref);
  const t = BUILT_IN.find((b) => b.id === ref);
  if (!t) throw new Error(`Unknown reference ${ref}`);
  return t;
}

/* ---------- pools ---------- */

const poolCache = new WeakMap<SizeData, Map<string, number[]>>();
export function pool(data: SizeData, difficulty: Difficulty, topic: Topic): number[] {
  let m = poolCache.get(data);
  if (!m) poolCache.set(data, (m = new Map()));
  const key = `${difficulty}:${topic}`;
  const hit = m.get(key);
  if (hit) return hit;
  const min = LEVELS[difficulty].fame;
  const out: number[] = [];
  data.objects.forEach(([, family, , , , , fame], i) => {
    if (fame >= min && (topic === 'all' || TOPIC_OF[family] === topic)) out.push(i);
  });
  m.set(key, out);
  return out;
}

/** Objects grouped by family (a family is drawn first so cars do not crowd everything out). */
function byFamily(data: SizeData, ids: number[]): Map<Family, number[]> {
  const g = new Map<Family, number[]>();
  for (const i of ids) {
    const f = data.objects[i]![1];
    let l = g.get(f);
    if (!l) g.set(f, (l = []));
    l.push(i);
  }
  return g;
}

/* ---------- rounds ---------- */

export interface Round {
  target: number;
  ref: RefId;
  /** The player's locked guess in metres (null while guessing). */
  guess: number | null;
  score: number | null;
}

/**
 * The reference for a target: a well-known object on the same axis, between `ratio[0]` and
 * `ratio[1]` times bigger or smaller (built-in standards included); the closest-ratio candidate
 * if none fits.
 */
export function pickReference(
  data: SizeData,
  target: number,
  rng: Rng,
  difficulty: Difficulty,
): RefId {
  const t = thingAt(data, target);
  const axis = AXIS[t.family];
  const [lo, hi] = LEVELS[difficulty].ratio;
  const fits = (m: number) => {
    const r = Math.max(m / t.metres, t.metres / m);
    return r >= lo && r <= hi;
  };
  const candidates: RefId[] = [];
  data.objects.forEach(([id, family, , metres, , , fame], i) => {
    if (i !== target && id !== t.id && AXIS[family] === axis && fame >= 25 && fits(metres))
      candidates.push(i);
  });
  for (const b of BUILT_IN) if (AXIS[b.family] === axis && fits(b.metres)) candidates.push(b.id);
  if (candidates.length) return rng.pick(candidates);
  // Nothing in range: the same-axis object (or standard) with the nearest ratio to the range.
  let best: RefId = BUILT_IN.find((b) => AXIS[b.family] === axis)?.id ?? (target === 0 ? 1 : 0);
  let bestGap = Infinity;
  const consider = (ref: RefId, m: number) => {
    const r = Math.max(m / t.metres, t.metres / m);
    const gap = r < lo ? lo / r : r > hi ? r / hi : 1;
    if (gap < bestGap) {
      bestGap = gap;
      best = ref;
    }
  };
  data.objects.forEach(([id, family, , metres], i) => {
    if (i !== target && id !== t.id && AXIS[family] === axis) consider(i, metres);
  });
  for (const b of BUILT_IN) if (AXIS[b.family] === axis) consider(b.id, b.metres);
  return best;
}

export function pickTarget(
  data: SizeData,
  rng: Rng,
  difficulty: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
): number {
  let ids = pool(data, difficulty, topic);
  const fresh = avoid.size ? ids.filter((i) => !avoid.has(i)) : ids;
  if (fresh.length) ids = fresh;
  const groups = [...byFamily(data, ids).values()];
  return rng.pick(rng.pick(groups));
}

/**
 * Score 0–100 from the size ratio, symmetric in log space: exact → 100, ±10 % → 90, ±25 % → 77,
 * half or double → 45, a third or triple → 28, ten times off → 7.
 */
export function scoreGuess(guess: number, actual: number): number {
  if (!(guess > 0) || !(actual > 0)) return 0;
  return Math.round(100 * Math.exp(-1.152 * Math.abs(Math.log(guess / actual))));
}

export const guessRange = (refMetres: number): [number, number] => [
  refMetres / GUESS_SPAN,
  refMetres * GUESS_SPAN,
];

/* ---------- sessions ---------- */

export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  topic: Topic;
  limit: number;
  rng: RngState;
  rounds: Round[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 7, 2246822519) ^ 0x51ce_5e75) >>> 0;

function addRound(s: Session, data: SizeData, avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  // In a session, never repeat an object or a family twice in a row.
  const used = new Set([...avoid, ...s.rounds.map((r) => r.target)]);
  const lastFamily = s.rounds.length
    ? data.objects[s.rounds[s.rounds.length - 1]!.target]![1]
    : null;
  let target = pickTarget(data, rng, s.difficulty, s.topic, used);
  for (let k = 0; k < 8 && data.objects[target]![1] === lastFamily; k++)
    target = pickTarget(data, rng, s.difficulty, s.topic, used);
  const ref = pickReference(data, target, rng, s.difficulty);
  const rounds = [...s.rounds, { target, ref, guess: null, score: null }];
  return { ...s, rng: rng.state, rounds: rounds.slice(-KEEP_ROUNDS) };
}

export function newDaily(data: SizeData, day: number): Session {
  return addRound(
    {
      mode: 'daily',
      day,
      difficulty: 'normal',
      topic: 'all',
      limit: DAILY_ROUNDS,
      rng: new Rng(dailySeed(day)).state,
      rounds: [],
      count: 0,
      total: 0,
      status: 'playing',
    },
    data,
    new Set(),
  );
}

export function newEndless(
  data: SizeData,
  seed: number,
  difficulty: Difficulty,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
): Session {
  return addRound(
    {
      mode: 'endless',
      day: -1,
      difficulty,
      topic,
      limit,
      rng: new Rng(seed >>> 0).state,
      rounds: [],
      count: 0,
      total: 0,
      status: 'playing',
    },
    data,
    avoid,
  );
}

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaitingGuess = (s: Session) => s.status === 'playing' && current(s).guess === null;

/** Locks in a guess (metres) for the current object; it must lie in the guess range. */
export function lockIn(s: Session, data: SizeData, guess: number): Session {
  if (!awaitingGuess(s)) throw new Error('No object is waiting for a guess');
  const r = current(s);
  const [lo, hi] = guessRange(refThing(data, r.ref).metres);
  if (!Number.isFinite(guess) || guess < lo * 0.999 || guess > hi * 1.001)
    throw new Error('Guess outside the allowed range');
  const score = scoreGuess(guess, thingAt(data, r.target).metres);
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...r, guess, score }],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

export function next(s: Session, data: SizeData, avoid: ReadonlySet<number> = new Set()): Session {
  if (s.status !== 'playing' || current(s).guess === null) throw new Error('Nothing to advance');
  return addRound(s, data, avoid);
}

export function finish(s: Session): Session {
  const rounds = current(s).guess === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) => (n >= 90 ? '🟩' : n >= 70 ? '🟨' : n >= 45 ? '🟧' : '🟥');
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => sq(r.score ?? 0)).join('')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, data?: SizeData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  const okRef = (ref: unknown) =>
    (isNum(ref) && (!data || ref < data.objects.length)) ||
    (typeof ref === 'string' && BUILT_IN.some((b) => b.id === ref));
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    TOPICS.includes(s.topic) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        isNum(r.target) &&
        r.target >= 0 &&
        (!data || r.target < data.objects.length) &&
        okRef(r.ref) &&
        (r.guess === null || (isNum(r.guess) && r.guess > 0 && isNum(r.score))),
    )
  );
}
