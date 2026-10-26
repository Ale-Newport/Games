/**
 * Contract bridge (#095) for four players in two partnerships: north–south (the player is south)
 * against east–west, over a Chicago of four deals.
 *
 * - Each deal: 13 cards each; an auction from the dealer clockwise. A bid names a level (1–7, tricks
 *   above six) and a strain (clubs < diamonds < hearts < spades < no trump) and must outrank the
 *   last bid; a player may also pass, double the opponents' last bid or redouble their double. Four
 *   opening passes throw the deal in; otherwise three passes after a bid end the auction.
 * - The declarer is the first player of the contracting side to have named the strain; the player
 *   on the declarer's left leads, then the declarer's partner (dummy) lays their hand face up and
 *   the declarer plays both. Players follow suit; the trump suit (if any) beats the others.
 * - Duplicate scoring per deal (made contracts, game and part-score bonuses, slams, overtricks,
 *   doubled and redoubled undertricks). Chicago vulnerability: none on deal 1, the dealer's side on
 *   deals 2 and 3, both on deal 4. The higher total after four deals wins.
 *
 * Seats: 0 south, 1 west, 2 north, 3 east; north–south is side 0. Actions: "bid:3H", "bid:1N",
 * "pass", "double", "redouble", "play:c", "next".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { CLUBS, DIAMONDS, HEARTS, SPADES, shuffledDeck, suitOf } from '../shared/cards/cards';
import { followSuit, trickWinner, type Play } from '../shared/tricks/cards';

export const DEALS = 4;
/** Strains 0–4: clubs, diamonds, hearts, spades, no trump. */
export const STRAIN_LETTERS = 'CDHSN';
export const STRAIN_SUITS = [CLUBS, DIAMONDS, HEARTS, SPADES, null] as const;

export const sideOf = (seat: number) => (seat % 2) as 0 | 1;
export const partnerOf = (seat: number) => (seat + 2) % 4;

export interface Contract {
  level: number;
  strain: number;
  declarer: number;
  /** 0 undoubled, 1 doubled, 2 redoubled. */
  doubled: 0 | 1 | 2;
}

export interface DealResult {
  /** Points for each side on this deal. */
  points: [number, number];
  /** Tricks the declarer took relative to the contract (negative: down). */
  over: number;
  passedOut: boolean;
}

export interface BridgeState {
  seed: number;
  dealNo: number;
  dealer: number;
  /** Vulnerability of each side on this deal. */
  vulnerable: [boolean, boolean];
  hands: number[][];
  phase: 'auction' | 'play' | 'done';
  auction: string[];
  contract: Contract | null;
  /** The seat whose card or call is next (on dummy's turn, dummy's seat — the declarer plays it). */
  toAct: number;
  trick: Play[];
  /** Tricks won by each side this deal. */
  tricks: [number, number];
  played: number;
  lastTrick: Play[] | null;
  /** Whether dummy's hand is face up (after the opening lead). */
  dummyShown: boolean;
  shownOut: number[][];
  result: DealResult | null;
  scores: [number, number];
  history: string[];
  /** After the fourth deal: the winning side, or null for a tie. */
  over: boolean;
  winner: 0 | 1 | null;
}

/** Chicago vulnerability: none, dealer's side, dealer's side, both. */
export function chicagoVulnerability(dealNo: number, dealer: number): [boolean, boolean] {
  const k = (dealNo - 1) % 4;
  if (k === 0) return [false, false];
  if (k === 3) return [true, true];
  const side = sideOf(dealer);
  return [side === 0, side === 1];
}

function deal(s: BridgeState) {
  const deck = shuffledDeck((s.seed * 4447 + s.dealNo * 7919) >>> 0);
  s.hands = [0, 1, 2, 3].map((p) => deck.slice(p * 13, p * 13 + 13));
  s.dealer = (s.dealNo - 1) % 4;
  s.vulnerable = chicagoVulnerability(s.dealNo, s.dealer);
  s.phase = 'auction';
  s.auction = [];
  s.contract = null;
  s.toAct = s.dealer;
  s.trick = [];
  s.tricks = [0, 0];
  s.played = 0;
  s.lastTrick = null;
  s.dummyShown = false;
  s.shownOut = [[], [], [], []];
  s.result = null;
}

