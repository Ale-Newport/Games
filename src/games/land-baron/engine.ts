/**
 * Land Baron rules (pure). 2–5 players race round a 36-space harbour town (board.ts) buying lots,
 * ferries and works. Landing on another player's property pays rent; whole colour districts double
 * bare rents and allow houses (built evenly, 4 then a hotel) from a limited bank. Unbought property
 * is auctioned. Luck and Council cards move, pay or charge; three doubles or the arrest corner send
 * a player to the Lockup (bail, a pardon card or doubles get them out). Players mortgage, sell
 * buildings and trade; one who cannot pay is bankrupt and hands everything to the creditor (or back
 * to the bank). The last player left wins — or, in a timed game, the richest when the rounds run
 * out. Dice and decks come from a generator stored in the state. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  BAIL,
  COUNCIL,
  FERRIES,
  FERRY_RENT,
  GROUP_LOTS,
  HOTELS,
  HOUSES,
  LOCKUP,
  LUCK,
  OWNABLE,
  SIZE,
  SPACES,
  START_CASH,
  START_PAY,
  WORKS,
  WORKS_MULT,
  type Card,
} from './board';

export const MAX_ROUNDS = 400;
export const MAX_OFFERS = 2;

export type Deck = 'luck' | 'council';
export type Phase =
  | { k: 'roll' }
  | { k: 'buy'; at: number }
  | { k: 'auction'; at: number; bid: number; high: number | null; active: number[]; idx: number }
  | { k: 'main' }
  | { k: 'debt' }
  | { k: 'offer'; from: number; to: number; give: number[]; get: number[]; cash: number }
  | { k: 'over' };

export interface Debt {
  from: number;
  /** Creditor: a player, or −1 for the bank. */
  to: number;
  amount: number;
}

export type LogEntry =
  | { k: 'roll'; p: number; dice: [number, number]; to: number; lockup?: 'free' | 'stay' | 'bail' }
  | { k: 'start'; p: number }
  | { k: 'buy'; p: number; at: number; price: number }
  | { k: 'auction'; p: number | null; at: number; price: number }
  | { k: 'rent'; p: number; to: number; at: number; n: number }
  | { k: 'tax'; p: number; n: number }
  | { k: 'card'; p: number; deck: Deck; id: string }
  | { k: 'lockup'; p: number; why: 'arrest' | 'doubles' | 'card' }
  | { k: 'out'; p: number; by: number }
  | { k: 'build'; p: number; at: number; level: number }
  | { k: 'sell'; p: number; at: number; level: number }
  | { k: 'mortgage'; p: number; at: number; on: boolean }
  | { k: 'trade'; p: number; to: number; ok: boolean }
  | { k: 'bail'; p: number; how: 'cash' | 'pardon' }
  | { k: 'win'; p: number };

export interface Baron {
  seed: number;
  rng: RngState;
  players: number;
  /** Rounds in a timed game (0: play until one player is left). */
  limit: number;
  pos: number[];
  cash: number[];
  /** Failed escape rolls in the Lockup, or −1 when free. */
  lockup: number[];
  pardons: Deck[][];
  out: boolean[];
  owner: (number | null)[];
  /** 0–4 houses, 5 a hotel. */
  houses: number[];
  mortgaged: boolean[];
  luck: number[];
  council: number[];
  turn: number;
  round: number;
  doubles: number;
  dice: [number, number] | null;
  /** The player rolled doubles and rolls again after this move. */
  again: boolean;
  phase: Phase;
  /** Payments still owed, the first being settled now. */
  debts: Debt[];
  /** The phase to return to once debts are settled. */
  after: Phase;
  offers: number;
  card: { deck: Deck; id: string } | null;
  winner: number | null;
  log: LogEntry[];
}

export type Action =
  | { t: 'roll' }
  | { t: 'bail' }
  | { t: 'pardon' }
  | { t: 'buy' }
  | { t: 'decline' }
  | { t: 'bid'; n: number }
  | { t: 'pass' }
  | { t: 'build'; at: number }
  | { t: 'sell'; at: number }
  | { t: 'mortgage'; at: number }
  | { t: 'redeem'; at: number }
  | { t: 'offer'; to: number; give: number[]; get: number[]; cash: number }
  | { t: 'answer'; accept: boolean }
  | { t: 'end' };

