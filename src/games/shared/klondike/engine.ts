/**
 * Klondike solitaire (#071 draw one, #072 draw three). A seeded deck is dealt into seven tableau
 * piles (1…7 cards, only the top card face up); the other 24 cards form the stock.
 *
 * - Tableau: build down in alternating colors; any face-up run may move; only a king (or a run
 *   headed by one) may fill an empty pile. A face-down card left on top turns up by itself.
 * - Foundations: four piles built up by suit from the ace; an ace may start any empty foundation.
 *   Foundation cards may come back to the tableau.
 * - Stock: drawing turns over one (or three) cards onto the waste; only the waste's top card plays.
 *   An empty stock is refilled from the waste, unlimited times.
 * - Won when all 52 cards are on the foundations. Lost when drawing is the only legal move and a
 *   whole pass through the stock has gone by with nothing else played (nothing can ever change),
 *   or after 1500 moves.
 *
 * Scoring (documented house variant of the usual standard scoring): waste → tableau +5,
 * waste or tableau → foundation +10, turning up a tableau card +5, foundation → tableau −15,
 * recycling the waste −100 (draw one) / −20 (draw three); never below 0.
 *
 * Moves: "draw", "w>f2", "w>t3", "t1>f0", "t1:4>t5" (pile 1 from card index 4), "f0>t3".
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { isRed, rankOf, shuffledDeck, suitOf } from '../cards/cards';

export const MOVE_LIMIT = 1500;

export interface KlondikeState {
  seed: number;
  draw: 1 | 3;
  stock: number[];
  waste: number[];
  foundations: number[][];
  tableau: number[][];
  /** Face-down cards at the bottom of each tableau pile. */
  down: number[];
  history: string[];
  score: number;
  recycles: number;
  /** Consecutive draws (and recycles) made when drawing was the only legal move. */
  quiet: number;
  result: 'won' | 'lost' | null;
}

export function dealKlondike(seed: number, draw: 1 | 3): KlondikeState {
  const deck = shuffledDeck(seed);
  const tableau: number[][] = [];
  let k = 0;
  for (let i = 0; i < 7; i++) tableau.push(deck.slice(k, (k += i + 1)));
  return {
    seed,
    draw,
    stock: deck.slice(k),
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    down: tableau.map((p) => p.length - 1),
    history: [],
    score: 0,
    recycles: 0,
    quiet: 0,
    result: null,
  };
}

const top = (pile: readonly number[]) => pile[pile.length - 1];

/** Whether `card` may go onto foundation pile `f`. */
export function fitsFoundation(f: readonly number[], card: number): boolean {
  if (card < 0) return false; // an unknown card in the planner's masked view
  const t = top(f);
  if (t === undefined) return rankOf(card) === 1;
  return suitOf(t) === suitOf(card) && rankOf(card) === rankOf(t) + 1;
}

/** Whether a run headed by `card` may go onto tableau pile `p`. */
export function fitsTableau(p: readonly number[], card: number): boolean {
  if (card < 0) return false;
  const t = top(p);
  if (t === undefined) return rankOf(card) === 13;
  return isRed(t) !== isRed(card) && rankOf(card) === rankOf(t) - 1;
}

export function legalKlondikeMoves(s: KlondikeState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  const w = top(s.waste);
  if (w !== undefined) {
    s.foundations.forEach((f, i) => fitsFoundation(f, w) && out.push(`w>f${i}`));
    s.tableau.forEach((p, i) => fitsTableau(p, w) && out.push(`w>t${i}`));
  }
  s.tableau.forEach((p, i) => {
    const t = top(p);
    if (t === undefined) return;
    s.foundations.forEach((f, j) => fitsFoundation(f, t) && out.push(`t${i}>f${j}`));
    // Any face-up card heads a valid run (the face-up part is always a proper sequence).
    for (let k = s.down[i]!; k < p.length; k++)
      s.tableau.forEach((q, j) => j !== i && fitsTableau(q, p[k]!) && out.push(`t${i}:${k}>t${j}`));
  });
  s.foundations.forEach((f, i) => {
    const t = top(f);
    if (t !== undefined) s.tableau.forEach((p, j) => fitsTableau(p, t) && out.push(`f${i}>t${j}`));
  });
  if (s.stock.length || s.waste.length) out.push('draw');
  return out;
}

/** Whether drawing is the only legal move (stops at the first other move found). */
function onlyDraw(s: KlondikeState): boolean {
  const w = top(s.waste);
  const tops = s.tableau.map(top);
  if (w !== undefined) {
    if (s.foundations.some((f) => fitsFoundation(f, w))) return false;
    if (s.tableau.some((p) => fitsTableau(p, w))) return false;
  }
  for (let i = 0; i < 7; i++) {
    const p = s.tableau[i]!;
    const t = tops[i];
    if (t === undefined) continue;
    if (s.foundations.some((f) => fitsFoundation(f, t))) return false;
    for (let k = s.down[i]!; k < p.length; k++)
      if (s.tableau.some((q, j) => j !== i && fitsTableau(q, p[k]!))) return false;
  }
  for (const f of s.foundations) {
    const t = top(f);
    if (t !== undefined && s.tableau.some((p) => fitsTableau(p, t))) return false;
  }
  return true;
}

