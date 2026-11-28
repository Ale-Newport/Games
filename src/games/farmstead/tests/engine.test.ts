import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, CODE, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  bakeFood,
  cookRates,
  currentPlayer,
  feed,
  fits,
  isLegal,
  isValidFarm,
  legalActions,
  newFarm,
  pastureCost,
  ploughSpots,
  roomSpots,
  scoreFarm,
  type Action,
  type Farm,
} from '../engine';
import {
  CELLS,
  HARVESTS,
  IMPROVEMENTS,
  ROUNDS,
  SCORING,
  SPACES,
  START_ROOMS,
  impIndex,
  points,
  spaceIndex,
  type SpaceId,
} from '../world';

const S = (id: SpaceId) => spaceIndex(id);
const play = (g: Farm, ...as: Action[]) => as.reduce((s, a) => act(s, a), g);
/** A two-player game in round 1 with every round space already open. */
function open(players = 2): Farm {
  const g = newFarm(players, 3);
  for (const i of g.future) g.open.push(i);
  g.future = [];
  return g;
}

describe('set-up', () => {
  it('rooms, family, food, permanent spaces by player count, stages in order', () => {
    for (const n of [2, 3, 4]) {
      const g = newFarm(n, n);
      expect(g.round).toBe(1);
      expect(g.ps.every((f) => f.members === 2 && f.workers === 2)).toBe(true);
      expect(g.ps.map((f) => f.goods.food)).toEqual([2, ...Array(n - 1).fill(3)]);
      expect(g.ps[0]!.cells.filter((c) => c.kind === 'room').length).toBe(2);
      START_ROOMS.forEach((c) => expect(g.ps[0]!.cells[c]!.kind).toBe('room'));
      expect(g.open.includes(S('copse'))).toBe(n >= 3);
      expect(g.open.includes(S('traders'))).toBe(n >= 4);
      // The first round space is a stage-1 space; stages come in order.
      const stages = [g.open[g.open.length - 1]!, ...g.future].map((i) => SPACES[i]!.stage!);
      expect(stages).toEqual([...stages].sort((a, b) => a - b));
      expect(stages).toHaveLength(ROUNDS);
      expect(g.stock[S('forest')]).toEqual({ timber: 3 });
      expect(isValidFarm(g)).toBe(true);
    }
  });

  it('accumulating spaces fill up while nobody takes them', () => {
    let g = newFarm(2, 1);
    g = play(
      g,
      { t: 'place', space: S('labour') },
      { t: 'place', space: S('seeds') },
      { t: 'place', space: S('pond') },
    );
    expect(g.ps[1]!.goods.grain).toBe(1);
    g = act(g, { t: 'place', space: S('reedbank') });
    expect(g.round).toBe(2);
    expect(g.stock[S('forest')]).toEqual({ timber: 6 });
    expect(g.ps[0]!.goods.food).toBe(2 + 2 + 1);
  });
});

