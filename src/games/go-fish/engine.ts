/**
 * Go Fish (#100) for 2–4 players (the player and 1–3 AI opponents).
 *
 * - Seven cards each with two or three players, five with four; the rest is the **pond**.
 * - On your turn ask another player for a rank you hold. If they have any, they hand them all over
 *   and you ask again. If not — "Go fish!" — you draw from the pond; if you draw the rank you asked
 *   for, you show it and ask again, otherwise the turn passes to the left.
 * - Four cards of a rank make a **book**, laid down at once.
 * - A player whose hand is empty draws a card from the pond at the start of their turn (and passes
 *   when the pond is empty too).
 * - When all thirteen books are down, the most books wins (ties share the win).
 *
 * Actions: "ask:T:R" (ask seat T for rank R, 1–13), "draw" (an empty hand draws), "pass".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck } from '../shared/cards/cards';

export interface FishAsk {
  asker: number;
  target: number;
  rank: number;
  /** Cards handed over (0: go fish). */
  got: number;
  /** Go fish drew the asked rank. */
  lucky: boolean;
}

export interface FishState {
  seed: number;
  players: number;
  hands: number[][];
  pond: number[];
  /** Ranks of the books each player has laid down. */
  books: number[][];
  toAct: number;
  /** Every ask so far (public), and every time a player drew a card (count by player). */
  asks: FishAsk[];
  draws: number[];
  history: string[];
  over: boolean;
  /** The players with the most books, once over. */
  winners: number[];
}

const handSize = (players: number) => (players <= 3 ? 7 : 5);

export function createFish(seed: number, players = 2): FishState {
  const n = Math.min(4, Math.max(2, players));
  const deck = shuffledDeck((seed * 4241) >>> 0);
  const size = handSize(n);
  const s: FishState = {
    seed,
    players: n,
    hands: Array.from({ length: n }, (_, p) => deck.slice(p * size, p * size + size)),
    pond: deck.slice(n * size),
    books: Array.from({ length: n }, () => []),
    toAct: 0,
    asks: [],
    draws: Array<number>(n).fill(0),
    history: [],
    over: false,
    winners: [],
  };
  for (let p = 0; p < n; p++) layBooks(s, p);
  return s;
}

/** Lays down any complete book in a player's hand. */
function layBooks(s: FishState, p: number) {
  for (let rank = 1; rank <= 13; rank++) {
    const cards = s.hands[p]!.filter((c) => rankOf(c) === rank);
    if (cards.length === 4) {
      s.hands[p] = s.hands[p]!.filter((c) => rankOf(c) !== rank);
      s.books[p]!.push(rank);
    }
  }
}

const booksDown = (s: FishState) => s.books.reduce((a, b) => a + b.length, 0);

export function legalFishActions(s: FishState): string[] {
  if (s.over) return [];
  const hand = s.hands[s.toAct]!;
  if (!hand.length) return s.pond.length ? ['draw'] : ['pass'];
  const ranks = [...new Set(hand.map(rankOf))].sort((a, b) => a - b);
  const out: string[] = [];
  for (let t = 0; t < s.players; t++) {
    if (t === s.toAct || !s.hands[t]!.length) continue;
    for (const r of ranks) out.push(`ask:${t}:${r}`);
  }
  // Nobody left to ask: draw if possible, otherwise pass.
  if (!out.length) return s.pond.length ? ['draw'] : ['pass'];
  return out;
}

function finishCheck(s: FishState) {
  if (booksDown(s) === 13) {
    s.over = true;
    const most = Math.max(...s.books.map((b) => b.length));
    s.winners = s.books.flatMap((b, p) => (b.length === most ? [p] : []));
  }
}

const nextPlayer = (s: FishState) => {
  s.toAct = (s.toAct + 1) % s.players;
};

export function applyFishAction(s: FishState, a: string): FishState {
  if (!legalFishActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: FishState = structuredClone(s);
  n.history.push(a);
  const p = n.toAct;
  if (a === 'pass') {
    nextPlayer(n);
    return n;
  }
  if (a === 'draw') {
    n.hands[p]!.push(n.pond.shift()!);
    n.draws[p]!++;
    layBooks(n, p);
    finishCheck(n);
    // The player keeps the turn and may now ask (or the turn passes if they still cannot).
    if (!n.over && !n.hands[p]!.length) nextPlayer(n);
    return n;
  }
  const [, targetText, rankText] = a.split(':');
  const target = Number(targetText);
  const rank = Number(rankText);
  const given = n.hands[target]!.filter((c) => rankOf(c) === rank);
  if (given.length) {
    n.hands[target] = n.hands[target]!.filter((c) => rankOf(c) !== rank);
    n.hands[p]!.push(...given);
    n.asks.push({ asker: p, target, rank, got: given.length, lucky: false });
    layBooks(n, p);
    finishCheck(n);
    if (!n.over && !n.hands[p]!.length && !n.pond.length) nextPlayer(n);
    return n;
  }
  // Go fish.
  let lucky = false;
  if (n.pond.length) {
    const card = n.pond.shift()!;
    n.hands[p]!.push(card);
    n.draws[p]!++;
    lucky = rankOf(card) === rank;
    layBooks(n, p);
  }
  n.asks.push({ asker: p, target, rank, got: 0, lucky });
  finishCheck(n);
  if (!n.over && !lucky) nextPlayer(n);
  return n;
}

export function replayFish(seed: number, players: number, history: readonly string[]): FishState {
  return history.reduce((s, a) => applyFishAction(s, a), createFish(seed, players));
}

export function isValidFishState(data: unknown): data is FishState {
  if (!isRecord(data) || typeof data.seed !== 'number' || typeof data.players !== 'number')
    return false;
  if (!Array.isArray(data.history) || !data.history.every((a) => typeof a === 'string'))
    return false;
  try {
    return (
      JSON.stringify(replayFish(data.seed, data.players, data.history as string[])) ===
      JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
