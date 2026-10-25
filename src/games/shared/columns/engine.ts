/**
 * Configurable column patience (#080 Yukon, #081 Scorpion, #082 Forty Thieves). A variant fixes:
 *
 * - the deck (one or two decks) and the deal: per column, face-down and face-up cards;
 * - the stock: none, turned one card at a time onto a waste (with a number of redeals), or dealt
 *   one card face up onto each of some columns;
 * - building on the columns: alternating colors, same suit, or any suit, always one rank lower;
 * - what moves: one card at a time, a sequence that follows the building rule, or any face-up card
 *   together with everything on top of it (Yukon, Scorpion);
 * - empty columns: any card, or only a king;
 * - foundations: built up by suit from the ace (a number of them), or none — complete king-to-ace
 *   runs of one suit are removed instead (Scorpion).
 *
 * A face-down card left on top turns up by itself. Won when every card is home (or every run
 * removed); lost when no move is left, or after the move limit. Score: cards home.
 *
 * Moves: "deal", "c3:5>c7", "c3>f2", "w>c3", "w>f1".
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { isRed, rankOf, shuffledDeck, suitOf } from '../cards/cards';

export interface ColumnsVariant {
  id: string;
  decks: 1 | 2;
  /** [face-down, face-up] cards per column. */
  deal: readonly (readonly [number, number])[];
  stock:
    { kind: 'none' } | { kind: 'waste'; redeals: number } | { kind: 'columns'; columns: number };
  build: 'alt' | 'suit' | 'any';
  move: 'single' | 'sequence' | 'group';
  empty: 'any' | 'king';
  /** Number of foundations built up by suit; 0 for removing complete runs instead. */
  foundations: number;
  moveLimit: number;
}

export interface ColumnsState {
  seed: number;
  stock: number[];
  waste: number[];
  columns: number[][];
  down: number[];
  foundations: number[][];
  /** Kings of runs removed (foundation-less variants). */
  runs: number[];
  redeals: number;
  history: string[];
  result: 'won' | 'lost' | null;
}

export function dealColumns(v: ColumnsVariant, seed: number): ColumnsState {
  const deck = shuffledDeck(seed, v.decks);
  let k = 0;
  const columns = v.deal.map(([d, u]) => deck.slice(k, (k += d + u)));
  return {
    seed,
    stock: deck.slice(k),
    waste: [],
    columns,
    down: v.deal.map(([d]) => d),
    foundations: Array.from({ length: v.foundations }, () => []),
    runs: [],
    redeals: 0,
    history: [],
    result: null,
  };
}

const top = (p: readonly number[]) => p[p.length - 1];
export const totalCards = (v: ColumnsVariant) => 52 * v.decks;

/** `b` may lie on `a` in a column. */
export function stacks(v: ColumnsVariant, a: number, b: number): boolean {
  if (rankOf(b) !== rankOf(a) - 1) return false;
  if (v.build === 'alt') return isRed(a) !== isRed(b);
  if (v.build === 'suit') return suitOf(a) === suitOf(b);
  return true;
}

export function fitsFoundation(f: readonly number[], card: number): boolean {
  const t = top(f);
  if (t === undefined) return rankOf(card) === 1;
  return suitOf(t) === suitOf(card) && rankOf(card) === rankOf(t) + 1;
}

/** Lowest index of column i whose cards may move together. */
export function moveStart(v: ColumnsVariant, s: ColumnsState, i: number): number {
  const p = s.columns[i]!;
  if (!p.length) return 0;
  if (v.move === 'single') return p.length - 1;
  if (v.move === 'group') return s.down[i]!;
  let k = p.length - 1;
  while (k > s.down[i]! && stacks(v, p[k - 1]!, p[k]!)) k--;
  return k;
}

const canDeal = (v: ColumnsVariant, s: ColumnsState) =>
  v.stock.kind === 'waste'
    ? s.stock.length > 0 || (s.waste.length > 0 && s.redeals < v.stock.redeals)
    : v.stock.kind === 'columns' && s.stock.length > 0;

function onto(v: ColumnsVariant, q: readonly number[], card: number): boolean {
  const t = top(q);
  if (t === undefined) return v.empty === 'any' || rankOf(card) === 13;
  return stacks(v, t, card);
}

export function legalColumnsMoves(v: ColumnsVariant, s: ColumnsState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  const w = top(s.waste);
  if (w !== undefined) {
    s.foundations.forEach((f, j) => fitsFoundation(f, w) && out.push(`w>f${j}`));
    s.columns.forEach((q, j) => onto(v, q, w) && out.push(`w>c${j}`));
  }
  s.columns.forEach((p, i) => {
    const t = top(p);
    if (t === undefined) return;
    s.foundations.forEach((f, j) => fitsFoundation(f, t) && out.push(`c${i}>f${j}`));
    for (let k = moveStart(v, s, i); k < p.length; k++)
      s.columns.forEach((q, j) => {
        if (j === i || !onto(v, q, p[k]!)) return;
        if (!q.length && k === 0) return; // a whole column into an empty one changes nothing
        out.push(`c${i}:${k}>c${j}`);
      });
  });
  if (canDeal(v, s)) out.push('deal');
  return out;
}

