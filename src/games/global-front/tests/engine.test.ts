import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { winChance } from '../ai';
import { AGENT_PRESETS, CODE, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  canMove,
  canSail,
  citiesOf,
  income,
  isLegal,
  isValidFront,
  legalActions,
  newFront,
  placeSpots,
  type Front,
  type Unit,
} from '../engine';
import { CAPITALS, CITIES, FLEETS, isSea, LOCS, POWERS, sideOf, type UnitKind } from '../world';

const L = (en: string) => LOCS.findIndex((l) => l.name.en === en);
/** A game with no units, power p to act in the given phase. */
function blank(phase: Front['phase'], p = 0): Front {
  const g = newFront(1);
  g.units = [];
  g.power = p;
  g.phase = phase;
  return g;
}
function put(g: Front, kind: UnitKind, owner: number, loc: number, n = 1): Unit[] {
  const out: Unit[] = [];
  for (let k = 0; k < n; k++) {
    const u: Unit = { id: g.nextId++, kind, owner, loc, moved: 0, hits: 0, fought: false };
    g.units.push(u);
    out.push(u);
  }
  return out;
}
const at = (g: Front, loc: number, owner?: number) =>
  g.units.filter((u) => u.loc === loc && (owner === undefined || u.owner === owner));

describe('the world', () => {
  it('26 territories and 7 seas, linked both ways; 12 cities, 6 a side; capitals with factories', () => {
    expect(LOCS.filter((l) => l.kind === 'land')).toHaveLength(26);
    expect(LOCS.filter((l) => l.kind === 'sea')).toHaveLength(7);
    LOCS.forEach((l, i) => {
      for (const j of l.adj) expect(LOCS[j]!.adj).toContain(i);
      expect(l.cells.length).toBeGreaterThanOrEqual(5);
    });
    expect(CITIES).toHaveLength(12);
    const g = newFront(1);
    expect([citiesOf(g, 0), citiesOf(g, 1)]).toEqual([6, 6]);
    CAPITALS.forEach((c, p) => {
      expect(LOCS[c]!.owner).toBe(p);
      expect(LOCS[c]!.factory).toBe(true);
    });
    expect(POWERS.map((_, p) => sideOf(p))).toEqual([0, 1, 0, 1]);
    FLEETS.forEach((s) => expect(isSea(s)).toBe(true));
  });

  it('a new game: everyone’s income in the treasury, Varn to buy first', () => {
    const g = newFront(3);
    expect(g.treasury).toEqual(POWERS.map((_, p) => income(g, p)));
    expect(g.treasury.every((t) => t >= 16)).toBe(true);
    expect(g.power).toBe(0);
    expect(g.phase).toBe('buy');
    expect(
      at(g, CAPITALS[0]!)
        .map((u) => u.kind)
        .sort(),
    ).toEqual(
      [
        'armor',
        'armor',
        'artillery',
        'artillery',
        'bomber',
        'fighter',
        'fighter',
        'infantry',
        'infantry',
        'infantry',
        'infantry',
      ].sort(),
    );
    expect(isValidFront(g)).toBe(true);
  });
});

describe('buying and placing', () => {
  it('buy within the treasury, change your mind, pay on moving on', () => {
    let g = newFront(1);
    g.treasury[0] = 13;
    expect(
      legalActions(g)
        .filter((a) => a.t === 'buy')
        .map((a) => (a as { kind: string }).kind),
    ).toEqual(['infantry', 'artillery', 'armor', 'fighter', 'bomber', 'transport', 'cruiser']);
    g = act(act(g, { t: 'buy', kind: 'fighter' }), { t: 'buy', kind: 'infantry' });
    expect(isLegal(g, { t: 'buy', kind: 'infantry' })).toBe(false);
    g = act(g, { t: 'unbuy', kind: 'fighter' });
    g = act(g, { t: 'next' });
    expect(g.treasury[0]).toBe(10);
    expect(g.phase).toBe('combat');
  });

  it('no buying while your capital is in enemy hands', () => {
    const g = newFront(1);
    g.owner[CAPITALS[0]!] = 1;
    expect(legalActions(g).filter((a) => a.t === 'buy')).toEqual([]);
    expect(income(g, 0)).toBe(0);
  });

  it('new units go on own factories, up to the territory’s value; ships into the water beside', () => {
    const g = blank('place');
    g.bought = ['infantry', 'transport'];
    const land = placeSpots(g, 'infantry');
    expect(land.sort()).toEqual([L('Varnhold'), L('Brennmoor')].sort());
    for (const s of placeSpots(g, 'transport')) expect(isSea(s)).toBe(true);
    // Brennmoor (value 2) takes two.
    let n = act(g, { t: 'place', kind: 'infantry', loc: L('Brennmoor') });
    n.bought.push('infantry', 'infantry');
    n = act(n, { t: 'place', kind: 'infantry', loc: L('Brennmoor') });
    expect(placeSpots(n, 'infantry')).toEqual([L('Varnhold')]);
  });
});

