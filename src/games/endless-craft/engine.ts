/**
 * Endless Craft rules: a workspace of element chips and a growing list of discoveries. Dropping one
 * chip on another combines them by the recipe book; a new result is a discovery. Unknown pairs do
 * nothing. Pure and serializable.
 */
import { BASICS, ELEMENT_ROWS, RECIPE_ROWS } from './data';

export interface Element {
  id: string;
  emoji: string;
  en: string;
  es: string;
}

export const ELEMENTS: Record<string, Element> = {};
for (const line of ELEMENT_ROWS.trim().split('\n')) {
  const [id, emoji, en, es] = line.split('|');
  ELEMENTS[id!] = { id: id!, emoji: emoji!, en: en!, es: es! };
}
export const ELEMENT_IDS = Object.keys(ELEMENTS);

export const pairKey = (a: string, b: string) => (a < b ? `${a}+${b}` : `${b}+${a}`);

/** pair key → result. */
export const RECIPES = new Map<string, string>();
/** result → the pairs that make it. */
export const MADE_FROM = new Map<string, [string, string][]>();
for (const line of RECIPE_ROWS.trim().split('\n')) {
  const [lhs, out] = line.split('=');
  const [a, b] = lhs!.split('+');
  RECIPES.set(pairKey(a!, b!), out!);
  MADE_FROM.set(out!, [...(MADE_FROM.get(out!) ?? []), [a!, b!]]);
}

export function combine(a: string, b: string): string | null {
  return RECIPES.get(pairKey(a, b)) ?? null;
}

export interface Chip {
  uid: number;
  id: string;
  /** Position in the workspace, as fractions of its size. */
  x: number;
  y: number;
}

export interface Craft {
  /** Discoveries in the order they were made. */
  found: string[];
  chips: Chip[];
  nextUid: number;
  /** Pairs tried (keys), for statistics and the AI environment. */
  tried: string[];
  /** The most recent combination: what it made and whether that was new. */
  last: { a: string; b: string; out: string | null; fresh: boolean } | null;
}

export function newCraft(): Craft {
  return {
    found: [...BASICS],
    chips: BASICS.map((id, i) => ({ uid: i + 1, id, x: i % 2 ? 0.7 : 0.3, y: i < 2 ? 0.35 : 0.65 })),
    nextUid: BASICS.length + 1,
    tried: [],
    last: null,
  };
}

export function place(c: Craft, id: string, x: number, y: number): Craft {
  if (!c.found.includes(id)) return c;
  return { ...c, chips: [...c.chips, { uid: c.nextUid, id, x, y }], nextUid: c.nextUid + 1 };
}

export function moveChip(c: Craft, uid: number, x: number, y: number): Craft {
  return {
    ...c,
    chips: c.chips.map((k) => (k.uid === uid ? { ...k, x: clamp(x), y: clamp(y) } : k)),
  };
}

const clamp = (v: number) => Math.max(0.02, Math.min(0.98, v));

export function removeChip(c: Craft, uid: number): Craft {
  return { ...c, chips: c.chips.filter((k) => k.uid !== uid) };
}

export function duplicate(c: Craft, uid: number): Craft {
  const k = c.chips.find((x) => x.uid === uid);
  if (!k) return c;
  return {
    ...c,
    chips: [...c.chips, { uid: c.nextUid, id: k.id, x: clamp(k.x + 0.04), y: clamp(k.y + 0.05) }],
    nextUid: c.nextUid + 1,
  };
}

export function clearChips(c: Craft): Craft {
  return { ...c, chips: [] };
}

/** Drop chip `a` onto chip `b`: on a recipe both become the result where `b` was. */
export function dropOn(c: Craft, a: number, b: number): Craft {
  const ka = c.chips.find((k) => k.uid === a);
  const kb = c.chips.find((k) => k.uid === b);
  if (!ka || !kb || a === b) return c;
  const out = combine(ka.id, kb.id);
  const key = pairKey(ka.id, kb.id);
  const tried = c.tried.includes(key) ? c.tried : [...c.tried, key];
  if (!out) return { ...c, tried, last: { a: ka.id, b: kb.id, out: null, fresh: false } };
  const fresh = !c.found.includes(out);
  return {
    ...c,
    tried,
    found: fresh ? [...c.found, out] : c.found,
    chips: [
      ...c.chips.filter((k) => k.uid !== a && k.uid !== b),
      { uid: c.nextUid, id: out, x: kb.x, y: kb.y },
    ],
    nextUid: c.nextUid + 1,
    last: { a: ka.id, b: kb.id, out, fresh },
  };
}

/** Combine two discovered elements directly (keyboard play and the AI environment). */
export function combineIds(c: Craft, a: string, b: string): Craft {
  if (!c.found.includes(a) || !c.found.includes(b)) return c;
  const out = combine(a, b);
  const key = pairKey(a, b);
  const tried = c.tried.includes(key) ? c.tried : [...c.tried, key];
  if (!out) return { ...c, tried, last: { a, b, out: null, fresh: false } };
  const fresh = !c.found.includes(out);
  return { ...c, tried, found: fresh ? [...c.found, out] : c.found, last: { a, b, out, fresh } };
}

/** Elements reachable from the basics (the whole book, when it is consistent). */
export function reachable(): Set<string> {
  const have = new Set(BASICS);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [key, out] of RECIPES) {
      if (have.has(out)) continue;
      const [a, b] = key.split('+');
      if (have.has(a!) && have.has(b!)) {
        have.add(out);
        grew = true;
      }
    }
  }
  return have;
}

export function isCraft(v: unknown): v is Craft {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Craft;
  return (
    Array.isArray(c.found) &&
    c.found.every((id) => typeof id === 'string' && id in ELEMENTS) &&
    Array.isArray(c.chips) &&
    c.chips.every(
      (k) =>
        typeof k.uid === 'number' &&
        k.id in ELEMENTS &&
        Number.isFinite(k.x) &&
        Number.isFinite(k.y),
    ) &&
    typeof c.nextUid === 'number' &&
    Array.isArray(c.tried)
  );
}
