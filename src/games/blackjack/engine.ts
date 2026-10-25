/**
 * Blackjack against the dealer, with a six-deck shoe shuffled from a seed (each new shoe from the
 * seed and its number). House rules: the dealer stands on soft 17, blackjack pays 3 to 2, the dealer
 * peeks for blackjack with an ace or a ten-value card up, insurance pays 2 to 1, doubling on any
 * first two cards (also after a split), splitting pairs up to four hands, split aces get one card
 * each, no surrender. The shoe is reshuffled before a round once 75% of it has been dealt.
 *
 * A session keeps a bankroll (1000 to start; refilled to 1000 if it drops below the smallest bet).
 *
 * Actions: "bet:25" (place the bet and deal), "insure" / "no-insure", "hit", "stand", "double",
 * "split", "next" (after a round is settled).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck } from '../shared/cards/cards';

export const DECKS = 6;
export const START_BANKROLL = 1000;
export const BETS = [10, 25, 50, 100, 250, 500] as const;
const CUT = Math.floor(52 * DECKS * 0.75);

export type Phase = 'bet' | 'insurance' | 'play' | 'settled';

export interface Hand {
  cards: number[];
  bet: number;
  doubled: boolean;
  /** No more cards for this hand (stood, doubled, busted, 21, or split aces). */
  done: boolean;
  fromSplit: boolean;
  /** Settlement: chips returned to the bankroll (0 when lost). */
  payout?: number;
  outcome?: 'blackjack' | 'win' | 'push' | 'lose';
}

export interface BlackjackState {
  seed: number;
  shoeNumber: number;
  shoe: number[];
  /** Cards dealt from the current shoe. */
  dealt: number;
  bankroll: number;
  phase: Phase;
  hands: Hand[];
  active: number;
  dealer: number[];
  /** Whether the dealer's hole card is face up. */
  revealed: boolean;
  insurance: number;
  history: string[];
  rounds: number;
  refills: number;
}

const newShoe = (seed: number, n: number) => shuffledDeck((seed * 7919 + n * 104729) >>> 0, DECKS);

export function createBlackjack(seed: number): BlackjackState {
  return {
    seed,
    shoeNumber: 0,
    shoe: newShoe(seed, 0),
    dealt: 0,
    bankroll: START_BANKROLL,
    phase: 'bet',
    hands: [],
    active: 0,
    dealer: [],
    revealed: false,
    insurance: 0,
    history: [],
    rounds: 0,
    refills: 0,
  };
}

/** Blackjack value: [total, soft] (soft when an ace counts 11). */
export function handValue(cards: readonly number[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const r = rankOf(c);
    total += r >= 10 ? 10 : r;
    if (r === 1) aces++;
  }
  if (aces && total + 10 <= 21) return { total: total + 10, soft: true };
  return { total, soft: false };
}

export const isBlackjack = (cards: readonly number[]) =>
  cards.length === 2 && handValue(cards).total === 21;
export const cardValue = (c: number) => Math.min(10, rankOf(c));

function draw(n: BlackjackState): number {
  if (n.dealt >= n.shoe.length) {
    n.shoeNumber++;
    n.shoe = newShoe(n.seed, n.shoeNumber);
    n.dealt = 0;
  }
  return n.shoe[n.dealt++]!;
}

const current = (s: BlackjackState) => s.hands[s.active];

export function canDouble(s: BlackjackState): boolean {
  const h = current(s);
  return !!h && s.phase === 'play' && h.cards.length === 2 && !h.done && s.bankroll >= h.bet;
}

export function canSplit(s: BlackjackState): boolean {
  const h = current(s);
  return (
    !!h &&
    s.phase === 'play' &&
    h.cards.length === 2 &&
    !h.done &&
    s.hands.length < 4 &&
    cardValue(h.cards[0]!) === cardValue(h.cards[1]!) &&
    s.bankroll >= h.bet &&
    // Split aces are not split again.
    !(h.fromSplit && rankOf(h.cards[0]!) === 1)
  );
}

export function legalBlackjackActions(s: BlackjackState): string[] {
  switch (s.phase) {
    case 'bet':
      return BETS.filter((b) => b <= s.bankroll).map((b) => `bet:${b}`);
    case 'insurance':
      return s.bankroll >= s.hands[0]!.bet / 2 ? ['insure', 'no-insure'] : ['no-insure'];
    case 'play': {
      const out = ['hit', 'stand'];
      if (canDouble(s)) out.push('double');
      if (canSplit(s)) out.push('split');
      return out;
    }
    case 'settled':
      return ['next'];
  }
}

/** Moves to the next hand that still plays, or finishes the round. */
function advance(n: BlackjackState) {
  while (n.active < n.hands.length && n.hands[n.active]!.done) n.active++;
  if (n.active < n.hands.length) {
    const h = n.hands[n.active]!;
    // A split hand gets its second card when its turn comes.
    if (h.cards.length === 1) {
      h.cards.push(draw(n));
      if (rankOf(h.cards[0]!) === 1 || handValue(h.cards).total === 21) h.done = true;
      if (h.done) return advance(n);
    }
    return;
  }
  finishRound(n);
}

