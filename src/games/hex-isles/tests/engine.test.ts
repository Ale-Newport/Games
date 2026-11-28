import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { A, AGENT_PRESETS, decode, encode, env, legalCodes, observe } from '../ai-adapter';
import {
  act,
  BANK_EACH,
  COST,
  currentPlayer,
  GEO,
  HARBOUR_EDGES,
  isLegal,
  isValidIsles,
  legalActions,
  MAX_OFFERS,
  newIsles,
  pathOk,
  pips,
  points,
  rate,
  setupSeat,
  total,
  trailLength,
  YIELD,
  type Action,
  type Cards,
  type IsleGame,
} from '../engine';

/** Plays the setup with the settler's choices. */
function afterSetup(players: number, seed: number): IsleGame {
  let g = newIsles(players, seed);
  const rng = new Rng(seed);
  while (g.phase.k === 'setup') g = act(g, decide(g, 'settler', rng));
  return g;
}
/** A state in the main phase of seat `turn`, with the given hand, no other changes. */
function mainWith(g0: IsleGame, hand: Cards, turn = 0): IsleGame {
  const g = structuredClone(g0);
  // Return everyone's cards to the bank, then deal the hand.
  g.hands.forEach((h) => {
    h.hand.forEach((n, r) => (g.bank[r]! += n));
    h.hand = [0, 0, 0, 0, 0];
  });
  hand.forEach((n, r) => (g.bank[r]! -= n));
  g.hands[turn]!.hand = [...hand];
  g.turn = turn;
  g.phase = { k: 'main' };
  g.dice = [3, 4];
  g.played = false;
  g.offers = 0;
  return g;
}
const conserved = (g: IsleGame) =>
  [0, 1, 2, 3, 4].every(
    (r) => g.bank[r]! + g.hands.reduce((a, h) => a + h.hand[r]!, 0) === BANK_EACH,
  );

describe('island', () => {
  it('19 hexes, 54 corners, 72 edges, 30 on the coast, 9 harbours on separate corners', () => {
    expect(GEO.hexes).toHaveLength(19);
    expect(GEO.verts).toHaveLength(54);
    expect(GEO.edges).toHaveLength(72);
    expect(GEO.coast).toHaveLength(30);
    for (const h of GEO.hexes) expect(new Set(h.verts).size).toBe(6);
    for (const v of GEO.verts) {
      expect(v.hexes.length).toBeGreaterThanOrEqual(1);
      expect(v.hexes.length).toBeLessThanOrEqual(3);
      expect(v.verts.length).toBe(v.edges.length);
    }
    const corners = HARBOUR_EDGES.flatMap((e) => [GEO.edges[e]!.a, GEO.edges[e]!.b]);
    expect(new Set(corners).size).toBe(18);
    for (const e of HARBOUR_EDGES) expect(GEO.edges[e]!.hexes).toHaveLength(1);
  });

  it('random boards: the full terrain and number sets, red numbers and twins never side by side', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const g = newIsles(4, seed);
      const count = (t: string) => g.board.terrain.filter((x) => x === t).length;
      expect([count('grove'), count('reef'), count('saltpan'), count('lagoon')]).toEqual([
        4, 3, 4, 4,
      ]);
      expect([count('cliffs'), count('dunes')]).toEqual([3, 1]);
      expect(g.storm).toBe(g.board.terrain.indexOf('dunes'));
      expect(g.board.numbers[g.storm]).toBeNull();
      expect(g.board.numbers.filter((n) => n !== null).sort((a, b) => a! - b!)).toEqual([
        2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
      ]);
      GEO.hexes.forEach((h, i) =>
        h.near.forEach((j) => {
          const a = g.board.numbers[i];
          const b = g.board.numbers[j];
          if (a == null || b == null) return;
          expect(pips(a) === 5 && pips(b) === 5).toBe(false);
          expect(a).not.toBe(b);
        }),
      );
      expect([...g.board.harbours].sort()).toEqual(
        ['any', 'any', 'any', 'any', 'coral', 'fish', 'iron', 'salt', 'wood'].sort(),
      );
      expect(g.deck).toHaveLength(25);
    }
    expect(newIsles(3, 9)).toEqual(newIsles(3, 9));
    expect(newIsles(3, 9).board).not.toEqual(newIsles(3, 10).board);
    expect(() => newIsles(2, 1)).toThrow();
  });
});

