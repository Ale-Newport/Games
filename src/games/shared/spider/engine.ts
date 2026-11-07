/**
 * Spider solitaire with one, two or four suits (#074–#076). Two decks' worth of cards (104; with
 * fewer suits the suits repeat) are shuffled from a seed. Ten columns get 6, 6, 6, 6, 5, 5, 5, 5,
 * 5, 5 cards with only the top card face up; the other 50 stay in the stock.
 *
 * - Any card may go onto a card one rank higher, whatever the suit; an empty column takes any card.
 * - Several cards move together only as a descending run of one suit.
 * - Dealing puts one card face up on every column; it is not allowed while a column is empty.
 * - A complete run from king down to ace of one suit on top of a column is removed at once.
 * - A face-down card left on top turns up by itself.
 * - Won when all eight runs are removed. Lost when no move is left (the stock is empty and nothing
 *   can move), or after 1500 moves.
 * - Score: 500 to start, −1 per move, +100 per run removed.
 *
 * Moves: "deal", "c3:5>c7" (column 3 from card 5 onto column 7).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { rankOf, shuffledDeck, suitOf, type Suit } from '../cards/cards';

export const MOVE_LIMIT = 1500;
export type SpiderSuits = 1 | 2 | 4;
const SUIT_SETS: Record<SpiderSuits, Suit[]> = { 1: [0], 2: [0, 1], 4: [0, 1, 2, 3] };

export interface SpiderState {
  seed: number;
  suits: SpiderSuits;
  stock: number[];
  columns: number[][];
  down: number[];
  /** The king of each run removed so far. */
  completed: number[];
  history: string[];
  score: number;
  result: 'won' | 'lost' | null;
}

export function dealSpider(seed: number, suits: SpiderSuits): SpiderState {
  const deck = shuffledDeck(seed, 2, SUIT_SETS[suits]);
  const columns: number[][] = [];
  let k = 0;
  for (let i = 0; i < 10; i++) columns.push(deck.slice(k, (k += i < 4 ? 6 : 5)));
  return {
    seed,
    suits,
    stock: deck.slice(k),
    columns,
    down: columns.map((p) => p.length - 1),
    completed: [],
    history: [],
    score: 500,
    result: null,
  };
}

const top = (p: readonly number[]) => p[p.length - 1];
/** `b` continues a one-suit descending run from `a`. */
const follows = (a: number, b: number) => suitOf(a) === suitOf(b) && rankOf(b) === rankOf(a) - 1;

/** First index of the movable one-suit run at the top of column i. */
export function runStart(s: SpiderState, i: number): number {
  const p = s.columns[i]!;
  let k = p.length - 1;
  while (k > s.down[i]! && follows(p[k - 1]!, p[k]!)) k--;
  return k;
}

export function canDeal(s: SpiderState): boolean {
  return s.stock.length > 0 && s.columns.every((p) => p.length > 0);
}

export function legalSpiderMoves(s: SpiderState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.columns.forEach((p, i) => {
    if (!p.length) return;
    for (let k = runStart(s, i); k < p.length; k++)
      s.columns.forEach((q, j) => {
        if (j === i) return;
        const t = top(q);
        if (t === undefined) {
          if (k > 0) out.push(`c${i}:${k}>c${j}`); // a whole column into an empty one changes nothing
        } else if (rankOf(t) === rankOf(p[k]!) + 1) out.push(`c${i}:${k}>c${j}`);
      });
  });
  if (canDeal(s)) out.push('deal');
  return out;
}

const MOVE = /^(?:deal|c\d:\d+>c\d)$/;

export function isLegalSpiderMove(s: SpiderState, m: string): boolean {
  if (s.result || typeof m !== 'string' || !MOVE.test(m)) return false;
  if (m === 'deal') return canDeal(s);
  const [from, to] = m.split('>') as [string, string];
  const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
  const j = Number(to.slice(1));
  const p = s.columns[i];
  const q = s.columns[j];
  if (!p || !q || i === j || k >= p.length || k < runStart(s, i)) return false;
  const t = top(q);
  return t === undefined ? k > 0 : rankOf(t) === rankOf(p[k]!) + 1;
}

const clone = (s: SpiderState): SpiderState => ({
  ...s,
  stock: s.stock.slice(),
  columns: s.columns.map((p) => p.slice()),
  down: s.down.slice(),
  completed: s.completed.slice(),
  history: s.history.slice(),
});

/** Removes a finished king-to-ace run from the top of column i, then turns up its new top. */
function settleColumn(n: SpiderState, i: number) {
  const p = n.columns[i]!;
  if (p.length >= 13 && rankOf(top(p)!) === 1 && runStart(n, i) <= p.length - 13) {
    const run = p.splice(p.length - 13);
    n.completed.push(run[0]!);
    n.score += 100;
  }
  if (p.length > 0 && n.down[i]! >= p.length) n.down[i] = p.length - 1;
}

/** Moves cards inside `n` for a legal move (mutating it). */
function shift(n: SpiderState, m: string) {
  if (m === 'deal') {
    for (let i = 0; i < 10; i++) n.columns[i]!.push(n.stock.pop()!);
    for (let i = 0; i < 10; i++) settleColumn(n, i);
  } else {
    const [from, to] = m.split('>') as [string, string];
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
    const j = Number(to.slice(1));
    n.columns[j]!.push(...n.columns[i]!.splice(k));
    settleColumn(n, i);
    settleColumn(n, j);
  }
  n.score = Math.max(0, n.score - 1);
}

/** Plays a legal move without checks or settling the result (used by search). */
export function moveSpider(s: SpiderState, m: string): SpiderState {
  const n = clone(s);
  n.history.push(m);
  shift(n, m);
  return n;
}

function settleResult(n: SpiderState) {
  if (n.completed.length === 8) n.result = 'won';
  else if (n.history.length >= MOVE_LIMIT || legalSpiderMoves({ ...n, result: null }).length === 0)
    n.result = 'lost';
}

export function applySpiderMove(s: SpiderState, m: string): SpiderState {
  if (!isLegalSpiderMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = moveSpider(s, m);
  settleResult(n);
  return n;
}

/** Replays a game on one working state, checking every move (linear in the game's length). */
export function replaySpider(
  seed: number,
  suits: SpiderSuits,
  history: readonly string[],
): SpiderState {
  const s = dealSpider(seed, suits);
  for (const m of history) {
    if (!isLegalSpiderMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    s.history.push(m);
    shift(s, m);
    settleResult(s);
  }
  return s;
}

export function isValidSpiderState(data: unknown, suits: SpiderSuits): data is SpiderState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (data.suits !== suits || !data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replaySpider(data.seed, suits, data.history as string[])) ===
      JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const faceDown = (s: SpiderState) => s.down.reduce((a, d) => a + d, 0);