/* ---------- setup ---------- */

export function newBaron(players: number, seed: number, limit = 0): Baron {
  if (players < 2 || players > 5) throw new RangeError('Land Baron is for 2–5 players');
  const rng = new Rng(seed >>> 0);
  const luck = rng.shuffle(LUCK.map((_, i) => i));
  const council = rng.shuffle(COUNCIL.map((_, i) => i));
  return {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    limit,
    pos: Array<number>(players).fill(0),
    cash: Array<number>(players).fill(START_CASH),
    lockup: Array<number>(players).fill(-1),
    pardons: Array.from({ length: players }, () => []),
    out: Array<boolean>(players).fill(false),
    owner: SPACES.map(() => null),
    houses: SPACES.map(() => 0),
    mortgaged: SPACES.map(() => false),
    luck,
    council,
    turn: 0,
    round: 0,
    doubles: 0,
    dice: null,
    again: false,
    phase: { k: 'roll' },
    debts: [],
    after: { k: 'main' },
    offers: 0,
    card: null,
    winner: null,
    log: [],
  };
}

/* ---------- queries ---------- */

export const price = (at: number) => SPACES[at]!.price ?? 0;
export const mortgageValue = (at: number) => Math.floor(price(at) / 2);
export const redeemCost = (at: number) => Math.ceil(mortgageValue(at) * 1.1);
export const houseCost = (at: number) => SPACES[at]!.houseCost ?? 0;
export const groupOf = (at: number) => SPACES[at]!.group ?? -1;
export const ownsGroup = (g: Baron, p: number, group: number) =>
  GROUP_LOTS[group]!.every((s) => g.owner[s] === p);
export const holdings = (g: Baron, p: number) => OWNABLE.filter((s) => g.owner[s] === p);
export const housesLeft = (g: Baron) =>
  HOUSES - g.houses.reduce((a, h) => a + (h > 0 && h < 5 ? h : 0), 0);
export const hotelsLeft = (g: Baron) => HOTELS - g.houses.filter((h) => h === 5).length;
const groupHasBuildings = (g: Baron, group: number) =>
  group >= 0 && GROUP_LOTS[group]!.some((s) => g.houses[s]! > 0);

/** What p would raise by selling every building (at half cost) and mortgaging everything. */
export function liquidation(g: Baron, p: number): number {
  let v = 0;
  for (const s of holdings(g, p)) {
    if (!g.mortgaged[s]) v += mortgageValue(s);
    v += Math.floor((houseCost(s) * g.houses[s]!) / 2);
  }
  return v;
}

/** Cash, property at price (half when mortgaged) and buildings at cost. */
export function worth(g: Baron, p: number): number {
  return (
    g.cash[p]! +
    holdings(g, p).reduce(
      (a, s) => a + (g.mortgaged[s] ? mortgageValue(s) : price(s)) + houseCost(s) * g.houses[s]!,
      0,
    )
  );
}

export function rentFor(g: Baron, at: number, dice: number, double = false): number {
  const o = g.owner[at];
  if (o === null || o === undefined || g.mortgaged[at]) return 0;
  const sp = SPACES[at]!;
  if (sp.kind === 'lot') {
    const h = g.houses[at]!;
    if (h > 0) return sp.rent![h]!;
    return sp.rent![0]! * (ownsGroup(g, o, sp.group!) ? 2 : 1);
  }
  if (sp.kind === 'ferry') {
    const n = FERRIES.filter((f) => g.owner[f] === o).length;
    return FERRY_RENT[n - 1]! * (double ? 2 : 1);
  }
  if (sp.kind === 'works') {
    const n = WORKS.filter((w) => g.owner[w] === o).length;
    return dice * (double ? 10 : WORKS_MULT[n - 1]!);
  }
  return 0;
}

export function currentPlayer(g: Baron): number {
  const ph = g.phase;
  if (ph.k === 'over') return -1;
  if (ph.k === 'auction') return ph.active[ph.idx]!;
  if (ph.k === 'offer') return ph.to;
  if (ph.k === 'debt') return g.debts[0]!.from;
  return g.turn;
}