describe('setup', () => {
  it('snake order, distance rule, a path from the new hut, cards from the second hut', () => {
    let g = newIsles(3, 4);
    expect([0, 1, 2, 3, 4, 5].map((s) => setupSeat(3, s))).toEqual([0, 1, 2, 2, 1, 0]);
    const rng = new Rng(1);
    const seen: number[] = [];
    while (g.phase.k === 'setup') {
      const ph = g.phase;
      const p = currentPlayer(g);
      if (ph.hut === null) {
        seen.push(p);
        const spots = legalActions(g) as { t: 'hut'; v: number }[];
        // Never on or next to a building.
        for (const a of spots) {
          expect(g.sites[a.v]).toBeNull();
          for (const w of GEO.verts[a.v]!.verts) expect(g.sites[w]).toBeNull();
        }
        const a = decide(g, 'settler', rng) as { t: 'hut'; v: number };
        const before = total(g.hands[p]!.hand);
        g = act(g, a);
        const gained = total(g.hands[p]!.hand) - before;
        const producing = GEO.verts[a.v]!.hexes.filter(
          (h) => YIELD[g.board.terrain[h]!] >= 0,
        ).length;
        expect(gained).toBe(seen.length > 3 ? producing : 0);
      } else {
        for (const a of legalActions(g) as { t: 'path'; e: number }[]) {
          const { a: x, b: y } = GEO.edges[a.e]!;
          expect([x, y]).toContain(ph.hut);
        }
        g = act(g, decide(g, 'settler', rng));
      }
    }
    expect(seen).toEqual([0, 1, 2, 2, 1, 0]);
    expect(g.phase).toEqual({ k: 'roll' });
    expect(g.turn).toBe(0);
    expect(g.sites.filter(Boolean)).toHaveLength(6);
    expect(g.paths.filter((x) => x !== null)).toHaveLength(6);
    expect(conserved(g)).toBe(true);
  });
});

