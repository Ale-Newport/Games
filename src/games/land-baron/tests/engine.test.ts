import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { decide, LANDING, value } from '../ai';
import { AGENT_PRESETS, CODE, decode, encode, env, legalCodes, observe } from '../ai-adapter';
import {
  BAIL,
  COUNCIL,
  FERRIES,
  GROUP_LOTS,
  HOUSES,
  LOCKUP,
  LUCK,
  OWNABLE,
  SIZE,
  SPACES,
  START_CASH,
  WORKS,
} from '../board';
import {
  act,
  canBuild,
  canMortgage,
  currentPlayer,
  housesLeft,
  isLegal,
  isValidBaron,
  legalActions,
  liquidation,
  newBaron,
  redeemCost,
  rentFor,
  worth,
  type Action,
  type Baron,
} from '../engine';

/** A fresh game whose next roll gives `dice` (found by trying generator states). */
function withRoll(g: Baron, want: (a: number, b: number) => boolean): Baron {
  for (let k = 0; k < 2000; k++) {
    const t = structuredClone(g);
    t.rng = new Rng(9000 + k).state;
    const n = act(t, { t: 'roll' });
    if (n.dice && want(n.dice[0], n.dice[1])) return t;
  }
  throw new Error('no such roll');
}
const total = (g: Baron) => g.cash.reduce((a, x) => a + x, 0);