function finishRound(n: BlackjackState) {
  n.revealed = true;
  const live = n.hands.some((h) => handValue(h.cards).total <= 21);
  if (live) while (handValue(n.dealer).total < 17) n.dealer.push(draw(n));
  const dealer = handValue(n.dealer).total;
  const dealerBj = isBlackjack(n.dealer);
  for (const h of n.hands) {
    const v = handValue(h.cards).total;
    const natural = isBlackjack(h.cards) && !h.fromSplit;
    if (v > 21) settle(h, 'lose', 0);
    else if (natural && !dealerBj) settle(h, 'blackjack', h.bet * 2.5);
    else if (dealerBj && !natural) settle(h, 'lose', 0);
    else if (natural && dealerBj) settle(h, 'push', h.bet);
    else if (dealer > 21 || v > dealer) settle(h, 'win', h.bet * 2);
    else if (v === dealer) settle(h, 'push', h.bet);
    else settle(h, 'lose', 0);
    n.bankroll += h.payout!;
  }
  if (n.insurance && dealerBj) n.bankroll += n.insurance * 3;
  n.phase = 'settled';
  n.rounds++;
}

function settle(h: Hand, outcome: NonNullable<Hand['outcome']>, payout: number) {
  h.outcome = outcome;
  h.payout = payout;
}

/** After the deal (and any insurance decision): the dealer peeks, naturals settle at once. */
function peekAndStart(n: BlackjackState) {
  const up = n.dealer[0]!;
  if ((rankOf(up) === 1 || cardValue(up) === 10) && isBlackjack(n.dealer)) return finishRound(n);
  if (isBlackjack(n.hands[0]!.cards)) return finishRound(n);
  n.phase = 'play';
  n.active = 0;
}

function shift(n: BlackjackState, a: string) {
  if (a.startsWith('bet:')) {
    if (n.dealt >= CUT) {
      n.shoeNumber++;
      n.shoe = newShoe(n.seed, n.shoeNumber);
      n.dealt = 0;
    }
    const bet = Number(a.slice(4));
    n.bankroll -= bet;
    const cards = [draw(n)];
    n.dealer = [draw(n)];
    cards.push(draw(n));
    n.dealer.push(draw(n));
    n.hands = [{ cards, bet, doubled: false, done: false, fromSplit: false }];
    n.revealed = false;
    n.insurance = 0;
    n.active = 0;
    if (rankOf(n.dealer[0]!) === 1 && !isBlackjack(cards)) n.phase = 'insurance';
    else peekAndStart(n);
    return;
  }
  if (a === 'insure' || a === 'no-insure') {
    if (a === 'insure') {
      n.insurance = n.hands[0]!.bet / 2;
      n.bankroll -= n.insurance;
    }
    return peekAndStart(n);
  }
  if (a === 'next') {
    if (n.bankroll < BETS[0]) {
      n.bankroll = START_BANKROLL;
      n.refills++;
    }
    n.phase = 'bet';
    n.hands = [];
    n.dealer = [];
    n.revealed = false;
    return;
  }
  const h = n.hands[n.active]!;
  if (a === 'hit') {
    h.cards.push(draw(n));
    if (handValue(h.cards).total >= 21) h.done = true;
  } else if (a === 'stand') h.done = true;
  else if (a === 'double') {
    n.bankroll -= h.bet;
    h.bet *= 2;
    h.doubled = true;
    h.cards.push(draw(n));
    h.done = true;
  } else if (a === 'split') {
    n.bankroll -= h.bet;
    const second: Hand = {
      cards: [h.cards.pop()!],
      bet: h.bet,
      doubled: false,
      done: false,
      fromSplit: true,
    };
    h.fromSplit = true;
    n.hands.splice(n.active + 1, 0, second);
    h.cards.push(draw(n));
    // Split aces take one card each.
    if (rankOf(h.cards[0]!) === 1 || handValue(h.cards).total === 21) h.done = true;
  }
  advance(n);
}

const clone = (s: BlackjackState): BlackjackState => ({
  ...s,
  hands: s.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  dealer: s.dealer.slice(),
  history: s.history.slice(),
});

export function applyBlackjackAction(s: BlackjackState, a: string): BlackjackState {
  if (typeof a !== 'string' || !legalBlackjackActions(s).includes(a))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n = clone(s);
  n.history.push(a);
  shift(n, a);
  return n;
}

export function replayBlackjack(seed: number, history: readonly string[]): BlackjackState {
  return history.reduce((s, a) => applyBlackjackAction(s, a), createBlackjack(seed));
}

export function isValidBlackjackState(data: unknown): data is BlackjackState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayBlackjack(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

/** Net chips won or lost by the last settled round. */
export function roundNet(s: BlackjackState): number {
  const staked = s.hands.reduce((a, h) => a + h.bet, 0) + s.insurance;
  const back =
    s.hands.reduce((a, h) => a + (h.payout ?? 0), 0) +
    (s.insurance && isBlackjack(s.dealer) ? s.insurance * 3 : 0);
  return back - staked;
}