describe('dice and the storm', () => {
  it('a roll pays huts one and towns two from unblocked hexes', () => {
    const g0 = afterSetup(4, 11);
    const hx = GEO.hexes.findIndex(
      (_, i) => g0.board.numbers[i] !== null && i !== g0.storm && g0.board.numbers[i] !== 7,
    );
    const num = g0.board.numbers[hx]!;
    const g = structuredClone(g0);
    g.sites = g.sites.map(() => null);
    const [v1, v2] = [GEO.hexes[hx]!.verts[0]!, GEO.hexes[hx]!.verts[3]!];
    g.sites[v1] = { p: 1, town: false };
    g.sites[v2] = { p: 2, town: true };
    // Find a seed state whose next roll is the hex's number.
    let found: IsleGame | null = null;
    for (let k = 0; k < 400 && !found; k++) {
      const t = structuredClone(g);
      t.rng = new Rng(1000 + k).state;
      const n = act(t, { t: 'roll' });
      if (n.dice![0] + n.dice![1] === num) found = t;
    }
    const before = found!;
    const r = YIELD[before.board.terrain[hx]!];
    const after = act(before, { t: 'roll' });
    const gain = (p: number) => after.hands[p]!.hand[r]! - before.hands[p]!.hand[r]!;
    // Other hexes with the same number may pay too; count only what this layout allows.
    const expected = (p: number) =>
      GEO.hexes.reduce((a, h, i) => {
        if (before.board.numbers[i] !== num || i === before.storm) return a;
        if (YIELD[before.board.terrain[i]!] !== r) return a;
        return (
          a +
          h.verts.reduce((b, v) => {
            const s = before.sites[v];
            return b + (s?.p === p ? (s.town ? 2 : 1) : 0);
          }, 0)
        );
      }, 0);
    expect(gain(1)).toBe(expected(1));
    expect(gain(2)).toBe(expected(2));
    expect(gain(2)).toBeGreaterThanOrEqual(2);
    // With the storm on the hex, nobody gets its cards.
    const stormed = structuredClone(before);
    stormed.storm = hx;
    const blocked = act(stormed, { t: 'roll' });
    expect(blocked.hands[1]!.hand[r]! - before.hands[1]!.hand[r]!).toBe(expected(1) - 1);
    expect(conserved(after)).toBe(true);
  });

  it('the bank running short pays nobody, unless only one player takes that card', () => {
    const g0 = afterSetup(3, 21);
    const hx = GEO.hexes.findIndex((_, i) => g0.board.numbers[i] !== null && i !== g0.storm);
    const num = g0.board.numbers[hx]!;
    const r = YIELD[g0.board.terrain[hx]!];
    let base: IsleGame | null = null;
    for (let k = 0; k < 400 && !base; k++) {
      const t = structuredClone(g0);
      t.rng = new Rng(5000 + k).state;
      const n = act(t, { t: 'roll' });
      if (n.dice![0] + n.dice![1] === num) base = t;
    }
    const g = structuredClone(base!);
    g.sites = g.sites.map(() => null);
    g.storm = g.board.terrain.indexOf('dunes');
    // Only one other hex can share the number; clear buildings and use this hex alone.
    const [v1, v2] = [GEO.hexes[hx]!.verts[0]!, GEO.hexes[hx]!.verts[3]!];
    g.sites[v1] = { p: 0, town: true };
    g.sites[v2] = { p: 1, town: true };
    // Leave just one card of r in the bank (the rest to seat 2).
    g.hands[2]!.hand[r]! += g.bank[r]! - 1;
    g.bank[r] = 1;
    const both = act(g, { t: 'roll' });
    expect(both.hands[0]!.hand[r]).toBe(g.hands[0]!.hand[r]);
    expect(both.hands[1]!.hand[r]).toBe(g.hands[1]!.hand[r]);
    const alone = structuredClone(g);
    alone.sites[v2] = null;
    const one = act(alone, { t: 'roll' });
    expect(one.hands[0]!.hand[r]! - g.hands[0]!.hand[r]!).toBe(1);
    expect(one.bank[r]).toBe(0);
  });

  it('a seven: big hands discard half, the storm moves off its hex, the mover takes a card', () => {
    const g0 = afterSetup(4, 3);
    let base: IsleGame | null = null;
    for (let k = 0; k < 400 && !base; k++) {
      const t = structuredClone(g0);
      t.rng = new Rng(9000 + k).state;
      const n = act(t, { t: 'roll' });
      if (n.dice![0] + n.dice![1] === 7) base = t;
    }
    let g = mainWith(base!, [3, 3, 2, 1, 0], 0);
    g.phase = { k: 'roll' };
    g.rng = base!.rng;
    g.hands[2]!.hand = [2, 2, 2, 2, 1];
    g.bank = g.bank.map((b, r) => b - [2, 2, 2, 2, 1][r]!) as Cards;
    g = act(g, { t: 'roll' });
    expect(g.phase).toEqual({ k: 'discard', owed: [4, 0, 4, 0], start: [4, 0, 4, 0] });
    expect(currentPlayer(g)).toBe(0);
    // Too many, or cards not held, are refused; a bundle of 4 settles it at once.
    expect(isLegal(g, { t: 'discard', cards: [5, 0, 0, 0, 0] })).toBe(false);
    expect(isLegal(g, { t: 'discard', cards: [0, 0, 0, 0, 1] })).toBe(false);
    g = act(g, { t: 'discard', cards: [2, 1, 1, 0, 0] });
    expect(currentPlayer(g)).toBe(2);
    for (let i = 0; i < 4; i++) g = act(g, legalActions(g)[0]!);
    expect(total(g.hands[0]!.hand)).toBe(5);
    expect(total(g.hands[2]!.hand)).toBe(5);
    expect(g.phase.k).toBe('storm');
    expect(legalActions(g).some((a) => a.t === 'storm' && a.h === g.storm)).toBe(false);
    // Move it to a hex where seat 2 has a building: one card changes hands.
    const target = GEO.hexes.findIndex(
      (h, i) => i !== g.storm && h.verts.some((v) => g.sites[v]?.p === 2),
    );
    const others = new Set(
      GEO.hexes[target]!.verts.map((v) => g.sites[v]?.p).filter((p) => p !== undefined && p !== 0),
    );
    const before = total(g.hands[0]!.hand);
    g = act(g, { t: 'storm', h: target });
    if (g.phase.k === 'steal') {
      expect(new Set(g.phase.from)).toEqual(others);
      g = act(g, { t: 'steal', p: 2 });
    }
    expect(total(g.hands[0]!.hand)).toBe(before + 1);
    expect(g.phase).toEqual({ k: 'main' });
    expect(conserved(g)).toBe(true);
  });
});

