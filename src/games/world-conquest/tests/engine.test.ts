import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { decide, winChance } from '../ai';
import { AGENT_PRESETS, CODE, decode, DIR, encode, env, legalCodes, observe } from '../ai-adapter';
import {
  act,
  CARDS,
  cardKind,
  income,
  isLegal,
  isSet,
  isValidWar,
  legalActions,
  MAX_ROUNDS,
  N,
  newWar,
  owned,
  setsIn,
  setValue,
  START_ARMIES,
  type WarGame,
} from '../engine';
import { MAP } from '../map';

/** Plays the setup with the general's choices. */
function afterSetup(players: number, seed: number): WarGame {
  let g = newWar(players, seed);
  const rng = new Rng(seed);
  while (g.phase.k === 'setup') g = act(g, decide(g, 'general', rng));
  return g;
}
const total = (g: WarGame) => g.armies.reduce((a, x) => a + x, 0);

describe('map', () => {
  it('36 territories in six landmasses, each in one piece, linked both ways', () => {
    expect(MAP.territories).toHaveLength(36);
    expect(MAP.regions.map((r) => r.members.length)).toEqual([6, 7, 5, 6, 6, 6]);
    expect(MAP.regions.map((r) => r.bonus)).toEqual([3, 5, 3, 4, 3, 3]);
    MAP.territories.forEach((t, i) => {
      expect(t.cells.length).toBeGreaterThanOrEqual(4);
      for (const j of t.adj) expect(MAP.territories[j]!.adj).toContain(i);
      expect(t.adj).not.toContain(i);
      // The label cell belongs to the territory.
      expect(MAP.grid[t.label[1]]![t.label[0]]).toBe(i);
    });
    // The whole world is connected.
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length)
      for (const j of MAP.territories[queue.shift()!]!.adj)
        if (!seen.has(j)) {
          seen.add(j);
          queue.push(j);
        }
    expect(seen.size).toBe(36);
    expect(new Set(MAP.territories.map((t) => t.id)).size).toBe(36);
  });
});

describe('cards', () => {
  it('sets: three alike, one of each, or any two with a wild; values grow', () => {
    expect(CARDS).toBe(38);
    expect([0, 1, 2, 3, 36, 37].map(cardKind)).toEqual([0, 1, 2, 0, 3, 3]);
    expect(isSet([0, 3, 6])).toBe(true); // three shields
    expect(isSet([0, 1, 2])).toBe(true); // one of each
    expect(isSet([0, 3, 1])).toBe(false);
    expect(isSet([0, 3, 36])).toBe(true);
    expect(isSet([0, 0, 3])).toBe(false);
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(setValue)).toEqual([4, 6, 8, 10, 12, 15, 20, 25]);
    // Any five cards hold a set.
    const rng = new Rng(4);
    for (let i = 0; i < 300; i++) {
      const hand = rng.shuffle(Array.from({ length: CARDS }, (_, k) => k)).slice(0, 5);
      expect(setsIn(hand).length).toBeGreaterThan(0);
    }
  });
});

describe('setup', () => {
  it('a random deal, starting armies by player count, placed three at a time', () => {
    for (const n of [2, 3, 4, 5]) {
      const g = newWar(n, 10 + n);
      const counts = Array.from({ length: n }, (_, p) => owned(g, p).length);
      expect(counts.reduce((a, x) => a + x, 0)).toBe(36);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      g.pool.forEach((x, p) => expect(x + counts[p]!).toBe(START_ARMIES[n]));
    }
    let g = newWar(3, 5);
    const order: number[] = [];
    const rng = new Rng(1);
    while (g.phase.k === 'setup') {
      order.push(g.turn);
      g = act(g, decide(g, 'general', rng));
    }
    expect(order.slice(0, 9)).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2]);
    expect(total(g)).toBe(3 * 35);
    expect(g.pool).toEqual([0, 0, 0]);
    expect(g.phase).toEqual({ k: 'reinforce', left: income(g, 0), then: 'attack' });
    expect(isLegal(g, { t: 'place', at: owned(g, 1)[0]! })).toBe(false);
  });

  it('reinforcements: a third of the territories (at least 3) plus whole landmasses', () => {
    const g = afterSetup(3, 2);
    g.owner = g.owner.map(() => 1);
    expect(income(g, 1)).toBe(12 + 21);
    MAP.regions[2]!.members.forEach((t) => (g.owner[t] = 0));
    expect(income(g, 0)).toBe(3 + 3);
    g.owner[MAP.regions[2]!.members[0]!] = 1;
    expect(income(g, 0)).toBe(3);
  });
});