describe('board', () => {
  it('36 spaces: 20 lots in 8 districts, 4 ferries, 2 works, corners and card spaces', () => {
    expect(SIZE).toBe(36);
    expect(SPACES.filter((s) => s.kind === 'lot')).toHaveLength(20);
    expect(GROUP_LOTS.map((l) => l.length)).toEqual([2, 2, 3, 3, 3, 3, 2, 2]);
    expect(FERRIES).toEqual([5, 14, 23, 32]);
    expect(WORKS).toHaveLength(2);
    expect(OWNABLE).toHaveLength(26);
    expect([0, 9, 18, 27].map((i) => SPACES[i]!.kind)).toEqual([
      'start',
      'lockup',
      'plaza',
      'arrest',
    ]);
    expect(LUCK).toHaveLength(16);
    expect(COUNCIL).toHaveLength(16);
    // Rents rise with each house; prices rise round the board.
    for (const lots of GROUP_LOTS)
      for (const s of lots) {
        const r = SPACES[s]!.rent!;
        for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThan(r[i - 1]!);
      }
    const prices = GROUP_LOTS.map((l) => SPACES[l[0]!]!.price!);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('landing frequencies: a distribution, the Lockup most visited, the arrest corner never', () => {
    expect(LANDING.reduce((a, x) => a + x, 0)).toBeCloseTo(1, 9);
    expect(LANDING[27]).toBe(0);
    expect(Math.max(...LANDING)).toBe(LANDING[LOCKUP]);
  });
});

describe('moving', () => {
  it('rolls move round the board and pay 200 when passing Start; doubles roll again', () => {
    let g = newBaron(2, 3);
    g.pos[0] = 30;
    g = withRoll(g, (a, b) => a !== b && a + b >= 8);
    const n = act(g, { t: 'roll' });
    const sum = n.dice![0] + n.dice![1];
    expect(n.pos[0]).toBe((30 + sum) % 36);
    expect(n.cash[0]).toBeGreaterThanOrEqual(START_CASH + 200 - 400);
    expect(n.log.some((e) => e.k === 'start')).toBe(true);
    // Doubles: after the move the same player rolls again.
    let d = withRoll(newBaron(2, 4), (a, b) => a === b && a + b !== 4 && a + b !== 2);
    d = act(d, { t: 'roll' });
    while (d.phase.k !== 'main')
      d = act(
        d,
        legalActions(d).find((a) => a.t === 'decline' || a.t === 'pass')!,
      );
    d = act(d, { t: 'end' });
    expect(d.turn).toBe(0);
    expect(d.phase).toEqual({ k: 'roll' });
  });

  it('three doubles, the arrest corner and the Lockup: bail, pardon, doubles or three tries', () => {
    const g = newBaron(2, 5);
    g.doubles = 2;
    const n = act(
      withRoll(g, (a, b) => a === b),
      { t: 'roll' },
    );
    expect(n.pos[0]).toBe(LOCKUP);
    expect(n.lockup[0]).toBe(0);
    expect(n.log.some((e) => e.k === 'lockup' && e.why === 'doubles')).toBe(true);
    // In the Lockup: bail costs 50.
    const j = structuredClone(n);
    j.phase = { k: 'roll' };
    const bailed = act(j, { t: 'bail' });
    expect(bailed.cash[0]).toBe(j.cash[0]! - BAIL);
    expect(bailed.lockup[0]).toBe(-1);
    // A failed roll stays; the third failure pays and moves.
    let s = withRoll(j, (a, b) => a !== b);
    s = act(s, { t: 'roll' });
    expect(s.lockup[0]).toBe(1);
    expect(s.pos[0]).toBe(LOCKUP);
    s.phase = { k: 'roll' };
    s.lockup[0] = 2;
    s = act(
      withRoll(s, (a, b) => a !== b),
      { t: 'roll' },
    );
    expect(s.lockup[0]).toBe(-1);
    expect(s.pos[0]).not.toBe(LOCKUP);
    // The arrest corner.
    const a = newBaron(2, 6);
    a.pos[0] = 27 - 7;
    const arrested = act(
      withRoll(a, (x, y) => x + y === 7),
      { t: 'roll' },
    );
    expect(arrested.pos[0]).toBe(LOCKUP);
  });
});

describe('buying and rent', () => {
  it('buy or decline; a declined space goes to auction and the highest bid wins', () => {
    let g = newBaron(3, 7);
    g.pos[0] = 0;
    g = withRoll(g, (a, b) => a + b === 6 && a !== b); // Twine Street
    g = act(g, { t: 'roll' });
    expect(g.phase).toEqual({ k: 'buy', at: 6 });
    const bought = act(g, { t: 'buy' });
    expect(bought.owner[6]).toBe(0);
    expect(bought.cash[0]).toBe(START_CASH - 100);
    let au = act(g, { t: 'decline' });
    expect(au.phase).toMatchObject({ k: 'auction', at: 6, bid: 0, active: [0, 1, 2] });
    au = act(au, { t: 'bid', n: 10 }); // seat 0
    au = act(au, { t: 'bid', n: 60 }); // seat 1
    au = act(au, { t: 'pass' }); // seat 2
    expect(isLegal(au, { t: 'bid', n: 50 })).toBe(false);
    au = act(au, { t: 'pass' }); // seat 0
    expect(au.owner[6]).toBe(1);
    expect(au.cash[1]).toBe(START_CASH - 60);
    expect(au.phase).toEqual({ k: 'main' });
    // Everyone passing leaves it unsold.
    let none = act(g, { t: 'decline' });
    for (let i = 0; i < 3; i++) none = act(none, { t: 'pass' });
    expect(none.owner[6]).toBeNull();
  });

  it('rents: bare, doubled for a whole district, by houses, ferries by count, works by dice', () => {
    const g = newBaron(2, 8);
    g.owner[1] = 1;
    expect(rentFor(g, 1, 7)).toBe(5);
    g.owner[3] = 1;
    expect(rentFor(g, 1, 7)).toBe(10);
    g.houses[1] = 3;
    expect(rentFor(g, 1, 7)).toBe(SPACES[1]!.rent![3]);
    g.mortgaged[3] = true;
    expect(rentFor(g, 3, 7)).toBe(0);
    g.owner[5] = 1;
    g.owner[14] = 1;
    expect(rentFor(g, 5, 7)).toBe(50);
    expect(rentFor(g, 5, 7, true)).toBe(100);
    g.owner[WORKS[0]!] = 1;
    expect(rentFor(g, WORKS[0]!, 8)).toBe(32);
    g.owner[WORKS[1]!] = 1;
    expect(rentFor(g, WORKS[0]!, 8)).toBe(80);
    // Landing pays the owner.
    const l = newBaron(2, 9);
    l.owner[6] = 1;
    l.owner[8] = 1;
    const t = act(
      withRoll(l, (a, b) => a + b === 6 && a !== b),
      { t: 'roll' },
    );
    expect(t.cash[0]).toBe(START_CASH - 16);
    expect(t.cash[1]).toBe(START_CASH + 16);
  });
});

describe('building and mortgages', () => {
  it('houses need the whole district, go up evenly, a hotel after four; selling is even too', () => {
    const g = newBaron(2, 10);
    g.phase = { k: 'main' };
    const [a, b, c] = GROUP_LOTS[2]!;
    g.owner[a!] = 0;
    g.owner[b!] = 0;
    expect(canBuild(g, 0, a!)).toBe(false);
    g.owner[c!] = 0;
    let n = act(g, { t: 'build', at: a! });
    expect(n.cash[0]).toBe(START_CASH - 100);
    expect(isLegal(n, { t: 'build', at: a! })).toBe(false); // even building
    n = act(act(n, { t: 'build', at: b! }), { t: 'build', at: c! });
    for (let k = 0; k < 3; k++) for (const s of [a!, b!, c!]) n = act(n, { t: 'build', at: s });
    expect([a, b, c].map((s) => n.houses[s!])).toEqual([4, 4, 4]);
    expect(housesLeft(n)).toBe(HOUSES - 12);
    n = act(n, { t: 'build', at: a! });
    expect(n.houses[a!]).toBe(5);
    expect(housesLeft(n)).toBe(HOUSES - 8);
    expect(isLegal(n, { t: 'sell', at: b! })).toBe(false);
    n = act(n, { t: 'sell', at: a! });
    expect(n.houses[a!]).toBe(4);
    expect(canMortgage(n, 0, a!)).toBe(false);
  });

  it('mortgage for half, redeem for half plus 10 %; no building on a mortgaged district', () => {
    const g = newBaron(2, 11);
    g.phase = { k: 'main' };
    GROUP_LOTS[0]!.forEach((s) => (g.owner[s] = 0));
    let n = act(g, { t: 'mortgage', at: 1 });
    expect(n.cash[0]).toBe(START_CASH + 30);
    expect(canBuild(n, 0, 3)).toBe(false);
    expect(rentFor(n, 1, 7)).toBe(0);
    n = act(n, { t: 'redeem', at: 1 });
    expect(n.cash[0]).toBe(START_CASH + 30 - redeemCost(1));
    expect(redeemCost(1)).toBe(33);
  });
});

describe('cards, debts and bankruptcy', () => {
  it('a card that pays every player is settled from each one', () => {
    const g = newBaron(3, 12);
    const idx = COUNCIL.findIndex((c) => c.id === 'c-festival');
    g.council = [idx, ...g.council.filter((i) => i !== idx)];
    g.pos[0] = 0;
    const n = act(
      withRoll(g, (a, b) => a + b === 2),
      { t: 'roll' },
    ); // Council
    expect(n.log.some((e) => e.k === 'card' && e.id === 'c-festival')).toBe(true);
    expect(n.cash).toEqual([START_CASH + 20, START_CASH - 10, START_CASH - 10]);
    expect(isValidBaron(n)).toBe(true);
  });

  it('a debt beyond cash: raise money by mortgaging, or go bankrupt to the creditor', () => {
    const g = newBaron(2, 13);
    g.owner[13] = 1;
    g.owner[10] = 1;
    g.owner[12] = 1;
    g.houses[10] = 5;
    g.houses[12] = 5;
    g.houses[13] = 5;
    g.cash[0] = 100;
    g.owner[1] = 0;
    g.owner[35] = 0;
    g.pos[0] = 13 - 6;
    let n = act(
      withRoll(g, (a, b) => a + b === 6 && a !== b),
      { t: 'roll' },
    );
    const rent = SPACES[13]!.rent![5]!;
    expect(rent).toBeGreaterThan(100 + liquidation(g, 0));
    // Cannot pay even by selling everything: bankrupt, everything to the creditor.
    expect(n.out[0]).toBe(true);
    expect(n.owner[1]).toBe(1);
    expect(n.owner[35]).toBe(1);
    expect(n.phase.k).toBe('over');
    expect(n.winner).toBe(1);
    // With enough property to cover it, the debtor must raise money first.
    const h = structuredClone(g);
    h.houses[10] = 0;
    h.houses[12] = 0;
    h.houses[13] = 1;
    h.cash[0] = 10;
    n = act(
      withRoll(h, (a, b) => a + b === 6 && a !== b),
      { t: 'roll' },
    );
    expect(n.phase).toEqual({ k: 'debt' });
    expect(currentPlayer(n)).toBe(0);
    expect(legalActions(n).every((a) => a.t === 'mortgage' || a.t === 'sell')).toBe(true);
    while (n.phase.k === 'debt') n = act(n, legalActions(n)[0]!);
    expect(n.out[0]).toBe(false);
    expect(n.phase.k).toBe('main');
  });
});

describe('trades and the end', () => {
  it('offers swap property and cash once accepted; districts with buildings cannot be traded', () => {
    const g = newBaron(2, 14);
    g.phase = { k: 'main' };
    g.owner[1] = 0;
    g.owner[6] = 1;
    const offer: Action = { t: 'offer', to: 1, give: [1], get: [6], cash: 50 };
    expect(isLegal(g, offer)).toBe(true);
    expect(isLegal(g, { ...offer, give: [6] })).toBe(false);
    expect(isLegal(g, { ...offer, cash: 5000 })).toBe(false);
    let n = act(g, offer);
    expect(currentPlayer(n)).toBe(1);
    n = act(n, { t: 'answer', accept: true });
    expect(n.owner[1]).toBe(1);
    expect(n.owner[6]).toBe(0);
    expect(n.cash).toEqual([START_CASH - 50, START_CASH + 50]);
    const b = structuredClone(g);
    GROUP_LOTS[0]!.forEach((s) => (b.owner[s] = 0));
    b.houses[1] = 1;
    expect(isLegal(b, offer)).toBe(false);
  });

  it('a timed game ends with the richest player', () => {
    const g = newBaron(3, 15, 1);
    g.cash[2] = 3000;
    g.phase = { k: 'main' };
    g.turn = 2;
    const n = act(g, { t: 'end' });
    expect(n.phase.k).toBe('over');
    expect(n.winner).toBe(2);
    expect(env.getOutcome(n)!.reason).toBe('richest');
    expect(worth(n, 2)).toBe(3000);
  });

  it('random play keeps cash, cards and buildings consistent', () => {
    for (let seed = 1; seed <= 4; seed++) {
      let g = env.createInitialState({ players: 2 + (seed % 4), limit: 80 }, seed);
      const rng = new Rng(seed);
      for (let k = 0; k < 3000 && g.phase.k !== 'over'; k++) {
        g = env.applyAction(g, rng.pick(legalCodes(g)));
        if (k % 50 === 0) {
          expect(isValidBaron(JSON.parse(JSON.stringify(g)))).toBe(true);
          expect(g.cash.every((c) => c >= 0)).toBe(true);
          expect(housesLeft(g)).toBeGreaterThanOrEqual(0);
          g.out.forEach((o, p) => o && expect(OWNABLE.some((s) => g.owner[s] === p)).toBe(false));
        }
      }
    }
    void total;
  });
});

describe('AI', () => {
  it('codes round-trip for every legal move of the agents', () => {
    let g = env.createInitialState({ players: 3, limit: 40 }, 3);
    const rng = new Rng(4);
    for (let k = 0; k < 600 && g.phase.k !== 'over'; k++) {
      for (const c of legalCodes(g)) expect(isLegal(g, decode(g, c)!)).toBe(true);
      const a = decide(g, 'baron', rng);
      const c = encode(g, a);
      expect(legalCodes(g)).toContain(c);
      g = env.applyAction(g, c);
    }
    expect(CODE.size).toBe(13 + 36 * 7);
  });

  it('values: the lot completing a district is worth far more than its price', () => {
    const g = newBaron(2, 1);
    g.owner[10] = 0;
    g.owner[12] = 0;
    expect(value(g, 0, 13)).toBeGreaterThan(SPACES[13]!.price! * 1.5);
    expect(value(g, 1, 13)).toBeGreaterThan(SPACES[13]!.price!); // blocking
    expect(observe(g, 0)).not.toHaveProperty('rng');
    expect(observe(g, 0)).not.toHaveProperty('luck');
  });

  it('the baron beats speculators; speculators beat random players', () => {
    const play = (ids: string[], seed: number) => {
      const agents = ids.map((id) => AGENT_PRESETS.find((a) => a.id === id)!.create());
      let s = env.createInitialState({ players: ids.length, limit: 120 }, seed);
      const rng = new Rng(seed * 3);
      for (let k = 0; k < 60_000 && !env.isTerminal(s); k++) {
        const p = env.getCurrentPlayer(s);
        s = env.applyAction(s, agents[p]!.selectAction(env, s, p, { rng }));
      }
      return ids[s.winner!]!;
    };
    let wins = 0;
    for (let seed = 1; seed <= 45; seed++) {
      const ids = ['speculator', 'speculator'];
      ids.splice(seed % 3, 0, 'baron');
      if (play(ids, seed) === 'baron') wins++;
    }
    // One seat in three: even play would win 15 of 45.
    expect(wins).toBeGreaterThanOrEqual(24);
    for (let seed = 1; seed <= 5; seed++)
      expect(play(['random', 'speculator', 'random'], seed)).toBe('speculator');
  }, 90_000);
});

describeAdapterContract(env, {
  configs: [
    { players: 2, limit: 30 },
    { players: 4, limit: 20 },
  ],
  playouts: 2,
  maxSteps: 6000,
  allowTruncation: true,
  checkObservation: (s) => {
    expect(observe(s, 0).cash).toEqual(s.cash);
  },
});