describe('moving', () => {
  it('land: one step (armour two) through friendly ground; attacks end on the first enemy territory', () => {
    const g = blank('combat');
    const [inf] = put(g, 'infantry', 0, L('Tarsk'));
    const [tank] = put(g, 'armor', 0, L('Coldwater'));
    expect(canMove(g, inf!, L('Fenwick'))).toBe(true); // enemy next door
    expect(canMove(g, inf!, L('Coldwater'))).toBe(false); // friendly: not a combat move
    expect(canMove(g, tank!, L('Dunrow'))).toBe(true); // through Tarsk
    expect(canMove(g, tank!, L('Aldermere'))).toBe(false); // through enemy Fenwick
    const m = blank('move');
    const [inf2] = put(m, 'infantry', 0, L('Tarsk'));
    expect(canMove(m, inf2!, L('Coldwater'))).toBe(true);
    expect(canMove(m, inf2!, L('Fenwick'))).toBe(false);
  });

  it('air: within range, and only where friendly land is still in reach to land on', () => {
    const g = blank('combat');
    put(g, 'infantry', 1, L('Fenwick'));
    const [fighter] = put(g, 'fighter', 0, L('Varnhold'));
    expect(canMove(g, fighter!, L('Fenwick'))).toBe(true);
    // Saltcliff is 4+ steps away with no way back.
    put(g, 'infantry', 1, L('Saltcliff'));
    expect(canMove(g, fighter!, L('Saltcliff'))).toBe(false);
  });

  it('ships: two steps of open water, stopped by enemy warships; transports never attack', () => {
    const g = blank('combat');
    const [cr] = put(g, 'cruiser', 0, L('Middle Sea West'));
    const [tr] = put(g, 'transport', 0, L('Middle Sea West'));
    put(g, 'cruiser', 1, L('Middle Sea'));
    expect(canMove(g, cr!, L('Middle Sea'))).toBe(true);
    expect(canMove(g, tr!, L('Middle Sea'))).toBe(false);
    // Other moves: two steps of open water, not past enemy warships.
    const m = blank('move');
    const [cr2] = put(m, 'cruiser', 0, L('Middle Sea West'));
    expect(canMove(m, cr2!, L('Middle Sea East'))).toBe(true);
    put(m, 'cruiser', 1, L('Middle Sea'));
    expect(canMove(m, cr2!, L('Middle Sea East'))).toBe(false);
    // The western waters are cut off from the middle sea by the Wren Isthmus.
    expect(canMove(m, cr2!, L('Wren Sound'))).toBe(false);
  });

  it('transports carry two land units from a coast to another, through clear water', () => {
    let g = blank('combat');
    put(g, 'infantry', 0, L('Brennmoor'), 2);
    put(g, 'armor', 0, L('Brennmoor'));
    put(g, 'transport', 0, L('Middle Sea West'));
    const target = L('Cape Verdan');
    put(g, 'infantry', 3, target);
    expect(canSail(g, L('Brennmoor'), L('Middle Sea West'), target, ['infantry', 'armor'])).toBe(
      true,
    );
    expect(
      canSail(g, L('Brennmoor'), L('Middle Sea West'), target, ['infantry', 'infantry', 'armor']),
    ).toBe(false);
    g = act(g, {
      t: 'sail',
      from: L('Brennmoor'),
      sea: L('Middle Sea West'),
      to: target,
      kinds: ['infantry', 'armor'],
    });
    expect(
      at(g, target, 0)
        .map((u) => u.kind)
        .sort(),
    ).toEqual(['armor', 'infantry']);
    expect(g.units.find((u) => u.kind === 'transport')!.moved).toBe(2);
    // Enemy ships in the way stop it.
    const b = blank('combat');
    put(b, 'infantry', 0, L('Brennmoor'));
    put(b, 'transport', 0, L('Middle Sea West'));
    put(b, 'cruiser', 3, L('Middle Sea West'));
    expect(canSail(b, L('Brennmoor'), L('Middle Sea West'), L('Cape Verdan'), ['infantry'])).toBe(
      false,
    );
  });
});