describe('the farm', () => {
  it('rooms beside rooms; fields beside fields; pastures cheaper beside pastures', () => {
    const g = open();
    const f = g.ps[0]!;
    expect(roomSpots(f).sort((a, b) => a - b)).toEqual([0, 6, 11]);
    expect(ploughSpots(f)).toHaveLength(CELLS - 2);
    f.cells[3]!.kind = 'field';
    expect(ploughSpots(f).sort((a, b) => a - b)).toEqual([2, 4, 8]);
    expect(pastureCost(f, 14)).toBe(4);
    f.cells[13]!.kind = 'pasture';
    expect(pastureCost(f, 14)).toBe(3);
    f.cells[9]!.kind = 'pasture';
    expect(pastureCost(f, 14)).toBe(2);
  });

  it('the builder builds rooms (5 timber, 2 reed) and stables (2 timber)', () => {
    let g = open();
    g.ps[0]!.goods.timber = 9;
    g.ps[0]!.goods.reed = 2;
    g = act(g, { t: 'place', space: S('builder') });
    expect(g.phase).toBe('sub');
    g = act(g, { t: 'room', cell: 0 });
    expect(g.ps[0]!.goods).toMatchObject({ timber: 4, reed: 0 });
    g = act(g, { t: 'stable', cell: 14 });
    expect(g.ps[0]!.cells[14]!.stable).toBe(true);
    // Room for one more stable: 2 timber left.
    g = act(g, { t: 'stable', cell: 4 });
    expect(g.phase).toBe('work');
    expect(g.turn).toBe(1);
  });

  it('family growth needs a free room; hurried growth does not', () => {
    const g = open();
    expect(legalActions(g).some((a) => a.t === 'place' && a.space === S('growth'))).toBe(false);
    expect(legalActions(g).some((a) => a.t === 'place' && a.space === S('hurried'))).toBe(true);
    g.ps[0]!.cells[0]!.kind = 'room';
    const n = act(g, { t: 'place', space: S('growth') });
    expect(n.ps[0]!.members).toBe(3);
    expect(n.ps[0]!.newborns).toBe(1);
    // The newborn works from next round.
    expect(n.ps[0]!.workers).toBe(1);
  });

  it('sowing grain (3) and vegetables (2), baking with a hearth or an oven', () => {
    let g = open();
    const f = g.ps[0]!;
    f.cells[0]!.kind = 'field';
    f.cells[1]!.kind = 'field';
    f.goods.grain = 3;
    f.goods.veg = 1;
    f.imps = [impIndex('hearth')];
    g = play(
      g,
      { t: 'place', space: S('sowbake') },
      { t: 'sow', cell: 0, crop: 'grain' },
      { t: 'sow', cell: 1, crop: 'veg' },
    );
    expect(g.ps[0]!.cells[0]).toMatchObject({ crop: 'grain', n: 3 });
    expect(g.ps[0]!.cells[1]).toMatchObject({ crop: 'veg', n: 2 });
    // No more empty fields: on to baking.
    expect(
      legalActions(g)
        .filter((a) => a.t === 'bake')
        .map((a) => (a as { n: number }).n),
    ).toEqual([1, 2]);
    g = act(g, { t: 'bake', n: 2 });
    expect(g.ps[0]!.goods.food).toBe(2 + 4);
    const o = open().ps[0]!;
    o.imps = [impIndex('oven')];
    expect(bakeFood(o, 2)).toBe(8);
    expect(bakeFood(o, 3)).toBe(-1);
    o.imps.push(impIndex('range'));
    expect(bakeFood(o, 3)).toBe(11);
  });

  it('fencing pastures; animals need room: pastures hold 2 (4 with a stable), a pet in the house', () => {
    let g = open();
    const f = g.ps[0]!;
    f.goods.timber = 7;
    g = play(
      g,
      { t: 'place', space: S('fencing') },
      { t: 'pasture', cell: 14 },
      { t: 'pasture', cell: 13 },
    );
    expect(g.ps[0]!.goods.timber).toBe(0);
    const h = g.ps[0]!;
    expect(fits(h, { sheep: 5, pig: 0, cow: 0 })).toBe(true);
    expect(fits(h, { sheep: 6, pig: 0, cow: 0 })).toBe(false);
    expect(fits(h, { sheep: 2, pig: 2, cow: 1 })).toBe(true);
    h.cells[14]!.stable = true;
    expect(fits(h, { sheep: 7, pig: 0, cow: 0 })).toBe(true);
  });

  it('animals with nowhere to go are cooked with a hearth, else they run off', () => {
    let g = open();
    g.stock[S('sheepfair')] = { sheep: 3 };
    g = act(g, { t: 'place', space: S('sheepfair') });
    expect(g.ps[0]!.animals.sheep).toBe(1);
    expect(g.log.find((e) => e.k === 'cooked')).toMatchObject({ food: 0, lost: 2 });
    let h = open();
    h.ps[0]!.imps = [impIndex('hearth')];
    h.stock[S('sheepfair')] = { sheep: 3 };
    h = act(h, { t: 'place', space: S('sheepfair') });
    expect(h.ps[0]!.goods.food).toBe(2 + 4);
    expect(cookRates(h.ps[0]!)!.cow).toBe(3);
  });

  it('renovation: clay for every room and a reed, then an improvement', () => {
    let g = open();
    g.ps[0]!.goods.clay = 4;
    g.ps[0]!.goods.reed = 1;
    g = act(g, { t: 'place', space: S('renovation') });
    expect(g.ps[0]!.material).toBe('clay');
    expect(g.ps[0]!.goods.clay).toBe(2);
    expect(g.phase).toBe('sub');
    g = act(g, { t: 'improve', imp: impIndex('hearth') });
    expect(g.impOwner[impIndex('hearth')]).toBe(0);
    expect(isLegal(g, { t: 'place', space: S('renovation') })).toBe(false);
  });
});