export function createBridge(seed: number): BridgeState {
  const s: BridgeState = {
    seed,
    dealNo: 1,
    dealer: 0,
    vulnerable: [false, false],
    hands: [],
    phase: 'auction',
    auction: [],
    contract: null,
    toAct: 0,
    trick: [],
    tricks: [0, 0],
    played: 0,
    lastTrick: null,
    dummyShown: false,
    shownOut: [],
    result: null,
    scores: [0, 0],
    history: [],
    over: false,
    winner: null,
  };
  deal(s);
  return s;
}

/** A bid's rank: 0 for 1♣ … 34 for 7NT. */
export const bidRank = (level: number, strain: number) => (level - 1) * 5 + strain;
export const parseBid = (call: string) => {
  const m = /^bid:([1-7])([CDHSN])$/.exec(call);
  return m ? { level: Number(m[1]), strain: STRAIN_LETTERS.indexOf(m[2]!) } : null;
};
export const bidCall = (level: number, strain: number) => `bid:${level}${STRAIN_LETTERS[strain]}`;

/** The last bid of the auction with who made it, and whether it stands doubled or redoubled. */
export function auctionState(s: BridgeState): {
  last: { level: number; strain: number; seat: number } | null;
  doubled: 0 | 1 | 2;
} {
  let last: { level: number; strain: number; seat: number } | null = null;
  let doubled: 0 | 1 | 2 = 0;
  s.auction.forEach((call, k) => {
    const seat = (s.dealer + k) % 4;
    const bid = parseBid(call);
    if (bid) {
      last = { ...bid, seat };
      doubled = 0;
    } else if (call === 'double') doubled = 1;
    else if (call === 'redouble') doubled = 2;
  });
  return { last, doubled };
}

export function legalCalls(s: BridgeState): string[] {
  const { last, doubled } = auctionState(s);
  const out = ['pass'];
  const me = s.toAct;
  if (last && sideOf(last.seat) !== sideOf(me) && doubled === 0) out.push('double');
  if (last && sideOf(last.seat) === sideOf(me) && doubled === 1) out.push('redouble');
  const from = last ? bidRank(last.level, last.strain) + 1 : 0;
  for (let r = from; r < 35; r++) out.push(bidCall(Math.floor(r / 5) + 1, r % 5));
  return out;
}

/** The seat whose hand is played on this turn's card, and the seat that chooses it. */
export const controllerOf = (s: BridgeState, seat = s.toAct) =>
  s.phase === 'play' && s.contract && seat === partnerOf(s.contract.declarer)
    ? s.contract.declarer
    : seat;

export function playableCards(s: BridgeState): number[] {
  const hand = s.hands[s.toAct]!;
  return followSuit(hand, s.trick.length ? suitOf(s.trick[0]!.card) : null);
}

export function legalBridgeActions(s: BridgeState): string[] {
  if (s.over) return [];
  if (s.phase === 'done') return ['next'];
  if (s.phase === 'auction') return legalCalls(s);
  return playableCards(s).map((c) => `play:${c}`);
}

/** Duplicate score of a contract for the declaring side (negative when it goes down). */
export function scoreContract(c: Contract, tricks: number, vulnerable: boolean): number {
  const needed = 6 + c.level;
  const mult = c.doubled === 2 ? 4 : c.doubled === 1 ? 2 : 1;
  if (tricks >= needed) {
    const per = c.strain <= 1 ? 20 : 30;
    const base = (c.strain === 4 ? 40 + 30 * (c.level - 1) : per * c.level) * mult;
    let score = base;
    score += base >= 100 ? (vulnerable ? 500 : 300) : 50;
    if (c.level === 6) score += vulnerable ? 750 : 500;
    if (c.level === 7) score += vulnerable ? 1500 : 1000;
    if (c.doubled === 1) score += 50;
    if (c.doubled === 2) score += 100;
    const over = tricks - needed;
    if (c.doubled === 0) score += over * per;
    else score += over * (vulnerable ? 200 : 100) * (c.doubled === 2 ? 2 : 1);
    return score;
  }
  const down = needed - tricks;
  if (c.doubled === 0) return -down * (vulnerable ? 100 : 50);
  let penalty = 0;
  for (let k = 1; k <= down; k++)
    penalty += vulnerable ? (k === 1 ? 200 : 300) : k === 1 ? 100 : k <= 3 ? 200 : 300;
  return -penalty * (c.doubled === 2 ? 2 : 1);
}