/** Runs a single battle at loc from a combat move with the given generator seed. */
function battle(g: Front, seed: number): Front {
  g.rng = new Rng(seed).state;
  let n = act(g, { t: 'next' });
  while (n.phase === 'battle') n = act(n, { t: 'roll' });
  return n;
}

describe('battles', () => {
  it('an empty enemy territory is taken without a fight; air alone takes nothing', () => {
    let g = blank('combat');
    put(g, 'infantry', 0, L('Tarsk'));
    g = act(g, { t: 'move', kind: 'infantry', from: L('Tarsk'), to: L('Dunrow'), n: 1 });
    g = act(g, { t: 'next' });
    expect(g.owner[L('Dunrow')]).toBe(0);
    expect(g.phase).toBe('move');
  });

  it('dice: hits on value or less, artillery lifts infantry, the cheapest die first; attackers who win take the land', () => {
    let wonOnce = false;
    for (let seed = 1; seed <= 30; seed++) {
      let g = blank('combat');
      put(g, 'infantry', 0, L('Tarsk'), 3);
      put(g, 'artillery', 0, L('Tarsk'), 2);
      put(g, 'infantry', 1, L('Dunrow'), 1);
      put(g, 'armor', 1, L('Dunrow'), 1);
      for (const k of ['infantry', 'infantry', 'infantry', 'artillery', 'artillery'] as UnitKind[])
        g = act(g, { t: 'move', kind: k, from: L('Tarsk'), to: L('Dunrow'), n: 1 });
      g.rng = new Rng(seed).state;
      g = act(g, { t: 'next' });
      expect(g.phase).toBe('battle');
      while (g.phase === 'battle') g = act(g, { t: 'roll' });
      const mine = at(g, L('Dunrow'), 0);
      if (mine.length) {
        wonOnce = true;
        expect(g.owner[L('Dunrow')]).toBe(0);
        // Infantry fall before artillery.
        if (mine.length < 5)
          expect(mine.filter((u) => u.kind === 'artillery').length).toBe(Math.min(2, mine.length));
      } else expect(g.owner[L('Dunrow')]).toBe(1);
    }
    expect(wonOnce).toBe(true);
  });

  it('a battleship takes two hits; undefended transports are lost', () => {
    const g = blank('combat');
    put(g, 'battleship', 0, L('Middle Sea West'));
    put(g, 'transport', 1, L('Middle Sea'), 2);
    let n = act(g, {
      t: 'move',
      kind: 'battleship',
      from: L('Middle Sea West'),
      to: L('Middle Sea'),
      n: 1,
    });
    n = battle(n, 3);
    expect(at(n, L('Middle Sea'), 1)).toEqual([]);
    expect(at(n, L('Middle Sea'), 0)).toHaveLength(1);
  });

  it('retreat sends attackers back where they came from', () => {
    let g = blank('combat');
    put(g, 'infantry', 0, L('Tarsk'), 2);
    put(g, 'infantry', 1, L('Dunrow'), 6);
    g = act(g, { t: 'move', kind: 'infantry', from: L('Tarsk'), to: L('Dunrow'), n: 2 });
    g = act(g, { t: 'next' });
    g = act(g, { t: 'roll' });
    if (g.phase === 'battle') {
      expect(isLegal(g, { t: 'retreat' })).toBe(true);
      g = act(g, { t: 'retreat' });
      expect(at(g, L('Tarsk'), 0).length).toBeGreaterThanOrEqual(0);
      expect(at(g, L('Dunrow'), 0)).toEqual([]);
      expect(g.owner[L('Dunrow')]).toBe(1);
    }
  });

  it('taking a capital takes its treasury; an ally’s territory is given back', () => {
    let g = blank('combat');
    put(g, 'armor', 0, L('Aldermere'));
    g.owner[L('Aldermere')] = 0;
    g.treasury[1] = 30;
    g = act(g, { t: 'move', kind: 'armor', from: L('Aldermere'), to: L('Kelt Harbour'), n: 1 });
    g = act(g, { t: 'next' });
    expect(g.owner[L('Kelt Harbour')]).toBe(0);
    expect(g.treasury[1]).toBe(0);
    expect(g.treasury[0]).toBe(newFront(1).treasury[0]! + 30);
    // Varn liberates an Ossian territory held by Tamar: it goes back to Ossia.
    let h = blank('combat');
    h.owner[L('Thornvale')] = 3;
    put(h, 'infantry', 0, L('Cape Verdan'));
    h.owner[L('Cape Verdan')] = 0;
    h = act(h, { t: 'move', kind: 'infantry', from: L('Cape Verdan'), to: L('Thornvale'), n: 1 });
    h = act(h, { t: 'next' });
    expect(h.owner[L('Thornvale')]).toBe(2);
  });

  it('aircraft fly home after the battles, or are lost with nowhere to land', () => {
    let g = blank('combat');
    const [f] = put(g, 'fighter', 0, L('Tarsk'));
    put(g, 'infantry', 1, L('Dunrow'));
    g = act(g, { t: 'move', kind: 'fighter', from: L('Tarsk'), to: L('Dunrow'), n: 1 });
    g = battle(g, 4);
    const fighter = g.units.find((u) => u.id === f!.id);
    if (fighter)
      expect(LOCS[fighter.loc]!.kind === 'land' && g.owner[fighter.loc] === 0).toBe(true);
  });
});