describe('harvest and scoring', () => {
  it('fields yield, the family eats (2 each, 1 for a newborn), what is missing is begging', () => {
    const f = open().ps[0]!;
    f.goods.food = 1;
    f.goods.grain = 2;
    // Raw grain is 1 food: 1 + 2 = 3, one short of 4.
    expect(feed(f)).toBe(1);
    expect(f.begging).toBe(1);
    expect(f.goods.grain).toBe(0);
    const h = open().ps[0]!;
    h.goods.food = 1;
    expect(feed(h)).toBe(3);
    expect(h.begging).toBe(3);
    const n = open().ps[0]!;
    n.members = 3;
    n.newborns = 1;
    n.goods.food = 5;
    expect(feed(n)).toBe(0);
    expect(n.goods.food).toBe(0);
  });

  it('a harvest round: crops come in, animals breed if there is room', () => {
    let g = newFarm(2, 5);
    for (const f of g.ps) {
      f.goods.food = 10;
      f.cells[0]!.kind = 'field';
      f.cells[0]!.crop = 'grain';
      f.cells[0]!.n = 3;
      f.cells[14]!.kind = 'pasture';
      f.cells[13]!.kind = 'pasture';
      f.animals.sheep = 2;
    }
    g.round = HARVESTS[0]!;
    // Play the round out with day labour and the like.
    while (g.round === HARVESTS[0])
      g = act(
        g,
        legalActions(g).find((a) => a.t === 'place' || a.t === 'done')!,
      );
    expect(g.ps[0]!.cells[0]!.n).toBe(2);
    expect(g.ps[0]!.animals.sheep).toBe(3);
    expect(g.log.some((e) => e.k === 'harvest')).toBe(true);
  });

  it('the scoring table and a whole farm', () => {
    expect(points(SCORING.fields, 0)).toBe(-1);
    expect(points(SCORING.fields, 1)).toBe(-1);
    expect(points(SCORING.fields, 5)).toBe(4);
    expect(points(SCORING.grain, 5)).toBe(2);
    const f = open().ps[0]!;
    const s = scoreFarm(f);
    expect(s.empty).toBe(-13);
    expect(s.family).toBe(6);
    expect(s.total).toBe(-13 + 6 - 7);
    f.material = 'stone';
    f.imps = [impIndex('bench')];
    f.goods.timber = 4;
    const t = scoreFarm(f);
    expect(t.rooms).toBe(4);
    expect(t.improvements).toBe(IMPROVEMENTS[impIndex('bench')]!.vp + 2);
  });

  it('random games end and stay valid', () => {
    for (let seed = 1; seed <= 8; seed++) {
      let g = newFarm(2 + (seed % 3), seed);
      const rng = new Rng(seed);
      let k = 0;
      while (g.phase !== 'over' && k++ < 20_000) {
        g = act(g, rng.pick(legalActions(g)));
        if (k % 20 === 0) expect(isValidFarm(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.phase).toBe('over');
      expect(g.round).toBe(ROUNDS);
      expect(g.scores).toHaveLength(g.players);
      expect(currentPlayer(g)).toBe(-1);
    }
  });
});

describe('AI', () => {
  it('codes round-trip; observations hide the order of the rounds to come', () => {
    for (let n = 0; n < CODE.size; n++) expect(encode(decode(n)!)).toBe(n);
    const o = observe(newFarm(3, 2), 1);
    expect(o).not.toHaveProperty('rng');
    expect(o).not.toHaveProperty('future');
    expect(o.roundsToCome).toBe(ROUNDS - 1);
  });

  it('the steward beats farmhands; farmhands beat random play', () => {
    const run = (ids: string[], seed: number) => {
      const agents = ids.map((id) => AGENT_PRESETS.find((a) => a.id === id)!.create());
      let s = env.createInitialState({ players: ids.length }, seed);
      const rng = new Rng(seed * 7);
      while (!env.isTerminal(s)) {
        const p = env.getCurrentPlayer(s);
        s = env.applyAction(s, agents[p]!.selectAction(env, s, p, { rng }));
      }
      return s.winners.map((w) => ids[w]!);
    };
    let wins = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const ids = seed % 2 ? ['steward', 'farmhand'] : ['farmhand', 'steward'];
      if (run(ids, seed).includes('steward')) wins++;
    }
    // Even play would win 3 of 6.
    expect(wins).toBeGreaterThanOrEqual(5);
    for (let seed = 1; seed <= 3; seed++)
      expect(run(['random', 'farmhand'], seed)).toContain('farmhand');
  }, 180_000);
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 4 }],
  playouts: 2,
  maxSteps: 20_000,
  checkObservation: (s) => {
    expect(observe(s, 0).ps).toEqual(s.ps);
  },
});