function endDeal(s: BridgeState, passedOut: boolean) {
  const points: [number, number] = [0, 0];
  let over = 0;
  if (!passedOut && s.contract) {
    const side = sideOf(s.contract.declarer);
    const taken = s.tricks[side];
    over = taken - (6 + s.contract.level);
    const score = scoreContract(s.contract, taken, s.vulnerable[side]);
    if (score >= 0) points[side] = score;
    else points[(1 - side) as 0 | 1] = -score;
  }
  s.result = { points, over, passedOut };
  s.scores = [s.scores[0] + points[0], s.scores[1] + points[1]];
  s.phase = 'done';
  s.toAct = -1;
  if (s.dealNo >= DEALS) {
    s.over = true;
    s.winner = s.scores[0] > s.scores[1] ? 0 : s.scores[1] > s.scores[0] ? 1 : null;
  }
}

function closeAuction(s: BridgeState) {
  const { last, doubled } = auctionState(s);
  if (!last) return endDeal(s, true);
  const side = sideOf(last.seat);
  // The declarer: the first of the side to name the strain.
  let declarer = last.seat;
  for (let k = 0; k < s.auction.length; k++) {
    const seat = (s.dealer + k) % 4;
    const bid = parseBid(s.auction[k]!);
    if (bid && bid.strain === last.strain && sideOf(seat) === side) {
      declarer = seat;
      break;
    }
  }
  s.contract = { level: last.level, strain: last.strain, declarer, doubled };
  s.phase = 'play';
  s.toAct = (declarer + 1) % 4;
}

export function applyBridgeAction(s: BridgeState, a: string): BridgeState {
  if (!legalBridgeActions(s).includes(a))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: BridgeState = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.dealNo++;
    deal(n);
    return n;
  }
  if (n.phase === 'auction') {
    n.auction.push(a);
    const calls = n.auction;
    const passes = calls.length - 1 - calls.findLastIndex((c) => c !== 'pass');
    const anyBid = calls.some((c) => c.startsWith('bid:'));
    if ((!anyBid && calls.length === 4) || (anyBid && passes >= 3 && calls.length >= 4))
      closeAuction(n);
    else n.toAct = (n.toAct + 1) % 4;
    return n;
  }
  const card = Number(a.slice(5));
  const seat = n.toAct;
  n.hands[seat] = n.hands[seat]!.filter((c) => c !== card);
  if (n.trick.length) {
    const led = suitOf(n.trick[0]!.card);
    if (suitOf(card) !== led && !n.shownOut[seat]!.includes(led)) n.shownOut[seat]!.push(led);
  }
  n.trick.push({ seat, card });
  n.dummyShown = true;
  if (n.trick.length < 4) {
    n.toAct = (seat + 1) % 4;
    return n;
  }
  const trump = STRAIN_SUITS[n.contract!.strain];
  const winner = trickWinner(n.trick, trump).seat;
  n.tricks[sideOf(winner)]++;
  n.lastTrick = n.trick;
  n.trick = [];
  n.played++;
  n.toAct = winner;
  if (n.played === 13) endDeal(n, false);
  return n;
}

export function replayBridge(seed: number, history: readonly string[]): BridgeState {
  return history.reduce((s, a) => applyBridgeAction(s, a), createBridge(seed));
}

export function isValidBridgeState(data: unknown): data is BridgeState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayBridge(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
