/**
 * A small natural bidding system for the computer players. Hand evaluation: high-card points
 * (ace 4, king 3, queen 2, jack 1), suit lengths and balance.
 *
 * - Openings: 2♣ with 22+; 2NT with 20–21 balanced; 1NT with 15–17 balanced; one of a suit with 12+
 *   (or 11+ when the two longest suits add up to 9) — a five-card major, else the longer minor; a
 *   weak two in diamonds, hearts or spades with a six-card suit and 6–10.
 * - Competition: a 1NT overcall with 15–18 balanced, a suit overcall with a five-card suit and
 *   8–16 (11+ at the two level), a takeout double with 12+ and at most one card in their suit.
 * - Everything else is "placement": from what partner's calls have shown (a point range and suit
 *   lengths) the player estimates the partnership's points, picks a strain (an eight-card major
 *   fit, else no trump with a balanced hand or no fit, else a minor fit or a long suit) and bids
 *   the level those points are worth — part-score, game (3NT, 4 of a major, 5 of a minor), small
 *   or grand slam — or passes when the side is already there. With the points for game it may
 *   double the opponents' contract instead of letting them play it.
 */
import { CLUBS, DIAMONDS, HEARTS, SPADES, rankOf, suitOf } from '../shared/cards/cards';
import {
  STRAIN_SUITS,
  auctionState,
  bidCall,
  bidRank,
  legalCalls,
  parseBid,
  partnerOf,
  sideOf,
  type BridgeState,
} from './engine';

const SUIT_STRAIN: Record<number, number> = { [CLUBS]: 0, [DIAMONDS]: 1, [HEARTS]: 2, [SPADES]: 3 };

export function hcp(hand: readonly number[]): number {
  return hand.reduce((a, c) => {
    const r = rankOf(c);
    return a + (r === 1 ? 4 : r === 13 ? 3 : r === 12 ? 2 : r === 11 ? 1 : 0);
  }, 0);
}

/** Card counts by strain index (clubs, diamonds, hearts, spades). */
export function lengths(hand: readonly number[]): number[] {
  const out = [0, 0, 0, 0];
  for (const c of hand) out[SUIT_STRAIN[suitOf(c)]!]!++;
  return out;
}

export function isBalanced(hand: readonly number[]): boolean {
  const shape = lengths(hand)
    .sort((a, b) => b - a)
    .join('');
  return shape === '4333' || shape === '4432' || shape === '5332';
}

/** The opening call for a hand (pass when it does not qualify). */
export function openingCall(hand: readonly number[]): string {
  const p = hcp(hand);
  const len = lengths(hand);
  const bal = isBalanced(hand);
  if (p >= 22) return bidCall(2, 0);
  if (p >= 20 && p <= 21 && bal) return bidCall(2, 4);
  if (p >= 15 && p <= 17 && bal) return bidCall(1, 4);
  const two = [...len].sort((a, b) => b - a);
  if (p >= 12 || (p >= 11 && two[0]! + two[1]! >= 9)) {
    if (len[3]! >= 5 || len[2]! >= 5) return bidCall(1, len[3]! >= len[2]! ? 3 : 2);
    return bidCall(1, len[1]! > len[0]! || (len[1] === len[0] && len[1]! >= 4) ? 1 : 0);
  }
  for (const strain of [3, 2, 1])
    if (len[strain] === 6 && p >= 6 && p <= 10) return bidCall(2, strain);
  return 'pass';
}

export interface Shown {
  min: number;
  max: number;
  /** Lengths shown by strain (clubs … spades). */
  len: number[];
}