/** A state in seat 0's attack phase with the given armies and owners near a border. */
function battleSetup(att: number, def: number) {
  const g = afterSetup(2, 3);
  const [from, to] = DIR.find(([a, b]) => g.owner[a] === 0 && g.owner[b] === 1)!;
  g.turn = 0;
  g.phase = { k: 'attack' };
  g.armies[from] = att;
  g.armies[to] = def;
  return { g, from, to };
}

describe('battles', () => {
  it('dice: up to three against two, highest first, ties to the defender', () => {
    for (let k = 0; k < 200; k++) {
      const { g, from, to } = battleSetup(5, 3);
      g.rng = new Rng(k).state;
      expect(isLegal(g, { t: 'attack', from, to, dice: 4 })).toBe(false);
      const n = act(g, { t: 'attack', from, to, dice: 3 });
      const { a, d } = n.dice!;
      expect(a).toHaveLength(3);
      expect(d).toHaveLength(2);
      expect([...a].sort((x, y) => y - x)).toEqual(a);
      let lostA = 0;
      let lostD = 0;
      for (let i = 0; i < 2; i++)
        if (a[i]! > d[i]!) lostD++;
        else lostA++;
      expect(n.armies[from]).toBe(5 - lostA);
      expect(n.armies[to]).toBe(3 - lostD);
    }
    const { g, from, to } = battleSetup(2, 1);
    expect(
      legalActions(g).filter((x) => x.t === 'attack' && x.from === from && x.to === to),
    ).toHaveLength(1);
  });

  it('a conquest moves in at least the dice rolled and earns one card at the end of the turn', () => {
    let found: WarGame | null = null;
    let at = { from: 0, to: 0 };
    for (let k = 0; k < 200 && !found; k++) {
      const { g, from, to } = battleSetup(6, 1);
      g.rng = new Rng(k).state;
      const n = act(g, { t: 'attack', from, to, dice: 3 });
      if (n.phase.k === 'advance') {
        found = n;
        at = { from, to };
      }
    }
    const g = found!;
    expect(g.phase).toEqual({ k: 'advance', from: at.from, to: at.to, min: 3, max: 5 });
    expect(g.owner[at.to]).toBe(0);
    expect(isLegal(g, { t: 'advance', n: 2 })).toBe(false);
    let n = act(g, { t: 'advance', n: 5 });
    expect(n.armies[at.from]).toBe(1);
    expect(n.armies[at.to]).toBe(5);
    const hand = n.hands[0]!.length;
    n = act(act(n, { t: 'endAttack' }), { t: 'end' });
    expect(n.hands[0]!.length).toBe(hand + 1);
    expect(n.turn).toBe(1);
    // Seat 1 conquers nothing: no card.
    let m = n;
    while (m.phase.k === 'reinforce')
      m = act(
        m,
        legalActions(m).find((x) => x.t === 'place')!,
      );
    const cards = m.hands[1]!.length;
    m = act(act(m, { t: 'endAttack' }), { t: 'end' });
    expect(m.hands[1]!.length).toBe(cards);
  });

  it('exact odds: one against one is 15/36; big stacks almost always win', () => {
    expect(winChance(1, 1)).toBeCloseTo(15 / 36, 10);
    expect(winChance(10, 2)).toBeGreaterThan(0.99);
    expect(winChance(2, 10)).toBeLessThan(0.01);
    expect(winChance(5, 5)).toBeGreaterThan(0.45);
    // A simulated check of 3 against 2 conquests with the engine's own dice.
    let wins = 0;
    for (let k = 0; k < 3000; k++) {
      const b = battleSetup(4, 2);
      let g = b.g;
      g.rng = new Rng(50_000 + k).state;
      while (g.phase.k === 'attack' && g.armies[b.from]! > 1 && g.owner[b.to] !== 0)
        g = act(g, {
          t: 'attack',
          from: b.from,
          to: b.to,
          dice: Math.min(3, g.armies[b.from]! - 1),
        });
      if (g.owner[b.to] === 0) wins++;
    }
    expect(Math.abs(wins / 3000 - winChance(3, 2))).toBeLessThan(0.03);
  });
});

