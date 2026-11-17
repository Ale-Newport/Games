/**
 * Higher or Lower: one card shows a thing and its number; guess whether the next thing's number is
 * higher or lower. A right guess (ties count either way) scores a point and the new card becomes
 * the one to beat; a wrong guess ends the run. Decks are shuffled with a seed and reshuffled when
 * they run out.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import { BY_ID, CATEGORIES, ITEMS, type Category, type Item } from './data';

export type Mode = Category | 'mix';
export const MODES: Mode[] = [...CATEGORIES, 'mix'];
export type Guess = 'higher' | 'lower';

export interface Run {
  mode: Mode;
  rng: RngState;
  /** The card to beat and the card being guessed. */
  a: string;
  b: string;
  /** Cards not dealt yet in the current category deck. */
  deck: string[];
  score: number;
  over: boolean;
  last: { guess: Guess; right: boolean } | null;
}

function rand(rng: RngState): [number, RngState] {
  const [x, n] = nextUint32(rng);
  return [x / 2 ** 32, n];
}

function shuffled(ids: string[], rng: RngState): [string[], RngState] {
  const out = [...ids];
  let r = rng;
  for (let i = out.length - 1; i > 0; i--) {
    const [x, n] = rand(r);
    r = n;
    const j = Math.floor(x * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return [out, r];
}

/** The next card: from the same category (mix mode switches category every few cards). */
function deal(
  run: Pick<Run, 'mode' | 'rng' | 'deck' | 'score'>,
  current: Item | null,
): [string, string[], RngState] {
  let rng = run.rng;
  let deck = run.deck;
  const cat = current?.cat;
  if (!deck.length) {
    // Refill from the current card's category.
    let category: Category;
    if (cat) category = cat;
    else if (run.mode === 'mix') {
      const [x, r] = rand(rng);
      rng = r;
      category = CATEGORIES[Math.floor(x * CATEGORIES.length)]!;
    } else category = run.mode;
    const ids = ITEMS[category].map((i) => i.id).filter((id) => id !== current?.id);
    [deck, rng] = shuffled(ids, rng);
  }
  // Avoid identical values: they make the guess free.
  let k = deck.findIndex((id) => !current || BY_ID.get(id)!.value !== current.value);
  if (k < 0) k = 0;
  const id = deck[k]!;
  return [id, deck.filter((_, i) => i !== k), rng];
}

export function newRun(seed: number, mode: Mode): Run {
  let rng = seedRng(seed >>> 0);
  let category: Category;
  if (mode === 'mix') {
    const [x, r] = rand(rng);
    rng = r;
    category = CATEGORIES[Math.floor(x * CATEGORIES.length)]!;
  } else category = mode;
  const [deck, r2] = shuffled(
    ITEMS[category].map((i) => i.id),
    rng,
  );
  const a = deck[0]!;
  const base = { mode, rng: r2, deck: deck.slice(1), score: 0 };
  const [b, rest, r3] = deal(base, BY_ID.get(a)!);
  return { mode, rng: r3, a, b, deck: rest, score: 0, over: false, last: null };
}

export const itemA = (r: Run) => BY_ID.get(r.a)!;
export const itemB = (r: Run) => BY_ID.get(r.b)!;

export function isRight(r: Run, g: Guess): boolean {
  const a = itemA(r).value;
  const b = itemB(r).value;
  return g === 'higher' ? b >= a : b <= a;
}

export function guess(r: Run, g: Guess): Run {
  if (r.over) return r;
  const right = isRight(r, g);
  if (!right) return { ...r, over: true, last: { guess: g, right } };
  const score = r.score + 1;
  let deck = r.deck;
  let rng = r.rng;
  // Mix mode starts a new category every five cards.
  if (r.mode === 'mix' && score % 5 === 0) {
    const [x, r1] = rand(rng);
    rng = r1;
    const cat = CATEGORIES[Math.floor(x * CATEGORIES.length)]!;
    const [d, r2] = shuffled(
      ITEMS[cat].map((i) => i.id),
      rng,
    );
    rng = r2;
    const a = d[0]!;
    const [b, rest, r3] = deal({ mode: r.mode, rng, deck: d.slice(1), score }, BY_ID.get(a)!);
    return { ...r, a, b, deck: rest, rng: r3, score, last: { guess: g, right } };
  }
  const [b, rest, r3] = deal({ mode: r.mode, rng, deck, score }, itemB(r));
  deck = rest;
  return { ...r, a: r.b, b, deck, rng: r3, score, last: { guess: g, right } };
}

export function isRun(v: unknown): v is Run {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Run;
  return (
    MODES.includes(r.mode) &&
    BY_ID.has(r.a) &&
    BY_ID.has(r.b) &&
    Array.isArray(r.deck) &&
    r.deck.every((id) => BY_ID.has(id)) &&
    Array.isArray(r.rng) &&
    typeof r.score === 'number'
  );
}