/** Whether p may build one more level on lot `at` now. */
export function canBuild(g: Baron, p: number, at: number): boolean {
  const sp = SPACES[at]!;
  if (sp.kind !== 'lot' || g.owner[at] !== p) return false;
  const lots = GROUP_LOTS[sp.group!]!;
  if (!ownsGroup(g, p, sp.group!) || lots.some((s) => g.mortgaged[s])) return false;
  const h = g.houses[at]!;
  if (h >= 5 || h > Math.min(...lots.map((s) => g.houses[s]!))) return false;
  if (g.cash[p]! < sp.houseCost!) return false;
  return h === 4 ? hotelsLeft(g) > 0 : housesLeft(g) > 0;
}
/** Whether p may sell one level from lot `at` (evenly). */
export function canSell(g: Baron, p: number, at: number): boolean {
  const sp = SPACES[at]!;
  if (sp.kind !== 'lot' || g.owner[at] !== p || g.houses[at]! === 0) return false;
  return g.houses[at]! >= Math.max(...GROUP_LOTS[sp.group!]!.map((s) => g.houses[s]!));
}
export const canMortgage = (g: Baron, p: number, at: number) =>
  g.owner[at] === p && !g.mortgaged[at] && !groupHasBuildings(g, groupOf(at));
export const canRedeem = (g: Baron, p: number, at: number) =>
  g.owner[at] === p && g.mortgaged[at]! && g.cash[p]! >= redeemCost(at);

/** Property that may change hands in a trade: no buildings in its district. */
export const tradable = (g: Baron, p: number, at: number) =>
  g.owner[at] === p && !groupHasBuildings(g, groupOf(at));

export function offerOk(g: Baron, to: number, give: number[], get: number[], cash: number) {
  if (g.phase.k !== 'main' || g.offers >= MAX_OFFERS) return false;
  const p = g.turn;
  if (to === p || to < 0 || to >= g.players || g.out[to]) return false;
  if (!Number.isInteger(cash)) return false;
  if (!give.length && !get.length) return false;
  if (new Set(give).size !== give.length || new Set(get).size !== get.length) return false;
  if (!give.every((s) => tradable(g, p, s)) || !get.every((s) => tradable(g, to, s))) return false;
  if (cash > g.cash[p]! || -cash > g.cash[to]!) return false;
  // Something must change hands each way (property or cash).
  return (give.length > 0 || cash > 0) && (get.length > 0 || cash < 0);
}

/* ---------- legal actions ---------- */

/** Building, mortgage and offer moves available to the player in the main phase or in debt. */
function assetMoves(g: Baron, p: number, debt: boolean): Action[] {
  const out: Action[] = [];
  for (const s of holdings(g, p)) {
    if (!debt && canBuild(g, p, s)) out.push({ t: 'build', at: s });
    if (canSell(g, p, s)) out.push({ t: 'sell', at: s });
    if (canMortgage(g, p, s)) out.push({ t: 'mortgage', at: s });
    if (!debt && canRedeem(g, p, s)) out.push({ t: 'redeem', at: s });
  }
  return out;
}

export function legalActions(g: Baron): Action[] {
  const ph = g.phase;
  const p = currentPlayer(g);
  switch (ph.k) {
    case 'over':
      return [];
    case 'roll': {
      const out: Action[] = [{ t: 'roll' }];
      if (g.lockup[p]! >= 0) {
        if (g.cash[p]! >= BAIL) out.push({ t: 'bail' });
        if (g.pardons[p]!.length) out.push({ t: 'pardon' });
      }
      return [...out, ...assetMoves(g, p, false)];
    }
    case 'buy': {
      const out: Action[] = [{ t: 'decline' }];
      if (g.cash[p]! >= price(ph.at)) out.unshift({ t: 'buy' });
      return [...out, ...assetMoves(g, p, true)];
    }
    case 'auction': {
      const out: Action[] = [{ t: 'pass' }];
      for (const step of [10, 50, 100]) {
        const n = ph.bid + step;
        if (n <= g.cash[p]!) out.push({ t: 'bid', n });
      }
      if (ph.high === null && g.cash[p]! >= 1 && ph.bid === 0) out.push({ t: 'bid', n: 1 });
      return out;
    }
    case 'main':
      return [...assetMoves(g, p, false), { t: 'end' }];
    case 'debt':
      return assetMoves(g, p, true);
    case 'offer': {
      const out: Action[] = [{ t: 'answer', accept: false }];
      if (ph.cash >= 0 || g.cash[ph.to]! >= -ph.cash) out.unshift({ t: 'answer', accept: true });
      return out;
    }
  }
}