const MOVE = /^(?:deal|c\d+:\d+>c\d+|c\d+>f\d+|w>[cf]\d+)$/;

export function isLegalColumnsMove(v: ColumnsVariant, s: ColumnsState, m: string): boolean {
  if (s.result || typeof m !== 'string' || !MOVE.test(m)) return false;
  if (m === 'deal') return canDeal(v, s);
  const [from, to] = m.split('>') as [string, string];
  const dest = Number(to.slice(1));
  let card: number | undefined;
  let start = -1;
  let col = -1;
  if (from === 'w') card = top(s.waste);
  else {
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    const p = s.columns[i];
    if (!p || !p.length) return false;
    col = i;
    start = k ?? p.length - 1;
    if (to[0] === 'f' && k !== undefined) return false;
    if (to[0] === 'c' && k === undefined) return false;
    if (start >= p.length || start < moveStart(v, s, i)) return false;
    card = p[start];
  }
  if (card === undefined) return false;
  if (to[0] === 'f') {
    const f = s.foundations[dest];
    return !!f && fitsFoundation(f, card);
  }
  const q = s.columns[dest];
  if (!q || dest === col) return false;
  if (col !== -1 && !q.length && start === 0) return false;
  return onto(v, q, card);
}

const clone = (s: ColumnsState): ColumnsState => ({
  ...s,
  stock: s.stock.slice(),
  waste: s.waste.slice(),
  columns: s.columns.map((p) => p.slice()),
  down: s.down.slice(),
  foundations: s.foundations.map((f) => f.slice()),
  runs: s.runs.slice(),
  history: s.history.slice(),
});

/** Removes a complete king-to-ace run of one suit from the top of column i (no foundations). */
function removeRun(v: ColumnsVariant, n: ColumnsState, i: number) {
  if (v.foundations > 0) return;
  const p = n.columns[i]!;
  if (p.length < 13 || rankOf(top(p)!) !== 1) return;
  for (let k = p.length - 13; k < p.length - 1; k++)
    if (suitOf(p[k]!) !== suitOf(p[k + 1]!) || rankOf(p[k + 1]!) !== rankOf(p[k]!) - 1) return;
  if (p.length - 13 < n.down[i]!) return;
  n.runs.push(p.splice(p.length - 13)[0]!);
}

function turnUp(n: ColumnsState, i: number) {
  const p = n.columns[i]!;
  if (p.length && n.down[i]! >= p.length) n.down[i] = p.length - 1;
}

function shift(v: ColumnsVariant, n: ColumnsState, m: string) {
  if (m === 'deal') {
    if (v.stock.kind === 'waste') {
      if (n.stock.length) n.waste.push(n.stock.pop()!);
      else {
        n.stock = n.waste.reverse();
        n.waste = [];
        n.redeals++;
      }
    } else if (v.stock.kind === 'columns') {
      for (let i = 0; i < v.stock.columns && n.stock.length; i++) {
        n.columns[i]!.push(n.stock.pop()!);
        removeRun(v, n, i);
      }
    }
    return;
  }
  const [from, to] = m.split('>') as [string, string];
  let cards: number[];
  let src = -1;
  if (from === 'w') cards = [n.waste.pop()!];
  else {
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    src = i;
    const p = n.columns[i]!;
    cards = p.splice(k ?? p.length - 1);
  }
  const dest = Number(to.slice(1));
  if (to[0] === 'f') n.foundations[dest]!.push(...cards);
  else {
    n.columns[dest]!.push(...cards);
    removeRun(v, n, dest);
    turnUp(n, dest);
  }
  if (src !== -1) turnUp(n, src);
}

export const homeCount = (s: ColumnsState) =>
  s.foundations.reduce((a, f) => a + f.length, 0) + 13 * s.runs.length;

function settle(v: ColumnsVariant, n: ColumnsState) {
  if (homeCount(n) === totalCards(v)) n.result = 'won';
  else if (
    n.history.length >= v.moveLimit ||
    legalColumnsMoves(v, { ...n, result: null }).length === 0
  )
    n.result = 'lost';
}

/** A legal move without checks or settling the result (used by search). */
export function moveColumns(v: ColumnsVariant, s: ColumnsState, m: string): ColumnsState {
  const n = clone(s);
  n.history.push(m);
  shift(v, n, m);
  return n;
}

export function applyColumnsMove(v: ColumnsVariant, s: ColumnsState, m: string): ColumnsState {
  if (!isLegalColumnsMove(v, s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = moveColumns(v, s, m);
  settle(v, n);
  return n;
}

export function replayColumns(
  v: ColumnsVariant,
  seed: number,
  history: readonly string[],
): ColumnsState {
  const s = dealColumns(v, seed);
  for (const m of history) {
    if (!isLegalColumnsMove(v, s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    s.history.push(m);
    shift(v, s, m);
    settle(v, s);
  }
  return s;
}

export function isValidColumnsState(v: ColumnsVariant, data: unknown): data is ColumnsState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayColumns(v, data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const faceDown = (s: ColumnsState) => s.down.reduce((a, d) => a + d, 0);
