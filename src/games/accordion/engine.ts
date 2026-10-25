/**
 * Accordion. Cards are dealt one at a time from a shuffled stock into a single row of piles, left
 * to right. At any time a pile may move onto the pile **immediately to its left** or **three to its
 * left**, if their top cards match in **suit or rank**; the moved pile goes on top and the row
 * closes up. Won when every card has been dealt and a single pile remains; lost when the stock is
 * empty and no move is left. Score: the piles left (lower is better).
 *
 * Moves: "deal", "p5-1" (pile 5 onto pile 4), "p5-3" (pile 5 onto pile 2).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck, suitOf } from '../shared/cards/cards';

export interface AccordionState {
  seed: number;
  /** Piles from left to right; each pile's top card is its last. */
  piles: number[][];
  stock: number[];
  history: string[];
  result: 'won' | 'lost' | null;
}

export function dealAccordion(seed: number): AccordionState {
  return { seed, piles: [], stock: shuffledDeck(seed), history: [], result: null };
}

const top = (p: readonly number[]) => p[p.length - 1]!;
export const matches = (a: number, b: number) => suitOf(a) === suitOf(b) || rankOf(a) === rankOf(b);

export function legalAccordionMoves(s: AccordionState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.piles.forEach((p, i) => {
    for (const d of [1, 3])
      if (i - d >= 0 && matches(top(p), top(s.piles[i - d]!))) out.push(`p${i}-${d}`);
  });
  if (s.stock.length) out.push('deal');
  return out;
}

export function isLegalAccordionMove(s: AccordionState, m: string): boolean {
  if (s.result || typeof m !== 'string') return false;
  if (m === 'deal') return s.stock.length > 0;
  const hit = /^p(\d+)-([13])$/.exec(m);
  if (!hit) return false;
  const i = Number(hit[1]);
  const d = Number(hit[2]);
  return i < s.piles.length && i - d >= 0 && matches(top(s.piles[i]!), top(s.piles[i - d]!));
}

function shift(n: AccordionState, m: string) {
  if (m === 'deal') {
    n.piles.push([n.stock.pop()!]);
    return;
  }
  const [i, d] = m.slice(1).split('-').map(Number) as [number, number];
  const moved = n.piles.splice(i, 1)[0]!;
  n.piles[i - d]!.push(...moved);
}

function settle(n: AccordionState) {
  if (n.stock.length === 0 && n.piles.length === 1) n.result = 'won';
  else if (legalAccordionMoves({ ...n, result: null }).length === 0) n.result = 'lost';
}

const clone = (s: AccordionState): AccordionState => ({
  ...s,
  piles: s.piles.map((p) => p.slice()),
  stock: s.stock.slice(),
  history: s.history.slice(),
});

/** A legal move without checks or settling the result (used by search). */
export function moveAccordion(s: AccordionState, m: string): AccordionState {
  const n = clone(s);
  n.history.push(m);
  shift(n, m);
  return n;
}

export function applyAccordionMove(s: AccordionState, m: string): AccordionState {
  if (!isLegalAccordionMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = moveAccordion(s, m);
  settle(n);
  return n;
}

export function replayAccordion(seed: number, history: readonly string[]): AccordionState {
  const s = dealAccordion(seed);
  for (const m of history) {
    if (!isLegalAccordionMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    s.history.push(m);
    shift(s, m);
    settle(s);
  }
  return s;
}

export function isValidAccordionState(data: unknown): data is AccordionState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayAccordion(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

/** Piles left plus cards still to deal (the deal's "strokes"). */
export const pilesLeft = (s: AccordionState) => s.piles.length + s.stock.length;