export function isLegal(g: Baron, a: Action): boolean {
  const ph = g.phase;
  const p = currentPlayer(g);
  if (p < 0) return false;
  switch (a.t) {
    case 'offer':
      return offerOk(g, a.to, a.give, a.get, a.cash);
    case 'bid':
      return ph.k === 'auction' && Number.isInteger(a.n) && a.n > ph.bid && a.n <= g.cash[p]!;
    case 'build':
      return (ph.k === 'main' || ph.k === 'roll') && canBuild(g, p, a.at);
    case 'redeem':
      return (ph.k === 'main' || ph.k === 'roll') && canRedeem(g, p, a.at);
    case 'sell':
      return ['main', 'roll', 'debt', 'buy'].includes(ph.k) && canSell(g, p, a.at);
    case 'mortgage':
      return ['main', 'roll', 'debt', 'buy'].includes(ph.k) && canMortgage(g, p, a.at);
    default: {
      const key = JSON.stringify(a);
      return legalActions(g).some((b) => JSON.stringify(b) === key);
    }
  }
}

/* ---------- transitions ---------- */

const LOG_KEEP = 50;
const log = (g: Baron, e: LogEntry) => {
  g.log = [...g.log, e].slice(-LOG_KEEP);
};
const rngOf = (g: Baron) => new Rng(g.rng);

function sendToLockup(g: Baron, p: number, why: 'arrest' | 'doubles' | 'card') {
  g.pos[p] = LOCKUP;
  g.lockup[p] = 0;
  g.again = false;
  g.doubles = 0;
  log(g, { k: 'lockup', p, why });
}

/** Moves p forward by n, paying Start when passing or landing on it. */
function advance(g: Baron, p: number, n: number) {
  const to = (g.pos[p]! + n) % SIZE;
  if (g.pos[p]! + n >= SIZE) {
    g.cash[p]! += START_PAY;
    log(g, { k: 'start', p });
  }
  g.pos[p] = to;
}
function moveTo(g: Baron, p: number, to: number) {
  const n = (to - g.pos[p]! + SIZE) % SIZE;
  advance(g, p, n);
}

/** Queues a payment; settles at once what can be paid from cash. */
function charge(g: Baron, from: number, to: number, amount: number) {
  if (amount <= 0 || g.out[from]) return;
  g.debts.push({ from, to, amount });
}

/** Settles queued payments: pays from cash, asks the debtor to raise money, or bankrupts them. */
function settle(g: Baron) {
  while (g.debts.length) {
    const d = g.debts[0]!;
    if (g.out[d.from]) {
      g.debts.shift();
      continue;
    }
    if (g.cash[d.from]! >= d.amount) {
      g.cash[d.from]! -= d.amount;
      if (d.to >= 0) g.cash[d.to]! += d.amount;
      g.debts.shift();
      continue;
    }
    if (g.cash[d.from]! + liquidation(g, d.from) >= d.amount) {
      if (g.phase.k !== 'debt') {
        g.after = g.phase;
        g.phase = { k: 'debt' };
      }
      return;
    }
    bankrupt(g, d.from, d.to);
    g.debts.shift();
  }
  if (g.phase.k === 'debt') g.phase = g.after;
  checkOver(g);
  // A player who went bankrupt on their own turn hands the turn on.
  if (g.phase.k !== 'over' && g.out[g.turn]) nextTurn(g);
}