/** What a player's calls have shown (a deliberately simple reading of this system). */
export function shownBy(s: BridgeState, seat: number): Shown {
  const out: Shown = { min: 0, max: 37, len: [0, 0, 0, 0] };
  let anyBidBefore = false;
  let partnerBid: { level: number; strain: number } | null = null;
  let mine = 0;
  s.auction.forEach((call, k) => {
    const who = (s.dealer + k) % 4;
    const bid = parseBid(call);
    if (who === partnerOf(seat) && bid) partnerBid = bid;
    if (who !== seat) {
      if (bid) anyBidBefore = true;
      return;
    }
    mine++;
    if (!bid) {
      if (call === 'pass' && mine === 1 && !anyBidBefore) out.max = Math.min(out.max, 11);
      if (call === 'double' && mine === 1) out.min = Math.max(out.min, 12);
      if (bid === null && call !== 'pass') return;
      return;
    }
    const first = mine === 1;
    const pb = partnerBid as { level: number; strain: number } | null;
    if (first && !anyBidBefore) {
      // An opening.
      if (bid.level === 2 && bid.strain === 0) out.min = 22;
      else if (bid.strain === 4) {
        out.min = bid.level === 1 ? 15 : 20;
        out.max = bid.level === 1 ? 17 : 21;
        out.len = out.len.map((l) => Math.max(l, 2));
      } else if (bid.level === 2) {
        out.min = 6;
        out.max = 10;
        out.len[bid.strain] = 6;
      } else {
        out.min = 11;
        out.max = 21;
        out.len[bid.strain] = Math.max(out.len[bid.strain]!, bid.strain >= 2 ? 5 : 3);
      }
    } else if (first && pb) {
      // A response to partner.
      if (bid.strain === pb.strain && bid.strain !== 4) {
        out.len[bid.strain] = Math.max(out.len[bid.strain]!, bid.strain >= 2 ? 3 : 4);
        out.min = bid.level - pb.level >= 2 ? 10 : 6;
        out.max = bid.level - pb.level >= 2 ? 12 : 9;
      } else if (bid.strain === 4) {
        out.min = bid.level === 1 ? 6 : bid.level === 2 ? 11 : 13;
        out.max = bid.level === 1 ? 9 : bid.level === 2 ? 12 : 15;
      } else {
        out.min = bid.level === 1 ? 6 : 10;
        out.len[bid.strain] = Math.max(out.len[bid.strain]!, 4);
      }
    } else if (first) {
      // An overcall.
      if (bid.strain === 4) {
        out.min = 15;
        out.max = 18;
      } else {
        out.min = bid.level === 1 ? 8 : 11;
        out.max = 16;
        out.len[bid.strain] = Math.max(out.len[bid.strain]!, 5);
      }
    } else if (bid.strain !== 4) {
      // A later bid: a rebid of a suit shows more length, a new suit four.
      out.len[bid.strain] = out.len[bid.strain]! >= 4 ? 6 : Math.max(out.len[bid.strain]!, 4);
    }
  });
  return out;
}

/** The level a partnership's points are worth in a strain (0: not enough to bid on). */
export function targetLevel(points: number, strain: number): number {
  if (points >= 37) return 7;
  if (points >= 33) return 6;
  if (points >= 25) return strain === 4 ? 3 : strain >= 2 ? 4 : points >= 29 ? 5 : 3;
  if (points >= 23) return 3;
  if (points >= 20) return 2;
  return 1;
}

/** Shortness points for a hand that will be a trump hand. */
const shortness = (len: readonly number[], trump: number) =>
  len.reduce((a, l, i) => a + (i === trump ? 0 : l === 0 ? 3 : l === 1 ? 2 : l === 2 ? 1 : 0), 0);

export type BidLevel = 'easy' | 'medium';

