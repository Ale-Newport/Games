/**
 * Year Guess rules (pure). Each round shows a real dated event — a battle, treaty, discovery,
 * film, painting, opening… from Wikidata — and the player guesses its year on a timeline that is
 * compressed with age (a year is wide near today, a century is narrow in antiquity). Points fall
 * with the error measured against the event's age, so “off by 20 years” is a miss for a 2010 film
 * and a near hit for a medieval battle. Sessions: a five-event daily (one per era) or an endless
 * run by era, topic and difficulty. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

export type Kind =
  | 'battle'
  | 'war'
  | 'treaty'
  | 'discovery'
  | 'spaceflight'
  | 'film'
  | 'book'
  | 'painting'
  | 'album'
  | 'game'
  | 'opened'
  | 'company'
  | 'disaster';

export interface EventData {
  kinds: Kind[];
  /** [kind index, year (−490 = 490 BC), English, Spanish, description en, description es, Wikidata id, sitelinks]. */
  events: [number, number, string, string, string, string, string, number][];
}

export interface Event {
  index: number;
  kind: Kind;
  year: number;
  name: { en: string; es: string };
  description: { en: string; es: string };
  qid: string;
  fame: number;
}

export function eventAt(d: EventData, i: number): Event {
  const e = d.events[i];
  if (!e) throw new Error(`Unknown event ${i}`);
  const [k, year, en, es, den, des, qid, fame] = e;
  return {
    index: i,
    kind: d.kinds[k]!,
    year,
    name: { en, es },
    description: { en: den, es: des },
    qid,
    fame,
  };
}

/* ---------- years and the timeline ---------- */

/** The present the game measures ages from, and the timeline's ends. */
export const NOW = 2026;
export const MIN_YEAR = -3000;
export const MAX_YEAR = 2025;

/** Years run …, −2 (2 BC), −1 (1 BC), 1, 2, … — there is no year 0. */
export const astro = (y: number) => (y < 0 ? y + 1 : y);
export const fromAstro = (a: number) => (a <= 0 ? a - 1 : a);
export const isYear = (y: number) =>
  Number.isInteger(y) && y !== 0 && y >= MIN_YEAR && y <= MAX_YEAR;
/** Years between two dates, counting across the BC/AD boundary correctly. */
export const yearsApart = (a: number, b: number) => Math.abs(astro(a) - astro(b));

/** Timeline position 0–1 (0 = 3000 BC, 1 = 2025): logarithmic in age + 10. */
const ageAt = (y: number) => NOW + 10 - astro(y);
const SPAN = Math.log(ageAt(MIN_YEAR) / ageAt(MAX_YEAR));
export const positionOf = (y: number) => Math.log(ageAt(MIN_YEAR) / ageAt(y)) / SPAN;
export function yearAt(p: number): number {
  const c = Math.min(1, Math.max(0, p));
  const age = ageAt(MIN_YEAR) / Math.exp(c * SPAN);
  const y = fromAstro(Math.round(NOW + 10 - age));
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, y));
}

/**
 * Score: 100 × 2^(−error / h), with the half-life h = max(2, 4 % of the event's age): a 2000 film
 * off by 1 year → 71, by 5 → 18; a 1066 battle off by 20 → 70; a 490 BC battle off by 100 → 50.
 */
export const halfLife = (answer: number) => Math.max(2, 0.04 * (NOW - astro(answer)));
export function scoreYear(guess: number, answer: number): number {
  return Math.round(100 * Math.pow(2, -yearsApart(guess, answer) / halfLife(answer)));
}

/* ---------- pools ---------- */

export type Era = 'ancient' | 'medieval' | 'early' | 'c19' | 'c20' | 'modern';
export const ERAS: Era[] = ['ancient', 'medieval', 'early', 'c19', 'c20', 'modern'];
export const ERA_START: Record<Era, number> = {
  ancient: MIN_YEAR,
  medieval: 500,
  early: 1500,
  c19: 1800,
  c20: 1900,
  modern: 1960,
};
export const eraOf = (y: number): Era =>
  y >= 1960
    ? 'modern'
    : y >= 1900
      ? 'c20'
      : y >= 1800
        ? 'c19'
        : y >= 1500
          ? 'early'
          : y >= 500
            ? 'medieval'
            : 'ancient';

export type Topic = 'all' | 'conflict' | 'science' | 'arts' | 'society';
export const TOPICS: Topic[] = ['all', 'conflict', 'science', 'arts', 'society'];
export const TOPIC_KINDS: Record<Exclude<Topic, 'all'>, Kind[]> = {
  conflict: ['battle', 'war', 'treaty'],
  science: ['discovery', 'spaceflight'],
  arts: ['film', 'book', 'painting', 'album', 'game'],
  society: ['opened', 'company', 'disaster'],
};
export const topicOf = (k: Kind) =>
  (Object.keys(TOPIC_KINDS) as Exclude<Topic, 'all'>[]).find((t) => TOPIC_KINDS[t].includes(k))!;