/** p cannot pay: buildings go back to the bank for half, everything else to the creditor. */
function bankrupt(g: Baron, p: number, to: number) {
  for (const s of holdings(g, p)) {
    g.cash[p]! += Math.floor((houseCost(s) * g.houses[s]!) / 2);
    g.houses[s] = 0;
  }
  if (to >= 0) {
    g.cash[to]! += Math.max(0, g.cash[p]!);
    for (const s of holdings(g, p)) g.owner[s] = to;
    g.pardons[to]!.push(...g.pardons[p]!);
  } else {
    for (const s of holdings(g, p)) {
      g.owner[s] = null;
      g.mortgaged[s] = false;
    }
    for (const d of g.pardons[p]!) returnPardon(g, d);
  }
  g.pardons[p] = [];
  g.cash[p] = 0;
  g.out[p] = true;
  g.lockup[p] = -1;
  g.debts = g.debts.filter((d) => d.from !== p);
  log(g, { k: 'out', p, by: to });
}

/** A used (or forfeited) pardon card goes back under its pile. */
function returnPardon(g: Baron, d: Deck) {
  const pile = d === 'luck' ? g.luck : g.council;
  pile.push((d === 'luck' ? LUCK : COUNCIL).findIndex((c) => c.effect.k === 'pardon'));
}

function checkOver(g: Baron) {
  if (g.phase.k === 'over') return;
  const alive = g.out.map((o, p) => (o ? -1 : p)).filter((p) => p >= 0);
  if (alive.length === 1) finishWith(g, alive[0]!);
}
function finishWith(g: Baron, p: number) {
  g.winner = p;
  g.phase = { k: 'over' };
  g.debts = [];
  log(g, { k: 'win', p });
}

function drawCard(g: Baron, p: number, deck: Deck): void {
  const pile = deck === 'luck' ? g.luck : g.council;
  const idx = pile.shift()!;
  const card: Card = (deck === 'luck' ? LUCK : COUNCIL)[idx]!;
  g.card = { deck, id: card.id };
  log(g, { k: 'card', p, deck, id: card.id });
  const e = card.effect;
  if (e.k === 'pardon') g.pardons[p]!.push(deck);
  else pile.push(idx);
  switch (e.k) {
    case 'move':
      moveTo(g, p, e.to);
      return land(g, p, false);
    case 'back':
      g.pos[p] = (g.pos[p]! - e.n + SIZE) % SIZE;
      return land(g, p, false);
    case 'nearest': {
      const list = e.kind === 'ferry' ? FERRIES : WORKS;
      const to = list.find((s) => s > g.pos[p]!) ?? list[0]!;
      moveTo(g, p, to);
      return land(g, p, true);
    }
    case 'money':
      if (e.n > 0) g.cash[p]! += e.n;
      else charge(g, p, -1, -e.n);
      return;
    case 'each':
      g.out.forEach((o, q) => {
        if (o || q === p) return;
        if (e.n > 0) charge(g, q, p, e.n);
        else charge(g, p, q, -e.n);
      });
      return;
    case 'repairs': {
      let n = 0;
      for (const s of holdings(g, p)) n += g.houses[s] === 5 ? e.hotel : g.houses[s]! * e.house;
      charge(g, p, -1, n);
      return;
    }
    case 'lockup':
      sendToLockup(g, p, 'card');
      return;
    case 'pardon':
      return;
  }
}

/** Resolves landing on p's space. */
function land(g: Baron, p: number, cardDouble: boolean): void {
  const at = g.pos[p]!;
  const sp = SPACES[at]!;
  const dice = g.dice ? g.dice[0] + g.dice[1] : 7;
  switch (sp.kind) {
    case 'lot':
    case 'ferry':
    case 'works': {
      const o = g.owner[at];
      if (o === null || o === undefined) {
        g.phase = { k: 'buy', at };
        return;
      }
      if (o !== p) {
        const n = rentFor(g, at, dice, cardDouble);
        if (n > 0) {
          log(g, { k: 'rent', p, to: o, at, n });
          charge(g, p, o, n);
        }
      }
      return;
    }
    case 'tax':
      log(g, { k: 'tax', p, n: sp.tax! });
      charge(g, p, -1, sp.tax!);
      return;
    case 'luck':
      return drawCard(g, p, 'luck');
    case 'council':
      return drawCard(g, p, 'council');
    case 'arrest':
      sendToLockup(g, p, 'arrest');
      return;
    default:
      return;
  }
}