describe('cards in play', () => {
  it('trading: five cards force a set; a shown territory adds two armies there', () => {
    const g = afterSetup(2, 7);
    const t = owned(g, 0).find((x) => x % 3 === 0)!;
    const others = [3, 6, 9, 12].filter((c) => c !== t).slice(0, 2);
    g.hands[0] = [t, ...others, 1, 2];
    g.deck = g.deck.filter((c) => !g.hands[0]!.includes(c));
    const left = (g.phase as { left: number }).left;
    expect(legalActions(g).every((a) => a.t === 'trade')).toBe(true);
    const before = g.armies[t]!;
    const n = act(g, { t: 'trade', cards: [t, ...others] });
    expect(n.armies[t]).toBe(before + 2);
    expect(n.phase).toEqual({ k: 'reinforce', left: left + 4, then: 'attack' });
    expect(n.trades).toBe(1);
    expect(n.discard).toEqual([t, ...others]);
    expect(isValidWar(JSON.parse(JSON.stringify(n)))).toBe(true);
  });

  it('knocking a player out takes their cards and may force a trade at once', () => {
    const g = afterSetup(3, 9);
    // Seat 2 keeps one territory next to seat 0; seat 0 attacks it with a big stack.
    const [from, to] = DIR.find(([a, b]) => g.owner[a] === 0 && g.owner[b] === 2)!;
    g.owner = g.owner.map((o, i) => (o === 2 && i !== to ? 1 : o));
    g.turn = 0;
    g.phase = { k: 'attack' };
    g.armies[from] = 20;
    g.armies[to] = 1;
    g.hands[0] = [0, 1, 4];
    g.hands[2] = [7, 8, 36];
    g.deck = g.deck.filter((c) => ![0, 1, 4, 7, 8, 36].includes(c));
    let n = g;
    for (let k = 0; k < 50 && n.owner[to] !== 0; k++)
      n = act(n, { t: 'attack', from, to, dice: 3 });
    expect(n.alive[2]).toBe(false);
    expect(n.hands[0]).toHaveLength(6);
    expect(n.hands[2]).toHaveLength(0);
    n = act(n, { t: 'advance', n: (n.phase as { min: number }).min });
    expect(n.phase).toEqual({ k: 'reinforce', left: 0, then: 'attack' });
    expect(legalActions(n).every((a) => a.t === 'trade')).toBe(true);
    n = act(n, legalActions(n)[0]!);
    expect(n.hands[0]).toHaveLength(3);
    // The armies from the set are placed before attacking again.
    expect(n.phase.k).toBe('reinforce');
    expect(n.log.some((e) => e.k === 'out' && e.p === 2 && e.cards === 3)).toBe(true);
    // Turns skip the player who is out.
    n.phase = { k: 'fortify' };
    n = act(n, { t: 'end' });
    expect(n.turn).toBe(1);
    n.phase = { k: 'fortify' };
    n = act(n, { t: 'end' });
    expect(n.turn).toBe(0);
  });
});