describe('building', () => {
  it('paths join the network and an opponent’s building cuts it; huts keep their distance', () => {
    const g0 = afterSetup(4, 5);
    let g = mainWith(g0, [6, 6, 2, 2, 0]);
    const myPath = g.paths.findIndex((x) => x === 0);
    const { a, b } = GEO.edges[myPath]!;
    const end = g.sites[a]?.p === 0 ? b : a; // the far end of the setup path
    const onward = GEO.verts[end]!.edges.find((e) => e !== myPath && g.paths[e] === null)!;
    expect(pathOk(g, 0, onward)).toBe(true);
    // An opponent's hut on that corner blocks building through it.
    const blocked = structuredClone(g);
    blocked.sites[end] = { p: 1, town: false };
    expect(pathOk(blocked, 0, onward)).toBe(false);
    // A path far away is not connected.
    const far = GEO.edges.findIndex((_, e) => g.paths[e] === null && !pathOk(g, 0, e));
    expect(isLegal(g, { t: 'path', e: far })).toBe(false);
    g = act(g, { t: 'path', e: onward });
    expect(g.hands[0]!.hand).toEqual([5, 5, 2, 2, 0]);
    // A hut needs an own path and the distance rule.
    for (const x of legalActions(g).filter((y) => y.t === 'hut') as { t: 'hut'; v: number }[]) {
      expect(GEO.verts[x.v]!.edges.some((e) => g.paths[e] === 0)).toBe(true);
      expect(GEO.verts[x.v]!.verts.every((w) => g.sites[w] === null)).toBe(true);
    }
  });

  it('a town upgrades an own hut and pays two fish and three iron', () => {
    const g0 = afterSetup(3, 8);
    const g = mainWith(g0, [0, 0, 0, 2, 3], 1);
    const towns = legalActions(g).filter((a) => a.t === 'town') as { t: 'town'; v: number }[];
    expect(towns).toHaveLength(2);
    for (const t of towns) expect(g.sites[t.v]).toEqual({ p: 1, town: false });
    const n = act(g, towns[0]!);
    expect(n.sites[towns[0]!.v]).toEqual({ p: 1, town: true });
    expect(n.hands[1]!.hand).toEqual([0, 0, 0, 0, 0]);
    expect(points(n, 1)).toBe(3);
    expect(legalActions(mainWith(g0, [0, 0, 0, 1, 3], 1)).some((a) => a.t === 'town')).toBe(false);
  });

  it('the longest trail: held from five, kept on a tie, lost when a rival hut cuts it', () => {
    const base = mainWith(afterSetup(4, 2), [0, 0, 0, 0, 0]);
    base.sites = base.sites.map(() => null);
    base.paths = base.paths.map(() => null);
    const coast = GEO.coast;
    for (let k = 0; k < 6; k++) base.paths[coast[k]!] = 0;
    for (let k = 15; k < 20; k++) base.paths[coast[k]!] = 1;
    expect(trailLength(base, 0)).toBe(6);
    expect(trailLength(base, 1)).toBe(5);
    // A build refreshes the award: seat 0 extends to seven and takes it.
    const g = act(mainWith(base, COST.path, 0), { t: 'path', e: coast[6]! });
    expect(trailLength(g, 0)).toBe(7);
    expect(g.trail).toBe(0);
    expect(points(g, 0)).toBe(2);
    // Seat 1 draws level at seven: the holder keeps it.
    let h = mainWith(g, [2, 2, 0, 0, 0], 1);
    h = act(act(h, { t: 'path', e: coast[20]! }), { t: 'path', e: coast[21]! });
    expect(trailLength(h, 1)).toBe(7);
    expect(h.trail).toBe(0);
    // Seat 1 builds a hut on a corner in the middle of seat 0's run (reached by an inland path).
    const shared = (e1: number, e2: number) => {
      const x = GEO.edges[e1]!;
      const y = GEO.edges[e2]!;
      return [x.a, x.b].find((v) => v === y.a || v === y.b)!;
    };
    const mid = [2, 3]
      .map((k) => shared(coast[k]!, coast[k + 1]!))
      .find((v) => GEO.verts[v]!.edges.length === 3)!;
    const inland = GEO.verts[mid]!.edges.find((e) => GEO.edges[e]!.hexes.length === 2)!;
    h.paths[inland] = 1;
    const cut = act(mainWith(h, COST.hut, 1), { t: 'hut', v: mid });
    expect(trailLength(cut, 0)).toBeLessThan(7);
    expect(cut.trail).toBe(1);
    expect(points(cut, 1)).toBe(3);
  });
});