function nextTurn(g: Baron) {
  g.offers = 0;
  g.again = false;
  g.doubles = 0;
  g.card = null;
  let q = g.turn;
  do {
    q = (q + 1) % g.players;
    if (q === 0) g.round += 1;
  } while (g.out[q]);
  g.turn = q;
  g.phase = { k: 'roll' };
  const limit = g.limit || MAX_ROUNDS;
  if (g.round >= limit) {
    // Timed game (or the safety limit): the richest player wins; ties to the earliest seat.
    let best = -1;
    g.out.forEach((o, p) => {
      if (!o && (best < 0 || worth(g, p) > worth(g, best))) best = p;
    });
    finishWith(g, best);
  }
}

function startAuction(g: Baron, at: number) {
  const active: number[] = [];
  for (let k = 0; k < g.players; k++) {
    const q = (g.turn + k) % g.players;
    if (!g.out[q]) active.push(q);
  }
  g.phase = { k: 'auction', at, bid: 0, high: null, active, idx: 0 };
}

function closeAuction(g: Baron) {
  const ph = g.phase;
  if (ph.k !== 'auction') return;
  if (ph.high !== null) {
    g.owner[ph.at] = ph.high;
    g.cash[ph.high]! -= ph.bid;
  }
  log(g, { k: 'auction', p: ph.high, at: ph.at, price: ph.bid });
  g.phase = { k: 'main' };
}