export type EraFilter = 'all' | Era;
export const ERA_FILTERS: EraFilter[] = ['all', ...ERAS];
export type Difficulty = 'easy' | 'normal' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** Fame rank within the kind: Easy = the most-linked 30 % of each kind, Normal = 65 %, Hard = all. */
const rankCache = new WeakMap<EventData, Float64Array>();
function fameRank(d: EventData): Float64Array {
  let r = rankCache.get(d);
  if (r) return r;
  r = new Float64Array(d.events.length);
  const byKind = new Map<number, number[]>();
  d.events.forEach((e, i) => byKind.set(e[0], [...(byKind.get(e[0]) ?? []), i]));
  for (const ids of byKind.values()) {
    ids.sort((a, b) => d.events[b]![7] - d.events[a]![7] || a - b);
    ids.forEach((id, k) => (r![id] = ids.length > 1 ? k / (ids.length - 1) : 0));
  }
  rankCache.set(d, r);
  return r;
}
const CUT: Record<Difficulty, number> = { easy: 0.3, normal: 0.65, hard: 1 };

const poolCache = new WeakMap<EventData, Map<string, number[]>>();
export function pool(d: EventData, diff: Difficulty, era: EraFilter, topic: Topic): number[] {
  let c = poolCache.get(d);
  if (!c) poolCache.set(d, (c = new Map()));
  const key = `${diff}:${era}:${topic}`;
  const hit = c.get(key);
  if (hit) return hit;
  const rank = fameRank(d);
  const out: number[] = [];
  d.events.forEach((e, i) => {
    const kind = d.kinds[e[0]]!;
    if (rank[i]! > CUT[diff] + 1e-9) return;
    if (era !== 'all' && eraOf(e[1]) !== era) return;
    if (topic !== 'all' && topicOf(kind) !== topic) return;
    out.push(i);
  });
  c.set(key, out);
  return out;
}

/* ---------- sessions ---------- */

export interface Round {
  event: number;
  guess: number | null;
  score: number | null;
}
export interface Session {
  mode: 'daily' | 'endless';
  day: number;
  difficulty: Difficulty;
  era: EraFilter;
  topic: Topic;
  /** Daily: the era of each round, in play order. */
  plan: Era[];
  limit: number;
  rng: RngState;
  rounds: Round[];
  count: number;
  total: number;
  status: 'playing' | 'done';
}
export const DAILY_ROUNDS = 5;
const KEEP_ROUNDS = 12;
/** The daily's five eras (ancient and medieval share one). */
const DAILY_ERAS: Era[][] = [['ancient', 'medieval'], ['early'], ['c19'], ['c20'], ['modern']];

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(date = new Date()): number {
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86_400_000,
  );
}
const dailySeed = (day: number) => (Math.imul(day + 83, 2654435761) ^ 0x7ea2_9e55) >>> 0;

function addRound(s: Session, d: EventData, avoid: ReadonlySet<number>): Session {
  const rng = new Rng(s.rng);
  // The daily is the same for everyone: a player's history never changes it.
  const used = new Set([...(s.mode === 'daily' ? [] : avoid), ...s.rounds.map((r) => r.event)]);
  let ids: number[];
  if (s.mode === 'daily') {
    const eras = new Set<Era>(
      s.plan[s.rounds.length] === 'ancient' ? ['ancient', 'medieval'] : [s.plan[s.rounds.length]!],
    );
    ids = pool(d, s.difficulty, 'all', 'all').filter((i) => eras.has(eraOf(d.events[i]![1])));
  } else {
    ids = pool(d, s.difficulty, s.era, s.topic);
    if (!ids.length) ids = pool(d, 'hard', s.era, s.topic);
    if (!ids.length) ids = pool(d, 'hard', 'all', s.topic);
  }
  const fresh = ids.filter((i) => !used.has(i));
  if (fresh.length) ids = fresh;
  // Kind first (films and battles would otherwise crowd the rest out), never twice in a row.
  const byKind = new Map<number, number[]>();
  for (const i of ids) byKind.set(d.events[i]![0], [...(byKind.get(d.events[i]![0]) ?? []), i]);
  const earlier = new Set(s.rounds.map((r) => d.events[r.event]![0]));
  let kinds = [...byKind.keys()];
  const unseen = kinds.filter((k) => !earlier.has(k));
  if (s.mode === 'daily' && unseen.length) kinds = unseen;
  const last = s.rounds.length ? d.events[s.rounds[s.rounds.length - 1]!.event]![0] : null;
  if (kinds.length > 1 && last !== null) kinds = kinds.filter((k) => k !== last);
  const event = rng.pick(byKind.get(rng.pick(kinds))!);
  const rounds = [...s.rounds, { event, guess: null, score: null }];
  return { ...s, rng: rng.state, rounds: s.mode === 'daily' ? rounds : rounds.slice(-KEEP_ROUNDS) };
}