describe('charts', () => {
  it('a bought chart waits a turn; one chart a turn; relics count at once', () => {
    const g0 = afterSetup(4, 6);
    let g = mainWith(g0, [0, 0, 2, 2, 2]);
    g.deck = ['captain', 'relic', ...g.deck.slice(2)];
    g = act(g, { t: 'buy' });
    expect(g.hands[0]!.fresh).toEqual(['captain']);
    expect(legalActions(g).some((a) => a.t === 'captain')).toBe(false);
    g = act(g, { t: 'buy' });
    expect(points(g, 0)).toBe(3);
    expect(points(g, 0, false)).toBe(2);
    expect(observe(g, 1).table[0]!.points).toBe(2);
    expect(observe(g, 0).table[0]!.points).toBe(3);
    g = act(g, { t: 'end' });
    expect(g.hands[0]!.charts).toEqual(['captain', 'relic']);
    // Seat 0's next turn: a captain before rolling moves the storm, then the roll.
    g.turn = 0;
    g.phase = { k: 'roll' };
    expect(legalActions(g).some((a) => a.t === 'captain')).toBe(true);
    g = act(g, { t: 'captain' });
    expect(g.phase).toEqual({ k: 'storm', then: 'roll' });
    expect(g.played).toBe(true);
  });

  it('road works, bounty and embargo', () => {
    const g0 = afterSetup(4, 7);
    let g = mainWith(g0, [0, 0, 0, 0, 0]);
    g.hands[0]!.charts = ['roadworks', 'bounty', 'embargo'];
    g = act(g, { t: 'roadworks' });
    expect(g.phase).toEqual({ k: 'roadworks', left: 2 });
    for (let i = 0; i < 2; i++) g = act(g, legalActions(g)[0]!);
    expect(g.paths.filter((x) => x === 0)).toHaveLength(4);
    expect(g.phase).toEqual({ k: 'main' });
    expect(legalActions(g).some((a) => a.t === 'bounty')).toBe(false); // one chart per turn
    g.played = false;
    g = act(g, { t: 'bounty', r: 3, r2: 4 });
    expect(g.hands[0]!.hand).toEqual([0, 0, 0, 1, 1]);
    g.played = false;
    g.hands[1]!.hand = [0, 0, 0, 2, 0];
    g.hands[2]!.hand = [0, 0, 0, 1, 0];
    g.bank[3]! -= 3;
    g = act(g, { t: 'embargo', r: 3 });
    expect(g.hands[0]!.hand[3]).toBe(4);
    expect(g.hands[1]!.hand[3]).toBe(0);
    expect(conserved(g)).toBe(true);
  });

  it('three captains take the grand fleet; more captains take it over', () => {
    const g0 = afterSetup(4, 12);
    let g = mainWith(g0, [0, 0, 0, 0, 0]);
    g.hands[0]!.captains = 2;
    g.hands[0]!.charts = ['captain'];
    g = act(g, { t: 'captain' });
    expect(g.fleet).toBe(0);
    g = act(g, legalActions(g)[0]!);
    if (g.phase.k === 'steal') g = act(g, legalActions(g)[0]!);
    const h = mainWith(g, [0, 0, 0, 0, 0], 1);
    h.hands[1]!.captains = 3;
    h.hands[1]!.charts = ['captain'];
    const n = act(h, { t: 'captain' });
    expect(n.fleet).toBe(1);
  });
});