describe('moves and the end', () => {
  it('fortify: one move between adjacent own territories, at least one army stays', () => {
    const g = afterSetup(2, 11);
    const [from, to] = DIR.find(([a, b]) => g.owner[a] === 0 && g.owner[b] === 0)!;
    g.turn = 0;
    g.phase = { k: 'fortify' };
    g.armies[from] = 6;
    expect(isLegal(g, { t: 'fortify', from, to, n: 6 })).toBe(false);
    const n = act(g, { t: 'fortify', from, to, n: 5 });
    expect(n.armies[from]).toBe(1);
    expect(n.armies[to]).toBe(g.armies[to]! + 5);
    expect(n.turn).toBe(1);
    const far = owned(g, 0).find((t) => !MAP.territories[from]!.adj.includes(t) && t !== from)!;
    expect(isLegal(g, { t: 'fortify', from, to: far, n: 1 })).toBe(false);
  });

  it('taking the last territory wins; the round limit ends endless games', () => {
    const g = afterSetup(2, 13);
    const [from, to] = DIR.find(([a, b]) => g.owner[a] === 0 && g.owner[b] === 1)!;
    g.owner = g.owner.map((_, i) => (i === to ? 1 : 0));
    g.turn = 0;
    g.phase = { k: 'attack' };
    g.armies[from] = 30;
    g.armies[to] = 1;
    let n = g;
    for (let k = 0; k < 50 && n.phase.k === 'attack'; k++)
      n = act(n, { t: 'attack', from, to, dice: 3 });
    expect(n.phase).toEqual({ k: 'over' });
    expect(n.winner).toBe(0);
    expect(env.getOutcome(n)).toMatchObject({ winners: [0], reason: 'conquest' });
    const late = afterSetup(2, 14);
    late.round = MAX_ROUNDS - 1;
    late.turn = 1;
    late.phase = { k: 'fortify' };
    const over = act(late, { t: 'end' });
    expect(over.phase.k).toBe('over');
    expect(env.getOutcome(over)!.reason).toBe('round-limit');
  });

  it('random play keeps armies, cards and owners consistent', () => {
    for (let seed = 1; seed <= 3; seed++) {
      let g = newWar(2 + seed, seed);
      const rng = new Rng(seed);
      for (let k = 0; k < 4000 && g.phase.k !== 'over'; k++) {
        g = env.applyAction(g, rng.pick(legalCodes(g)));
        if (k % 100 === 0) {
          expect(isValidWar(JSON.parse(JSON.stringify(g)))).toBe(true);
          expect(g.armies.every((a) => a >= 1 || g.phase.k === 'advance')).toBe(true);
          g.alive.forEach((al, p) => expect(al).toBe(g.owner.includes(p)));
        }
      }
    }
  });
});

describe('AI', () => {
  it('every action code decodes to a legal move when listed, and agents’ moves encode', () => {
    let g = afterSetup(3, 21);
    const rng = new Rng(2);
    for (let k = 0; k < 300 && g.phase.k !== 'over'; k++) {
      for (const c of legalCodes(g)) expect(isLegal(g, decode(g, c)!)).toBe(true);
      const a = decide(g, 'marshal', rng);
      const code = encode(g, a);
      expect(legalCodes(g)).toContain(code);
      g = env.applyAction(g, code);
    }
    expect(CODE.size).toBe(N + 120 + DIR.length * 8 + 7);
  });

  it('observations show only the seat’s own cards', () => {
    const g = afterSetup(3, 4);
    g.hands[1] = [5, 6];
    const o = observe(g, 0);
    expect(o.cards).toEqual([g.hands[0]!.length, 2, g.hands[2]!.length]);
    expect(JSON.stringify(o)).not.toContain('"hands"');
    expect(o).not.toHaveProperty('rng');
  });

  it('the marshal beats generals; the general beats random players', () => {
    const play = (ids: string[], seed: number) => {
      const agents = ids.map((id) => AGENT_PRESETS.find((a) => a.id === id)!.create());
      let s = env.createInitialState({ players: ids.length }, seed);
      const rng = new Rng(seed * 3);
      for (let k = 0; k < 60_000 && !env.isTerminal(s); k++) {
        const p = env.getCurrentPlayer(s);
        s = env.applyAction(s, agents[p]!.selectAction(env, s, p, { rng }));
      }
      return s.winner === null ? 'none' : ids[s.winner]!;
    };
    let wins = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const ids = ['general', 'general'];
      ids.splice(seed % 3, 0, 'marshal');
      if (play(ids, seed) === 'marshal') wins++;
    }
    // One seat in three: even play would win 20 of 60.
    expect(wins).toBeGreaterThanOrEqual(27);
    for (let seed = 1; seed <= 5; seed++)
      expect(play(['random', 'general', 'random'], seed)).toBe('general');
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 4 }],
  playouts: 2,
  maxSteps: 3000,
  allowTruncation: true,
  checkObservation: (s) => {
    expect(observe(s, 0).hand).toEqual(s.hands[0]);
  },
});