function base(
  mode: Session['mode'],
  day: number,
  diff: Difficulty,
  era: EraFilter,
  topic: Topic,
  limit: number,
  seed: number,
): Session {
  return {
    mode,
    day,
    difficulty: diff,
    era,
    topic,
    plan: [],
    limit,
    rng: new Rng(seed >>> 0).state,
    rounds: [],
    count: 0,
    total: 0,
    status: 'playing',
  };
}

export function newDaily(d: EventData, day: number): Session {
  const s = base('daily', day, 'normal', 'all', 'all', DAILY_ROUNDS, dailySeed(day));
  const rng = new Rng(s.rng);
  // One event per era, in a shuffled order so the round number gives nothing away.
  const plan = rng.shuffle(DAILY_ERAS.map((e) => e[0]!));
  return addRound({ ...s, plan, rng: rng.state }, d, new Set());
}
export const newEndless = (
  d: EventData,
  seed: number,
  diff: Difficulty,
  era: EraFilter,
  topic: Topic,
  avoid: ReadonlySet<number> = new Set(),
  limit = 0,
) => addRound(base('endless', -1, diff, era, topic, limit, seed), d, avoid);

export const current = (s: Session): Round => s.rounds[s.rounds.length - 1]!;
export const awaiting = (s: Session) => s.status === 'playing' && current(s).guess === null;

export function guess(s: Session, d: EventData, year: number): Session {
  if (!awaiting(s)) throw new Error('No event is waiting for a guess');
  if (!isYear(year)) throw new Error('Not a year on the timeline');
  const e = eventAt(d, current(s).event);
  const score = scoreYear(year, e.year);
  const count = s.count + 1;
  return {
    ...s,
    rounds: [...s.rounds.slice(0, -1), { ...current(s), guess: year, score }],
    count,
    total: s.total + score,
    status: s.limit && count >= s.limit ? 'done' : 'playing',
  };
}

export function next(s: Session, d: EventData, avoid: ReadonlySet<number> = new Set()): Session {
  if (s.status !== 'playing' || current(s).guess === null) throw new Error('Nothing to advance');
  return addRound(s, d, avoid);
}

export function finish(s: Session): Session {
  const rounds = current(s).guess === null ? s.rounds.slice(0, -1) : s.rounds;
  return { ...s, rounds, status: 'done' };
}

export function shareText(s: Session, title: string): string {
  const sq = (n: number) =>
    n >= 90 ? '🟩' : n >= 60 ? '🟨' : n >= 30 ? '🟧' : n > 0 ? '🟥' : '⬛';
  const head =
    s.mode === 'daily'
      ? `${title} #${s.day + 1} — ${s.total}/${s.limit * 100}`
      : `${title} — ${s.total}/${s.count * 100}`;
  return `${head}\n${s.rounds.map((r) => sq(r.score ?? 0)).join('')}`;
}

/* ---------- validation ---------- */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function isSession(v: unknown, d?: EventData): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    (s.mode === 'daily' || s.mode === 'endless') &&
    DIFFICULTIES.includes(s.difficulty) &&
    ERA_FILTERS.includes(s.era) &&
    TOPICS.includes(s.topic) &&
    Array.isArray(s.plan) &&
    s.plan.every((e) => ERAS.includes(e)) &&
    [s.day, s.limit, s.count, s.total].every(isNum) &&
    Array.isArray(s.rng) &&
    s.rng.length === 4 &&
    (s.status === 'playing' || s.status === 'done') &&
    Array.isArray(s.rounds) &&
    (s.rounds.length > 0 || s.status === 'done') &&
    s.rounds.every(
      (r) =>
        isNum(r.event) &&
        r.event >= 0 &&
        (!d || r.event < d.events.length) &&
        (r.guess === null ? r.score === null : isYear(r.guess) && isNum(r.score)),
    )
  );
}

/* ---------- typed years ---------- */

/**
 * Reads a typed year: “1815”, “1,815”, “-44”, “44 BC”, “44 BCE”, “44 a. C.”, “44 aC”, “AD 33”,
 * “33 d. C.”. Returns null for anything else (including year 0).
 */
export function parseYear(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const m =
    /^(ad |a\.? ?d\.? )?(-)?(\d{1,3}(?:[.,]\d{3})*|\d+)( ?(bc|bce|b\.c\.|b\.c\.e\.|a\.? ?c\.?|a\.? ?de ?c\.?|ad|ce|d\.? ?c\.?))?$/.exec(
      t,
    );
  if (!m) return null;
  const n = Number(m[3]!.replace(/[.,]/g, ''));
  if (!Number.isInteger(n) || n === 0) return null;
  const era = (m[5] ?? '').replace(/[\s.]/g, '');
  const bc = m[2] === '-' || era === 'bc' || era === 'bce' || era === 'ac' || era === 'adec';
  if (m[2] === '-' && era) return null;
  const y = bc ? -n : n;
  return isYear(y) ? y : null;
}