export function chooseCall(s: BridgeState, level: BidLevel = 'medium'): string {
  const me = s.toAct;
  const hand = s.hands[me]!;
  const legal = legalCalls(s);
  const p = hcp(hand);
  const len = lengths(hand);
  const bal = isBalanced(hand);
  const { last, doubled } = auctionState(s);
  const myCalls = s.auction.filter((_, k) => (s.dealer + k) % 4 === me);
  const partner = partnerOf(me);
  const partnerCalls = s.auction.filter((_, k) => (s.dealer + k) % 4 === partner);
  const weBid =
    myCalls.some((c) => c.startsWith('bid:')) || partnerCalls.some((c) => c.startsWith('bid:'));
  const pick = (call: string) => (legal.includes(call) ? call : 'pass');

  // Openings and competitive entries while our side is silent.
  if (!weBid && !partnerCalls.includes('double')) {
    if (!last) return pick(openingCall(hand));
    if (level === 'easy' || myCalls.length > 0) return 'pass';
    if (sideOf(last.seat) === sideOf(me)) return 'pass';
    if (last.level === 1 && p >= 15 && p <= 18 && bal) return pick(bidCall(1, 4));
    let best = -1;
    for (const strain of [3, 2, 1, 0])
      if (strain !== last.strain && len[strain]! >= 5 && (best < 0 || len[strain]! > len[best]!))
        best = strain;
    if (best >= 0 && p >= 8 && p <= 16) {
      const lvl =
        bidRank(last.level, last.strain) < bidRank(last.level, best) ? last.level : last.level + 1;
      if (lvl === 1 || (lvl === 2 && p >= 11)) return pick(bidCall(lvl, best));
    }
    const theirs = last.strain < 4 ? len[last.strain]! : 3;
    if (p >= 12 && theirs <= 1 && last.level <= 2 && doubled === 0) return pick('double');
    return 'pass';
  }

  // Placement: our side is in the auction. Too weak to respond to a one-level opening: pass.
  const partnerOpened = partnerCalls.some((c) => c.startsWith('bid:'));
  if (partnerOpened && !myCalls.some((c) => c.startsWith('bid:')) && p < 6) {
    const opening = parseBid(partnerCalls.find((c) => c.startsWith('bid:'))!)!;
    if (!(opening.level === 2 && opening.strain === 0)) return 'pass';
  }
  const shown = shownBy(s, partner);
  const partnerPoints =
    shown.min + Math.max(0, (Math.min(shown.max, shown.min + 9) - shown.min) / 3);
  const fitLen = (strain: number) => len[strain]! + shown.len[strain]!;
  let strain = -1;
  for (const st of [3, 2])
    if (fitLen(st) >= 8 && (strain < 0 || fitLen(st) > fitLen(strain))) strain = st;
  if (strain < 0 && (bal || Math.max(...len) < 6) && level === 'medium') strain = 4;
  if (strain < 0)
    for (const st of [1, 0])
      if (fitLen(st) >= 8 && (strain < 0 || fitLen(st) > fitLen(strain))) strain = st;
  if (strain < 0) {
    const longest = len.indexOf(Math.max(...len));
    strain = len[longest]! >= 6 ? longest : 4;
  }
  const bonus = strain < 4 && len[strain]! >= 3 ? shortness(len, strain) : 0;
  const points = p + partnerPoints + (level === 'medium' ? bonus : 0);
  let target = targetLevel(points, strain);
  if (level === 'easy') target = Math.min(target, points >= 26 ? targetLevel(points, strain) : 2);

  // Where the auction stands for us.
  const ourLast = last && sideOf(last.seat) === sideOf(me) ? last : null;
  const isGame = (b: { level: number; strain: number }) =>
    b.level >= 5 || (b.level === 4 && b.strain >= 2) || (b.level === 3 && b.strain === 4);
  // Partner has placed a game: only a slam goes on.
  if (ourLast && isGame(ourLast) && target < 6) return 'pass';
  if (ourLast && ourLast.level >= target) {
    // Already high enough; correct a misfit at the same level only when it is cheap.
    return 'pass';
  }
  if (last && sideOf(last.seat) !== sideOf(me)) {
    // They hold the contract: outbid them, or double when we have the points for game.
    const ours = bidRank(target, strain);
    if (ours <= bidRank(last.level, last.strain)) {
      if (level === 'medium' && points >= 25 && last.level >= 2 && doubled === 0)
        return pick('double');
      return 'pass';
    }
  }
  // Bid the target directly at game or above, otherwise the cheapest bid in the strain.
  const minLevel = last
    ? bidRank(last.level, last.strain) < bidRank(last.level, strain)
      ? last.level
      : last.level + 1
    : 1;
  if (minLevel > 7) return 'pass';
  const bidLevel = target >= 3 && points >= 25 ? Math.max(minLevel, target) : minLevel;
  if (bidLevel > target && !(ourLast === null && bidLevel <= 2 && points >= 20)) return 'pass';
  return pick(bidCall(bidLevel, strain));
}

/** The suit of a strain index, for the card play (null for no trump). */
export const trumpSuit = (strain: number) => STRAIN_SUITS[strain] ?? null;
