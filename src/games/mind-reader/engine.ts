/**
 * The mind reader: a Bayesian guesser. Every entity starts equally likely; each answer multiplies
 * an entity's weight by how well the answer fits it (soft, so a wrong answer is survivable). The
 * next question is the one with the lowest expected entropy afterwards. It guesses when one entity
 * is clearly ahead (or after 20, 30 and 40 questions); three wrong guesses or 45 questions and it
 * gives up. Answers in finished games can be learned: they shift that entity's per-question value.
 */
import { DOMAINS, type Domain, type Entity } from './knowledge';

export type Answer = 'yes' | 'probably' | 'unknown' | 'probably_not' | 'no';
export const ANSWERS: Answer[] = ['yes', 'no', 'unknown', 'probably', 'probably_not'];
export const VALUE: Record<Answer, number> = {
  yes: 1,
  probably: 0.75,
  unknown: 0.5,
  probably_not: 0.25,
  no: 0,
};

/** Learned answers: entity → question → [sum of answer values, count]. */
export type Learned = Record<string, Record<string, [number, number]>>;

export interface Session {
  domain: Domain['id'];
  answers: { q: string; a: Answer }[];
  rejected: string[];
  phase: 'asking' | 'guessing' | 'won' | 'lost';
  /** The question being asked, or the entity being guessed. */
  question: string | null;
  guess: string | null;
}

const MAX_QUESTIONS = 45;
const MAX_GUESSES = 3;
const GUESS_AT = [20, 30, 40];

export const domainOf = (s: Session) => DOMAINS[s.domain];

export function value(e: Entity, q: string, learned: Learned): number {
  const base = e.tags.includes(q) ? 1 : 0;
  const l = learned[e.id]?.[q];
  return l ? (base * 3 + l[0]) / (3 + l[1]) : base;
}

const fit = (a: number, v: number) => 0.05 + 0.9 * (1 - Math.abs(a - v));

/** Normalized probability of each entity given the answers so far. */
export function probabilities(s: Session, learned: Learned = {}): Map<string, number> {
  const d = domainOf(s);
  const w = new Map<string, number>();
  let total = 0;
  for (const e of d.entities) {
    if (s.rejected.includes(e.id)) continue;
    let p = 1;
    for (const { q, a } of s.answers) p *= fit(VALUE[a], value(e, q, learned));
    w.set(e.id, p);
    total += p;
  }
  for (const [k, v] of w) w.set(k, total ? v / total : 0);
  return w;
}

const entropy = (ps: number[]) => ps.reduce((h, p) => (p > 0 ? h - p * Math.log2(p) : h), 0);

/** The question that leaves the least uncertainty on average. */
export function bestQuestion(s: Session, learned: Learned = {}): string | null {
  const d = domainOf(s);
  const probs = probabilities(s, learned);
  const asked = new Set(s.answers.map((x) => x.q));
  let best: string | null = null;
  let bestH = Infinity;
  for (const q of d.questions) {
    if (asked.has(q.id)) continue;
    let pYes = 0;
    const yes: number[] = [];
    const no: number[] = [];
    for (const e of d.entities) {
      const p = probs.get(e.id);
      if (!p) continue;
      const v = value(e, q.id, learned);
      pYes += p * v;
      yes.push(p * fit(1, v));
      no.push(p * fit(0, v));
    }
    const sy = yes.reduce((a, b) => a + b, 0) || 1;
    const sn = no.reduce((a, b) => a + b, 0) || 1;
    const h = pYes * entropy(yes.map((x) => x / sy)) + (1 - pYes) * entropy(no.map((x) => x / sn));
    if (h < bestH - 1e-9) {
      bestH = h;
      best = q.id;
    }
  }
  return best;
}

export function ranked(s: Session, learned: Learned = {}): [string, number][] {
  return [...probabilities(s, learned)].sort((a, b) => b[1] - a[1]);
}

/** Decide what to do next: ask, guess or give up. */
function advance(s: Session, learned: Learned): Session {
  const n = s.answers.length;
  if (n >= MAX_QUESTIONS || s.rejected.length >= MAX_GUESSES)
    return { ...s, phase: 'lost', question: null, guess: null };
  const top = ranked(s, learned)[0];
  const next = bestQuestion(s, learned);
  if (!top) return { ...s, phase: 'lost', question: null, guess: null };
  const sure = top[1] > 0.8 && n >= 4;
  if (sure || GUESS_AT.includes(n) || !next)
    return { ...s, phase: 'guessing', question: null, guess: top[0] };
  return { ...s, phase: 'asking', question: next, guess: null };
}

export function newSession(domain: Domain['id'], learned: Learned = {}): Session {
  return advance(
    { domain, answers: [], rejected: [], phase: 'asking', question: null, guess: null },
    learned,
  );
}

export function answer(s: Session, a: Answer, learned: Learned = {}): Session {
  if (s.phase !== 'asking' || !s.question) return s;
  return advance({ ...s, answers: [...s.answers, { q: s.question, a }] }, learned);
}

/** The player's reply to a guess. */
export function judge(s: Session, right: boolean, learned: Learned = {}): Session {
  if (s.phase !== 'guessing' || !s.guess) return s;
  if (right) return { ...s, phase: 'won' };
  const rejected = [...s.rejected, s.guess];
  // Keep asking after a wrong guess (the guess points reset).
  const next = advance({ ...s, rejected, guess: null }, learned);
  return next.phase === 'guessing' && next.answers.length === s.answers.length
    ? { ...next, phase: 'asking', question: bestQuestion({ ...s, rejected }, learned), guess: null }
    : next;
}

export function undo(s: Session, learned: Learned = {}): Session {
  if (!s.answers.length || s.phase === 'won' || s.phase === 'lost') return s;
  const last = s.answers[s.answers.length - 1]!;
  return { ...s, answers: s.answers.slice(0, -1), phase: 'asking', question: last.q, guess: null };
  void learned;
}

/** Fold a finished game's answers into what has been learned about the entity. */
export function learn(learned: Learned, s: Session, entity: string): Learned {
  const mine = { ...(learned[entity] ?? {}) };
  for (const { q, a } of s.answers) {
    const [sum, n] = mine[q] ?? [0, 0];
    mine[q] = [sum + VALUE[a], n + 1];
  }
  return { ...learned, [entity]: mine };
}

export function isSession(v: unknown): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Session;
  return (
    s.domain in DOMAINS &&
    Array.isArray(s.answers) &&
    Array.isArray(s.rejected) &&
    ['asking', 'guessing', 'won', 'lost'].includes(s.phase)
  );
}