describe('trading and winning', () => {
  it('bank rates: 4, 3 with a general harbour, 2 with a matching one', () => {
    const g = mainWith(afterSetup(4, 9), [4, 0, 0, 0, 0]);
    g.sites = g.sites.map(() => null);
    expect(rate(g, 0, 0)).toBe(4);
    const any = g.board.harbours.indexOf('any');
    g.sites[GEO.edges[HARBOUR_EDGES[any]!]!.a] = { p: 0, town: false };
    expect(rate(g, 0, 0)).toBe(3);
    const wood = g.board.harbours.indexOf('wood');
    g.sites[GEO.edges[HARBOUR_EDGES[wood]!]!.b] = { p: 0, town: false };
    expect(rate(g, 0, 0)).toBe(2);
    expect(rate(g, 0, 1)).toBe(3);
    const n = act(g, { t: 'bank', give: 0, get: 4 });
    expect(n.hands[0]!.hand).toEqual([2, 0, 0, 0, 1]);
  });

  it('offers: the other player answers; a refusal changes nothing; at most three a turn', () => {
    const g0 = afterSetup(4, 10);
    const g = mainWith(g0, [2, 0, 0, 0, 0]);
    g.hands[1]!.hand = [0, 0, 1, 0, 0];
    g.bank[2]! -= 1;
    const offer: Action = { t: 'offer', to: 1, give: [1, 0, 0, 0, 0], get: [0, 0, 1, 0, 0] };
    expect(isLegal(g, { ...offer, give: [3, 0, 0, 0, 0] })).toBe(false);
    expect(isLegal(g, { ...offer, to: 0 })).toBe(false);
    expect(isLegal(g, { ...offer, get: [1, 0, 0, 0, 0] })).toBe(false);
    let n = act(g, offer);
    expect(currentPlayer(n)).toBe(1);
    const yes = act(n, { t: 'answer', accept: true });
    expect(yes.hands[0]!.hand).toEqual([1, 0, 1, 0, 0]);
    expect(yes.hands[1]!.hand).toEqual([1, 0, 0, 0, 0]);
    const no = act(n, { t: 'answer', accept: false });
    expect(no.hands[0]!.hand).toEqual([2, 0, 0, 0, 0]);
    // A player who lacks the cards asked for can only refuse.
    const poor = structuredClone(n);
    poor.hands[1]!.hand = [0, 0, 0, 0, 0];
    poor.bank[2]! += 1;
    expect(legalActions(poor)).toEqual([{ t: 'answer', accept: false }]);
    n = no;
    for (let i = 1; i < MAX_OFFERS; i++) n = act(act(n, offer), { t: 'answer', accept: false });
    expect(isLegal(n, offer)).toBe(false);
  });

  it('ten points on your own turn win at once', () => {
    const g = mainWith(afterSetup(4, 13), [1, 1, 1, 1, 0]);
    // Give seat 0 four towns and one hut: 9 points; one more hut wins.
    g.sites = g.sites.map(() => null);
    g.paths = g.paths.map(() => null);
    const spots: number[] = [];
    for (let v = 0; v < 54 && spots.length < 6; v++)
      if (spots.every((w) => w !== v && !GEO.verts[v]!.verts.includes(w))) spots.push(v);
    spots.slice(0, 4).forEach((v) => (g.sites[v] = { p: 0, town: true }));
    g.sites[spots[4]!] = { p: 0, town: false };
    g.paths[GEO.verts[spots[5]!]!.edges[0]!] = 0;
    expect(points(g, 0)).toBe(9);
    const n = act(g, { t: 'hut', v: spots[5]! });
    expect(n.phase).toEqual({ k: 'over' });
    expect(n.winner).toBe(0);
    expect(env.getOutcome(n)!.returns).toEqual([1, 0, 0, 0]);
  });

  it('random games keep every card and piece accounted for and end', () => {
    for (let seed = 1; seed <= 4; seed++) {
      let g = newIsles(seed % 2 ? 3 : 4, seed);
      const rng = new Rng(seed);
      let steps = 0;
      while (g.phase.k !== 'over' && steps++ < 30_000) {
        const codes = legalCodes(g);
        g = env.applyAction(g, rng.pick(codes));
        if (steps % 50 === 0) {
          expect(conserved(g)).toBe(true);
          expect(isValidIsles(JSON.parse(JSON.stringify(g)))).toBe(true);
          g.hands.forEach((_, p) => {
            expect(g.paths.filter((x) => x === p).length).toBeLessThanOrEqual(15);
            expect(g.sites.filter((s) => s?.p === p && !s.town).length).toBeLessThanOrEqual(5);
            expect(g.sites.filter((s) => s?.p === p && s.town).length).toBeLessThanOrEqual(4);
          });
        }
      }
      expect(g.phase.k).toBe('over');
    }
  });
});