const clone = (s: KlondikeState): KlondikeState => ({
  ...s,
  stock: s.stock.slice(),
  waste: s.waste.slice(),
  foundations: s.foundations.map((f) => f.slice()),
  tableau: s.tableau.map((p) => p.slice()),
  down: s.down.slice(),
  history: s.history.slice(),
});

const MOVE = /^(?:draw|w>[ft]\d|t\d>f\d|t\d:\d+>t\d|f\d>t\d)$/;

/** Turns up the top card of tableau pile i if it is face down. */
function flip(s: KlondikeState, i: number) {
  const p = s.tableau[i]!;
  if (p.length > 0 && s.down[i]! >= p.length) {
    s.down[i] = p.length - 1;
    s.score += 5;
  }
}

/** Whether `m` is legal, checked directly (cheaper than generating every move). */
export function isLegalKlondikeMove(s: KlondikeState, m: string): boolean {
  if (s.result || typeof m !== 'string' || !MOVE.test(m)) return false;
  if (m === 'draw') return s.stock.length + s.waste.length > 0;
  const [from, to] = m.split('>') as [string, string];
  const dest = Number(to.slice(1));
  let card: number | undefined;
  if (from === 'w') card = top(s.waste);
  else if (from[0] === 'f') {
    if (to[0] !== 't') return false;
    card = top(s.foundations[Number(from.slice(1))] ?? []);
  } else {
    const [pile, at] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    const p = s.tableau[pile];
    if (!p || (to[0] === 't' && (at === undefined || pile === dest))) return false;
    if (to[0] === 'f' && at !== undefined) return false;
    const k = at ?? p.length - 1;
    if (k < s.down[pile]! || k >= p.length) return false;
    card = p[k];
  }
  if (card === undefined) return false;
  if (to[0] === 'f') return dest < 4 && fitsFoundation(s.foundations[dest]!, card);
  return dest < 7 && fitsTableau(s.tableau[dest]!, card);
}

export function applyKlondikeMove(s: KlondikeState, m: string): KlondikeState {
  if (!isLegalKlondikeMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = moveCards(s, m);
  if (n.foundations.every((f) => f.length === 13)) n.result = 'won';
  else if (isStuck(n) || n.history.length >= MOVE_LIMIT) n.result = 'lost';
  return n;
}

/** Plays a move known to be legal, without checking it or settling the result (used by search). */
export function moveCards(s: KlondikeState, m: string): KlondikeState {
  const n = clone(s);
  n.history.push(m);
  if (m === 'draw') {
    if (n.stock.length) {
      for (let i = 0; i < n.draw && n.stock.length; i++) n.waste.push(n.stock.pop()!);
    } else {
      n.stock = n.waste.reverse();
      n.waste = [];
      n.recycles++;
      n.score -= n.draw === 1 ? 100 : 20;
    }
    // Count only draws made when nothing else was possible.
    n.quiet = onlyDraw(s) ? s.quiet + 1 : 0;
  } else {
    n.quiet = 0;
    const [from, to] = m.split('>') as [string, string];
    const dest = Number(to.slice(1));
    let cards: number[];
    if (from === 'w') cards = [n.waste.pop()!];
    else if (from[0] === 'f') cards = [n.foundations[Number(from.slice(1))]!.pop()!];
    else {
      const [pile, at] = from.slice(1).split(':').map(Number) as [number, number | undefined];
      const p = n.tableau[pile]!;
      cards = p.splice(at ?? p.length - 1);
      flip(n, pile);
    }
    if (to[0] === 'f') n.foundations[dest]!.push(...cards);
    else n.tableau[dest]!.push(...cards);
    // Score the transfer.
    if (to[0] === 'f') n.score += 10;
    else if (from === 'w') n.score += 5;
    else if (from[0] === 'f') n.score -= 15;
  }
  n.score = Math.max(0, n.score);
  return n;
}

/** Drawing is all that is left and a full pass has turned up nothing else. */
export function isStuck(s: KlondikeState): boolean {
  const cards = s.stock.length + s.waste.length;
  // With cards to draw, only a long enough run of forced draws can mean the deal is stuck.
  if (cards > 0 && s.quiet <= Math.ceil(cards / s.draw) + 1) return false;
  const legal = legalKlondikeMoves({ ...s, result: null });
  if (legal.length === 0) return true;
  if (legal.length > 1) return false;
  const cycle = Math.ceil((s.stock.length + s.waste.length) / s.draw) + 1;
  return s.quiet > cycle;
}

export function replayKlondike(
  seed: number,
  draw: 1 | 3,
  history: readonly string[],
): KlondikeState {
  return history.reduce((s, m) => applyKlondikeMove(s, m), dealKlondike(seed, draw));
}

export function isValidKlondikeState(data: unknown, draw: 1 | 3): data is KlondikeState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (data.draw !== draw || !data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayKlondike(data.seed, draw, data.history as string[])) ===
      JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export const foundationCount = (s: KlondikeState) =>
  s.foundations.reduce((a, f) => a + f.length, 0);
export const faceDownCount = (s: KlondikeState) => s.down.reduce((a, d) => a + d, 0);