export function act(g0: Baron, a: Action): Baron {
  if (!isLegal(g0, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g: Baron = structuredClone(g0);
  const ph = g.phase;
  const p = currentPlayer(g);
  switch (a.t) {
    case 'roll': {
      const rng = rngOf(g);
      const dice: [number, number] = [rng.range(1, 6), rng.range(1, 6)];
      g.rng = rng.state;
      g.dice = dice;
      g.card = null;
      const sum = dice[0] + dice[1];
      const dbl = dice[0] === dice[1];
      if (g.lockup[p]! >= 0) {
        if (dbl) {
          g.lockup[p] = -1;
          advance(g, p, sum);
          log(g, { k: 'roll', p, dice, to: g.pos[p]!, lockup: 'free' });
          g.phase = { k: 'main' };
          land(g, p, false);
        } else if (g.lockup[p]! >= 2) {
          // Third failed roll: pay the bail and move.
          g.lockup[p] = -1;
          charge(g, p, -1, BAIL);
          advance(g, p, sum);
          log(g, { k: 'roll', p, dice, to: g.pos[p]!, lockup: 'bail' });
          g.phase = { k: 'main' };
          land(g, p, false);
        } else {
          g.lockup[p]! += 1;
          log(g, { k: 'roll', p, dice, to: g.pos[p]!, lockup: 'stay' });
          g.phase = { k: 'main' };
        }
        g.again = false;
        break;
      }
      if (dbl) {
        g.doubles += 1;
        if (g.doubles === 3) {
          log(g, { k: 'roll', p, dice, to: LOCKUP });
          sendToLockup(g, p, 'doubles');
          g.phase = { k: 'main' };
          break;
        }
      }
      g.again = dbl;
      advance(g, p, sum);
      log(g, { k: 'roll', p, dice, to: g.pos[p]! });
      g.phase = { k: 'main' };
      land(g, p, false);
      break;
    }
    case 'bail':
      g.cash[p]! -= BAIL;
      g.lockup[p] = -1;
      log(g, { k: 'bail', p, how: 'cash' });
      break;
    case 'pardon': {
      returnPardon(g, g.pardons[p]!.shift()!);
      g.lockup[p] = -1;
      log(g, { k: 'bail', p, how: 'pardon' });
      break;
    }
    case 'buy': {
      if (ph.k !== 'buy') break;
      g.cash[p]! -= price(ph.at);
      g.owner[ph.at] = p;
      log(g, { k: 'buy', p, at: ph.at, price: price(ph.at) });
      g.phase = { k: 'main' };
      break;
    }
    case 'decline':
      if (ph.k === 'buy') startAuction(g, ph.at);
      break;
    case 'bid':
    case 'pass': {
      if (ph.k !== 'auction') break;
      const active = [...ph.active];
      let idx = ph.idx;
      let { bid, high } = ph;
      if (a.t === 'bid') {
        bid = a.n;
        high = p;
        idx = (idx + 1) % active.length;
      } else {
        active.splice(idx, 1);
        if (idx >= active.length) idx = 0;
      }
      g.phase = { k: 'auction', at: ph.at, bid, high, active, idx };
      // Done when nobody is left to outbid the high bidder, or everyone passed.
      if (!active.length || (active.length === 1 && high === active[0])) closeAuction(g);
      else if (high !== null && active[idx] === high) closeAuction(g);
      break;
    }
    case 'build': {
      g.cash[p]! -= houseCost(a.at);
      g.houses[a.at]! += 1;
      log(g, { k: 'build', p, at: a.at, level: g.houses[a.at]! });
      break;
    }
    case 'sell': {
      const h = g.houses[a.at]!;
      if (h === 5 && housesLeft(g) < 4) {
        // Not enough houses in the bank to break the hotel down: it is sold outright.
        g.houses[a.at] = 0;
        g.cash[p]! += Math.floor((houseCost(a.at) * 5) / 2);
      } else {
        g.houses[a.at] = h - 1;
        g.cash[p]! += Math.floor(houseCost(a.at) / 2);
      }
      log(g, { k: 'sell', p, at: a.at, level: g.houses[a.at]! });
      break;
    }
    case 'mortgage':
      g.mortgaged[a.at] = true;
      g.cash[p]! += mortgageValue(a.at);
      log(g, { k: 'mortgage', p, at: a.at, on: true });
      break;
    case 'redeem':
      g.mortgaged[a.at] = false;
      g.cash[p]! -= redeemCost(a.at);
      log(g, { k: 'mortgage', p, at: a.at, on: false });
      break;
    case 'offer':
      g.offers += 1;
      g.phase = { k: 'offer', from: p, to: a.to, give: [...a.give], get: [...a.get], cash: a.cash };
      break;
    case 'answer': {
      if (ph.k !== 'offer') break;
      if (a.accept) {
        for (const s of ph.give) g.owner[s] = ph.to;
        for (const s of ph.get) g.owner[s] = ph.from;
        g.cash[ph.from]! -= ph.cash;
        g.cash[ph.to]! += ph.cash;
      }
      log(g, { k: 'trade', p: ph.from, to: ph.to, ok: a.accept });
      g.phase = { k: 'main' };
      break;
    }
    case 'end':
      if (g.again && g.lockup[p]! < 0) {
        g.phase = { k: 'roll' };
        g.card = null;
      } else nextTurn(g);
      break;
  }
  settle(g);
  return g;
}

/* ---------- validation ---------- */

export function isValidBaron(v: unknown): v is Baron {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Baron;
  if (!Number.isInteger(g.players) || g.players < 2 || g.players > 5) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  const arr = (x: unknown, n: number) => Array.isArray(x) && x.length === n;
  if (!arr(g.pos, g.players) || !arr(g.cash, g.players) || !arr(g.lockup, g.players)) return false;
  if (!arr(g.out, g.players) || !arr(g.pardons, g.players)) return false;
  if (!arr(g.owner, SIZE) || !arr(g.houses, SIZE) || !arr(g.mortgaged, SIZE)) return false;
  if (!g.pos.every((x) => Number.isInteger(x) && x >= 0 && x < SIZE)) return false;
  if (!g.houses.every((h) => Number.isInteger(h) && h >= 0 && h <= 5)) return false;
  // Every Luck and Council card is in its pile or held as a pardon.
  const held = (d: Deck) => g.pardons.flat().filter((x) => x === d).length;
  if (g.luck.length + held('luck') !== LUCK.length) return false;
  if (g.council.length + held('council') !== COUNCIL.length) return false;
  if (!Array.isArray(g.debts) || !Number.isInteger(g.turn)) return false;
  const kinds = ['roll', 'buy', 'auction', 'main', 'debt', 'offer', 'over'];
  return typeof g.phase === 'object' && g.phase !== null && kinds.includes(g.phase.k);
}