describe('AI', () => {
  it('every action code round-trips', () => {
    for (let n = 0; n < A.size; n++) expect(encode(decode(n)!)).toBe(n);
    expect(decode(A.size)).toBeNull();
  });

  it('observations show only the seat’s own cards and charts', () => {
    const g = afterSetup(4, 14);
    g.hands[2]!.charts = ['relic'];
    const o = observe(g, 1);
    expect(o.hand).toEqual(g.hands[1]!.hand);
    expect(JSON.stringify(o)).not.toContain('relic');
    expect(o.table[2]!.charts).toBe(1);
    expect(o).not.toHaveProperty('rng');
    expect(o.deck).toBe(g.deck.length);
  });

  it('the strategist outplays three settlers; the settler beats random players', () => {
    const play = (ids: string[], seed: number) => {
      const agents = ids.map((id) => AGENT_PRESETS.find((a) => a.id === id)!.create());
      let s = env.createInitialState({ players: ids.length }, seed);
      const rng = new Rng(seed * 7);
      let k = 0;
      while (!env.isTerminal(s) && k++ < 60_000) {
        const p = env.getCurrentPlayer(s);
        s = env.applyAction(s, agents[p]!.selectAction(env, s, p, { rng }));
      }
      return ids[s.winner!]!;
    };
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const ids = ['settler', 'settler', 'settler'];
      ids.splice(seed % 4, 0, 'strategist');
      if (play(ids, seed) === 'strategist') wins++;
    }
    // One seat in four: even play would win 10 of 40.
    expect(wins).toBeGreaterThanOrEqual(16);
    for (let seed = 1; seed <= 6; seed++)
      expect(play(['random', 'settler', 'random'], seed)).toBe('settler');
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ players: 3 }, { players: 4 }],
  playouts: 2,
  maxSteps: 40_000,
  checkObservation: (s) => {
    expect(observe(s, 0).hand).toEqual(s.hands[0]!.hand);
  },
});

// Keep the unused cost table honest: a chart costs one salt, fish and iron.
it('costs', () => expect(COST.chart).toEqual([0, 0, 1, 1, 1]));