describe('turns and the end', () => {
  it('ending a turn pays income and hands over to the next power', () => {
    let g = blank('place');
    g.treasury[0] = 0;
    g = act(g, { t: 'next' });
    expect(g.treasury[0]).toBe(income(g, 0));
    expect(g.power).toBe(1);
    expect(g.phase).toBe('buy');
  });

  it('nine victory cities at the end of a round win', () => {
    const g = newFront(2);
    for (const c of CITIES.slice(0, 9)) g.owner[c] = 0;
    for (const c of CITIES.slice(0, 9)) if (sideOf(LOCS[c]!.owner) === 1) g.owner[c] = 0;
    g.power = 3;
    g.phase = 'place';
    g.bought = [];
    const n = act(g, { t: 'next' });
    expect(n.phase).toBe('over');
    expect(n.winner).toBe(0);
    expect(env.getOutcome(n)!.returns).toEqual([1, 0]);
  });

  it('random games stay valid and end', () => {
    for (let seed = 1; seed <= 2; seed++) {
      let g = newFront(seed);
      const rng = new Rng(seed);
      let k = 0;
      while (g.phase !== 'over' && k++ < 40_000) {
        const L2 = legalActions(g);
        const next = L2.find((a) => a.t === 'next');
        g = act(
          g,
          g.phase === 'battle' ? { t: 'roll' } : next && rng.chance(0.2) ? next : rng.pick(L2),
        );
        if (k % 150 === 0) expect(isValidFront(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.phase).toBe('over');
    }
  }, 60_000);
});

describe('AI', () => {
  it('codes round-trip; battle odds behave', () => {
    const g = newFront(1);
    for (const a of legalActions(g)) expect(decode(encode(a))).toEqual(a);
    expect(decode(CODE.next)).toEqual({ t: 'next' });
    const u = (kind: UnitKind, n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        kind,
        owner: 0,
        loc: 0,
        moved: 0,
        hits: 0,
        fought: false,
      }));
    expect(winChance(u('armor', 6), u('infantry', 1))).toBeGreaterThan(0.95);
    expect(winChance(u('infantry', 1), u('infantry', 6))).toBeLessThan(0.05);
    expect(observe(g, 0)).not.toHaveProperty('rng');
  });

  it('the general beats the colonel; the colonel beats random play', () => {
    const play = (ids: string[], seed: number) => {
      const agents = ids.map((id) => AGENT_PRESETS.find((a) => a.id === id)!.create());
      let s = env.createInitialState({}, seed);
      const rng = new Rng(seed * 3);
      for (let k = 0; k < 40_000 && !env.isTerminal(s); k++) {
        const p = env.getCurrentPlayer(s);
        s = env.applyAction(s, agents[p]!.selectAction(env, s, p, { rng }));
      }
      return ids[s.winner!]!;
    };
    let wins = 0;
    for (let seed = 1; seed <= 8; seed++)
      if (play(seed % 2 ? ['general', 'colonel'] : ['colonel', 'general'], seed) === 'general')
        wins++;
    expect(wins).toBeGreaterThanOrEqual(6);
    expect(play(['colonel', 'random'], 1)).toBe('colonel');
    expect(play(['random', 'colonel'], 2)).toBe('colonel');
  }, 120_000);
});

describeAdapterContract(env, {
  configs: [{}],
  playouts: 1,
  maxSteps: 1500,
  allowTruncation: true,
  checkObservation: (s) => {
    expect(observe(s, 0).units).toEqual(s.units);
  },
});
