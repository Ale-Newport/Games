import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, CODE, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  canPay,
  capacityOf,
  currentPlayer,
  distance,
  emptyFleet,
  homeOf,
  isLegal,
  isValidStar,
  kindAt,
  legalActions,
  meets,
  newStar,
  owned,
  planet,
  planetsIn,
  productionAt,
  spaceOdds,
  takeHits,
  tally,
  votesOf,
  type Action,
  type Star,
} from '../engine';
import {
  ADJ,
  AGENDAS,
  CARDS,
  CORNERS,
  FACTIONS,
  HOME_CORNERS,
  NEXUS,
  NEXUS_PLANET,
  OBJECTIVES,
  PLANETS,
  POOL,
  POS,
  TECH_IDS,
  agendaIndex,
  factionIndex,
  objectiveIndex,
  type CardId,
} from '../world';

const C = (id: CardId) => CARDS.indexOf(id);
const F = (id: Parameters<typeof factionIndex>[0]) => factionIndex(id);

/** Empties space and planets except the given player's home; puts the game in p's action turn. */
function quiet(g: Star, cards: CardId[][] = []) {
  g.space = g.space.map((row) => row.map(() => emptyFleet()));
  for (const pl of g.planets) {
    if (pl.owner >= 0 && pl.sys !== homeOf(g, pl.owner)) pl.owner = -1;
    if (pl.owner >= 0) pl.inf = 0;
  }
  g.ps.forEach((x, p) => {
    x.cards = (cards[p] ?? [CARDS[p]!]).map(C);
    x.played = [];
  });
  g.phase = 'action';
  g.queue = [];
  g.order = g.ps.map((_, p) => p);
  g.turn = 0;
  return g;
}
/** A planet system next to p's home. */
const nextTo = (g: Star, p: number) => ADJ[homeOf(g, p)]!.find((s) => kindAt(g, s) === 'planets')!;
const play = (g: Star, ...as: Action[]) => as.reduce((s, a) => act(s, a), g);

describe('the galaxy', () => {
  it('37 positions in rings, symmetric neighbours, six outer corners', () => {
    expect(POS).toHaveLength(37);
    expect(new Set(POS.map((x) => x.join())).size).toBe(37);
    ADJ.forEach((ns, i) => {
      for (const j of ns) expect(ADJ[j]).toContain(i);
    });
    expect(ADJ[NEXUS]).toHaveLength(6);
    expect(CORNERS).toHaveLength(6);
    CORNERS.forEach((c) => expect(ADJ[c]).toHaveLength(3));
    expect(POOL).toHaveLength(36);
    expect(POOL.filter((t) => t.kind === 'planets')).toHaveLength(24);
    expect(FACTIONS).toHaveLength(6);
    expect(new Set(PLANETS.map((p) => p.name)).size).toBe(PLANETS.length);
  });

  it('deals homes on corners with planets beside them, no anomaly next to a home, all connected', () => {
    for (const n of [2, 3, 4])
      for (let seed = 1; seed <= 10; seed++) {
        const g = newStar(n, seed);
        expect(g.tiles[NEXUS]).toBe('nexus');
        expect(new Set(g.tiles).size).toBe(37);
        for (let p = 0; p < n; p++) {
          const h = homeOf(g, p);
          expect(h).toBe(CORNERS[HOME_CORNERS[n]![p]!]);
          expect(kindAt(g, h)).toBe('home');
          expect(ADJ[h]!.filter((s) => kindAt(g, s) === 'planets').length).toBeGreaterThanOrEqual(
            2,
          );
          for (const s of ADJ[h]!) expect(['nebula', 'rift', 'field']).not.toContain(kindAt(g, s));
          expect(distance(g, p, h, NEXUS)).toBeLessThan(Infinity);
        }
        expect(isValidStar(g)).toBe(true);
      }
  });

  it('a new game: home planets, dock, opening fleet, tokens, two objectives, the wardens', () => {
    const g = newStar(3, 5, 10, F('tal'));
    expect(FACTIONS[g.ps[0]!.faction]!.id).toBe('tal');
    for (let p = 0; p < 3; p++) {
      const home = planetsIn(g, homeOf(g, p));
      expect(home.every((pl) => pl.owner === p && pl.ready)).toBe(true);
      expect(home[0]!.dock).toBe(true);
      expect(g.space[homeOf(g, p)]![p]).toMatchObject({
        fighter: 2,
        cruiser: 1,
        carrier: 1,
        dread: 1,
      });
      expect(g.ps[p]!.tokens).toBe(4);
    }
    expect(home0Infantry(g)).toBe(5);
    expect(g.revealed).toHaveLength(2);
    expect(g.revealed.every((o) => OBJECTIVES[o]!.stage === 1)).toBe(true);
    expect(planet(g, NEXUS_PLANET)).toMatchObject({ owner: -2, inf: 2 });
    // Faction starts.
    const v = newStar(2, 1, 10, F('vey'));
    expect(v.ps[0]!.techs).toEqual(['ion']);
    const o = newStar(2, 1, 10, F('oru'));
    expect(o.ps[0]!.tg).toBe(3);
  });
});
const home0Infantry = (g: Star) => planetsIn(g, homeOf(g, 0))[0]!.inf;

describe('strategy phase', () => {
  it('two players pick two cards each from the speaker; unpicked cards gain a trade good', () => {
    let g = newStar(2, 3);
    const sp = g.speaker;
    expect(currentPlayer(g)).toBe(sp);
    g = play(
      g,
      { t: 'pick', card: C('commerce') },
      { t: 'pick', card: C('command') },
      { t: 'pick', card: C('dominion') },
      { t: 'pick', card: C('research') },
    );
    expect(g.phase).toBe('action');
    expect(g.ps[sp]!.cards).toEqual([C('commerce'), C('dominion')]);
    // Initiative: the holder of Command (1) goes first.
    expect(g.turn).toBe(1 - sp);
    expect(g.cardTg[C('accord')]).toBe(1);
    expect(g.cardTg[C('industry')]).toBe(1);
    expect(isLegal(g, { t: 'pass' })).toBe(false);
  });

  it('picking a card collects its trade goods; three players pick one each', () => {
    const g = newStar(3, 3);
    g.cardTg[C('accord')] = 2;
    const p = currentPlayer(g);
    const n = act(g, { t: 'pick', card: C('accord') });
    expect(n.ps[p]!.tg).toBe(2);
    expect(n.cardTg[C('accord')]).toBe(0);
    const m = play(n, { t: 'pick', card: C('command') }, { t: 'pick', card: C('commerce') });
    expect(m.phase).toBe('action');
  });
});

describe('movement', () => {
  it('ships move within range; rifts are free, fields block, nebulae and enemy fleets stop', () => {
    const g = quiet(newStar(2, 2));
    const t = [...g.tiles];
    // A straight line from the Nexus outwards.
    const a = NEXUS;
    const b = ADJ[a]![0]!;
    const c = ADJ[b]!.find((x) => x !== a && !ADJ[a]!.includes(x))!;
    const setKind = (s: number, id: string) => {
      const i = g.tiles.indexOf(id);
      if (i >= 0) g.tiles[i] = g.tiles[s]!;
      g.tiles[s] = id;
    };
    setKind(b, 'e1');
    setKind(c, 'e2');
    expect(distance(g, 0, a, c)).toBe(2);
    setKind(b, 'r1');
    expect(distance(g, 0, a, c)).toBe(1);
    setKind(b, 'n1');
    expect(distance(g, 0, a, b)).toBe(1);
    expect(distance(g, 0, a, c)).toBeGreaterThan(2);
    setKind(b, 'e1');
    g.space[b]![1]!.cruiser = 1;
    expect(distance(g, 0, b, c)).toBe(1);
    expect(distance(g, 0, a, c)).toBeGreaterThan(2);
    g.tiles = t;
  });

  it('activation spends a token; ships come from systems without one; fleet limit 4', () => {
    let g = quiet(newStar(2, 4));
    const home = homeOf(g, 0);
    const s = nextTo(g, 0);
    g.space[home]![0] = { ...emptyFleet(), cruiser: 6 };
    g = act(g, { t: 'activate', sys: s });
    expect(g.ps[0]!.tokens).toBe(3);
    expect(g.tokens[s]![0]).toBe(true);
    expect(
      legalActions(g)
        .filter((a) => a.t === 'move')
        .map((a) => (a as { n: number }).n),
    ).toEqual([1, 2, 3, 4]);
    g = act(g, { t: 'move', from: home, kind: 'cruiser', n: 4 });
    expect(g.space[s]![0]!.cruiser).toBe(4);
    expect(legalActions(g).some((a) => a.t === 'move')).toBe(false);
    // The system now holds a token: those ships cannot move again this round.
    g = act(g, { t: 'done' });
    expect(g.act).toBeNull();
    expect(g.turn).toBe(1);
    g.turn = 0;
    expect(isLegal(g, { t: 'activate', sys: s })).toBe(false);
  });

  it('carriers bring fighters and infantry from where they came; capacity limits them', () => {
    let g = quiet(newStar(2, 4));
    const home = homeOf(g, 0);
    const s = nextTo(g, 0);
    g.space[home]![0] = { ...emptyFleet(), carrier: 1, fighter: 2 };
    planetsIn(g, home)[0]!.inf = 5;
    g = act(g, { t: 'activate', sys: s });
    expect(legalActions(g).some((a) => a.t === 'move' && a.kind === 'infantry')).toBe(false);
    g = act(g, { t: 'move', from: home, kind: 'carrier', n: 1 });
    // The fighters had no room left at home, so they came along.
    expect(g.space[s]![0]).toMatchObject({ carrier: 1, fighter: 2 });
    const inf = legalActions(g).filter((a) => a.t === 'move' && a.kind === 'infantry');
    expect(inf.map((a) => (a as { n: number }).n)).toEqual([1, 2]);
    g = act(g, { t: 'move', from: home, kind: 'infantry', n: 2 });
    expect(g.space[s]![0]!.infantry).toBe(2);
    expect(planetsIn(g, home)[0]!.inf).toBe(3);
    expect(capacityOf(g, 0, g.space[s]![0]!)).toBe(4);
  });
});

describe('space combat', () => {
  it('hits: an unhurt dreadnought soaks one, then fighters, cruisers, carriers, dreadnoughts', () => {
    const f = { ...emptyFleet(), fighter: 1, cruiser: 1, carrier: 1, dread: 1 };
    takeHits(f, 1);
    expect(f).toMatchObject({ dread: 1, damaged: 1, fighter: 1 });
    takeHits(f, 2);
    expect(f).toMatchObject({ fighter: 0, cruiser: 0, carrier: 1 });
    takeHits(f, 2);
    expect(f).toMatchObject({ carrier: 0, dread: 0, damaged: 0 });
  });

  it('a battle rolls rounds until one side is gone; winners go on to land', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let g = quiet(newStar(2, seed));
      const home = homeOf(g, 0);
      const s = nextTo(g, 0);
      g.space[home]![0] = { ...emptyFleet(), dread: 2, carrier: 1, infantry: 2 };
      g.space[s]![1] = { ...emptyFleet(), cruiser: 1 };
      g = play(
        g,
        { t: 'activate', sys: s },
        { t: 'move', from: home, kind: 'dread', n: 2 },
        { t: 'move', from: home, kind: 'carrier', n: 1 },
        { t: 'done' },
      );
      expect(g.act!.step).toBe('space');
      expect(isLegal(g, { t: 'retreat' })).toBe(false);
      for (let k = 0; k < 40 && g.act?.step === 'space'; k++) g = act(g, { t: 'roll' });
      const e = g.log.findLast((x) => x.k === 'battle')!;
      expect(e).toMatchObject({ k: 'battle', p: 0, d: 1 });
      if (e.k === 'battle' && e.won) {
        expect(g.space[s]![1]!.cruiser).toBe(0);
        expect(g.act?.step).toBe('land');
      }
    }
  });

  it('the attacker may retreat after a round to a friendly neighbour', () => {
    let g = quiet(newStar(2, 9));
    const home = homeOf(g, 0);
    const s = nextTo(g, 0);
    g.space[home]![0] = { ...emptyFleet(), cruiser: 1 };
    g.space[s]![1] = { ...emptyFleet(), dread: 4 };
    g = play(
      g,
      { t: 'activate', sys: s },
      { t: 'move', from: home, kind: 'cruiser', n: 1 },
      { t: 'done' },
    );
    // A dreadnought soaks the first hit, so the cruiser survives the round unless it is hit.
    g = act(g, { t: 'roll' });
    if (g.act?.step === 'space') {
      expect(isLegal(g, { t: 'retreat' })).toBe(true);
      g = act(g, { t: 'retreat' });
      expect(g.space[home]![0]!.cruiser).toBe(1);
      expect(g.act).toBeNull();
    }
  });

  it('odds: a big fleet beats a lone cruiser', () => {
    const g = newStar(2, 1);
    const a = { ...emptyFleet(), dread: 2, cruiser: 2 };
    const d = { ...emptyFleet(), cruiser: 1 };
    expect(spaceOdds(g, 0, a, 1, d, 200, new Rng(1))).toBeGreaterThan(0.9);
    expect(spaceOdds(g, 0, d, 1, a, 200, new Rng(1))).toBeLessThan(0.1);
  });
});

describe('invasion and production', () => {
  it('landing on a free planet claims it exhausted; on an enemy planet it fights', () => {
    let g = quiet(newStar(2, 4));
    const home = homeOf(g, 0);
    const s = nextTo(g, 0);
    const [pl] = planetsIn(g, s);
    g.space[home]![0] = { ...emptyFleet(), carrier: 1, infantry: 3 };
    g = play(
      g,
      { t: 'activate', sys: s },
      { t: 'move', from: home, kind: 'carrier', n: 1 },
      { t: 'done' },
    );
    expect(g.act!.step).toBe('land');
    g = act(g, { t: 'land', planet: pl!.id, n: 1 });
    expect(planet(g, pl!.id)).toMatchObject({ owner: 0, inf: 1, ready: false });
    expect(g.log.at(-1)).toMatchObject({ k: 'claim', p: 0 });
  });

  it('ground combat over many seeds: the side left standing holds the planet', () => {
    let won = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let g = quiet(newStar(2, seed));
      const home = homeOf(g, 0);
      const s = nextTo(g, 0);
      const pl = planetsIn(g, s)[0]!;
      pl.owner = 1;
      pl.inf = 1;
      pl.dock = true;
      g.space[home]![0] = { ...emptyFleet(), carrier: 1, infantry: 4 };
      g = play(
        g,
        { t: 'activate', sys: s },
        { t: 'move', from: home, kind: 'carrier', n: 1 },
        { t: 'done' },
        { t: 'land', planet: pl.id, n: 4 },
      );
      const after = planet(g, pl.id)!;
      const e = g.log.findLast((x) => x.k === 'ground')!;
      if (e.k === 'ground' && e.won) {
        won++;
        expect(after.owner).toBe(0);
        expect(after.dock).toBe(false);
        expect(after.inf).toBeGreaterThan(0);
      } else expect(after.owner).toBe(1);
    }
    expect(won).toBeGreaterThan(30);
  });

  it('taking the Nexus from its wardens scores a point once', () => {
    const g = quiet(newStar(2, 4));
    const near = ADJ[NEXUS]![0]!;
    g.tiles[near] =
      g.tiles[near]!.startsWith('p') || g.tiles[near] === 'e1' ? g.tiles[near]! : 'e1';
    g.space[near]![0] = { ...emptyFleet(), dread: 1, carrier: 1, infantry: 4 };
    planet(g, NEXUS_PLANET)!.inf = 1;
    let taken = false;
    for (let tries = 0; tries < 10 && !taken; tries++) {
      let h = structuredClone(g);
      h.rng = new Rng(tries + 1).state;
      h = play(
        h,
        { t: 'activate', sys: NEXUS },
        { t: 'move', from: near, kind: 'dread', n: 1 },
        { t: 'move', from: near, kind: 'carrier', n: 1 },
        { t: 'done' },
        { t: 'land', planet: NEXUS_PLANET, n: 4 },
      );
      if (planet(h, NEXUS_PLANET)!.owner === 0) {
        taken = true;
        expect(h.nexusTaken).toBe(true);
        expect(h.ps[0]!.vp).toBe(1);
        expect(h.log.some((e) => e.k === 'seat')).toBe(true);
      }
    }
    expect(taken).toBe(true);
  });

  it('docks produce up to resources + 2, paid by exhausting planets', () => {
    let g = quiet(newStar(2, 4, 10, F('oru')));
    const home = homeOf(g, 0);
    const cap = productionAt(g, 0, home);
    expect(cap).toBe(PLANETS[planetsIn(g, home)[0]!.id]!.r + 2);
    g = act(g, { t: 'activate', sys: home });
    g = act(g, { t: 'done' });
    expect(g.act!.step).toBe('build');
    g = play(g, { t: 'build', kind: 'carrier' }, { t: 'build', kind: 'infantry' });
    g = play(g, { t: 'build', kind: 'infantry' }, { t: 'unbuild', kind: 'infantry' });
    expect(g.act!.queue).toEqual(['carrier', 'infantry']);
    g = act(g, { t: 'done' });
    expect(g.space[home]![0]!.carrier).toBe(1);
    expect(planetsIn(g, home)[0]!.inf).toBe(1);
    expect(g.log.at(-1)).toMatchObject({ k: 'build', n: 2, cost: 4 });
    // Orumar (5) paid for 4: the planet is spent, no trade goods used.
    expect(planetsIn(g, home)[0]!.ready).toBe(false);
    expect(g.ps[0]!.tg).toBe(3);
  });

  it('paying wastes as little as it can and falls back on trade goods', () => {
    const g = quiet(newStar(2, 4, 10, F('vey')));
    // Vey Prime 4/2 and Vey Minor 1/1.
    expect(canPay(g, 0, { res: 5 })).toBe(true);
    expect(canPay(g, 0, { res: 6 })).toBe(false);
    g.ps[0]!.tg = 1;
    expect(canPay(g, 0, { res: 6 })).toBe(true);
    expect(canPay(g, 0, { res: 5, inf: 1 })).toBe(true);
    expect(canPay(g, 0, { res: 5, inf: 3 })).toBe(false);
  });
});

describe('strategy cards', () => {
  const setup = (card: CardId, faction?: Parameters<typeof factionIndex>[0]) => {
    const g = quiet(newStar(2, 6, 10, faction ? F(faction) : undefined), [[card], ['accord']]);
    return g;
  };

  it('Command: two tokens and the speaker; others may pay 3 influence for a token', () => {
    let g = setup('command');
    g = act(g, { t: 'play', card: C('command'), x: -1 });
    expect(g.ps[0]!.tokens).toBe(6);
    expect(g.speaker).toBe(0);
    if (g.phase === 'follow') {
      g = act(g, { t: 'follow', x: -1 });
      expect(g.ps[1]!.tokens).toBe(5);
    }
    expect(g.phase).toBe('action');
    expect(g.turn).toBe(1);
  });

  it('Commerce: three trade goods (Oru four); followers spend a token for one', () => {
    let g = setup('commerce', 'oru');
    g = act(g, { t: 'play', card: C('commerce'), x: -1 });
    expect(g.ps[0]!.tg).toBe(3 + 4);
    expect(g.phase).toBe('follow');
    g = act(g, { t: 'follow', x: -1 });
    expect(g.ps[1]!.tg).toBe(1);
    expect(g.ps[1]!.tokens).toBe(3);
  });

  it('Industry places a free dock; Research grants a technology; tier 2 needs two', () => {
    let g = setup('industry');
    const s = nextTo(g, 0);
    const pl = planetsIn(g, s)[0]!;
    pl.owner = 0;
    g = act(g, { t: 'play', card: C('industry'), x: pl.id });
    expect(planet(g, pl.id)!.dock).toBe(true);
    let r = setup('research');
    const tier2 = TECH_IDS.indexOf('warp');
    expect(isLegal(r, { t: 'play', card: C('research'), x: tier2 })).toBe(false);
    r.ps[0]!.techs = ['ion', 'hull'];
    expect(isLegal(r, { t: 'play', card: C('research'), x: tier2 })).toBe(true);
    r = act(r, { t: 'play', card: C('research'), x: tier2 });
    expect(r.ps[0]!.techs).toContain('warp');
  });

  it('Accord readies planets; Dominion scores an objective now and the Nexus pays a point', () => {
    let g = setup('accord');
    g.ps[0]!.cards = [C('accord')];
    owned(g, 0).forEach((pl) => (pl.ready = false));
    g = act(g, { t: 'play', card: C('accord'), x: -1 });
    expect(owned(g, 0).every((pl) => pl.ready)).toBe(true);
    let d = setup('dominion');
    d.ps[1]!.cards = [C('accord')];
    d.revealed = [objectiveIndex('tech2')];
    d.ps[0]!.techs = ['ion', 'hull'];
    planet(d, NEXUS_PLANET)!.owner = 0;
    d = act(d, { t: 'play', card: C('dominion'), x: objectiveIndex('tech2') });
    expect(d.ps[0]!.vp).toBe(2);
    expect(d.ps[0]!.scored).toEqual([objectiveIndex('tech2')]);
  });

  it('a player passes only once every card is played; the last pass starts the status phase', () => {
    let g = setup('commerce');
    expect(isLegal(g, { t: 'pass' })).toBe(false);
    g = act(g, { t: 'play', card: C('commerce'), x: -1 });
    if (g.phase === 'follow') g = act(g, { t: 'decline' });
    g = act(g, { t: 'play', card: C('accord'), x: -1 });
    if (g.phase === 'follow') g = act(g, { t: 'decline' });
    g = act(g, { t: 'pass' });
    g = act(g, { t: 'pass' });
    expect(g.phase).toBe('status');
  });
});

describe('objectives, status, council', () => {
  it('conditions and spending objectives', () => {
    const g = quiet(newStar(2, 4, 10, F('oru')));
    expect(meets(g, 0, objectiveIndex('docks2'))).toBe(false);
    expect(meets(g, 0, objectiveIndex('spendRes5'))).toBe(true);
    expect(meets(g, 0, objectiveIndex('spendTg4'))).toBe(false);
    g.ps[0]!.tg = 4;
    expect(meets(g, 0, objectiveIndex('spendTg4'))).toBe(true);
    const enemyHome = homeOf(g, 1);
    planetsIn(g, enemyHome)[0]!.owner = 0;
    expect(meets(g, 0, objectiveIndex('strike'))).toBe(true);
  });

  it('status: one objective each, then the Nexus point, a new objective, tokens, ready planets', () => {
    let g = quiet(newStar(2, 4));
    g.phase = 'status';
    g.queue = [0, 1];
    g.revealed = [objectiveIndex('tech2'), objectiveIndex('ships4')];
    g.deck1 = [objectiveIndex('docks2')];
    g.ps[0]!.techs = ['ion', 'hull'];
    owned(g, 1).forEach((pl) => (pl.ready = false));
    planet(g, NEXUS_PLANET)!.owner = 1;
    g.nexusTaken = true;
    expect(isLegal(g, { t: 'score', obj: objectiveIndex('ships4') })).toBe(false);
    g = act(g, { t: 'score', obj: objectiveIndex('tech2') });
    expect(g.ps[0]!.vp).toBe(1);
    g = act(g, { t: 'skip' });
    expect(g.ps[1]!.vp).toBe(1);
    expect(g.revealed).toContain(objectiveIndex('docks2'));
    expect(g.ps.every((x) => x.tokens === 6)).toBe(true);
    expect(owned(g, 1).every((pl) => pl.ready)).toBe(true);
    expect(g.phase).toBe('council');
  });

  it('the council: votes are ready influence, exhaust it, and the speaker breaks ties', () => {
    const g = quiet(newStar(2, 4, 10, F('lumen')));
    const v = votesOf(g, 0);
    expect(v).toBe(4 + 3);
    g.phase = 'council';
    g.speaker = 1;
    g.council = { agenda: agendaIndex('laureate'), queue: [0, 1], votes: [] };
    let n = act(g, { t: 'vote', option: 0 });
    expect(owned(n, 0).every((pl) => !pl.ready)).toBe(true);
    n = act(n, { t: 'vote', option: 1 });
    const sums = n.log.findLast((e) => e.k === 'agenda')!;
    expect(sums).toMatchObject({ k: 'agenda', option: v > votesOf(g, 1) ? 0 : 1 });
    expect(n.phase).toBe('strategy');
    expect(n.round).toBe(2);
    // Ties go to the speaker's choice.
    expect(
      tally(g, {
        agenda: agendaIndex('lanes'),
        queue: [],
        votes: [
          { p: 0, option: 0, n: 3 },
          { p: 1, option: 1, n: 3 },
        ],
      }).option,
    ).toBe(1);
  });

  it('agendas change the game: laws, points, trade goods, units', () => {
    const run = (id: Parameters<typeof agendaIndex>[0], option: number) => {
      const g = quiet(newStar(2, 4));
      g.phase = 'council';
      g.council = { agenda: agendaIndex(id), queue: [0, 1], votes: [] };
      return play(g, { t: 'vote', option }, { t: 'abstain' });
    };
    expect(run('lanes', 0).laws).toEqual([agendaIndex('lanes')]);
    expect(run('lanes', 1).laws).toEqual([]);
    expect(run('laureate', 0).ps[0]!.vp).toBe(1);
    expect(run('tribute', 1).ps[1]!.tg).toBe(4);
    const f = run('fleet', 0);
    expect(f.space[homeOf(f, 0)]![0]!.cruiser).toBe(1);
    expect(run('fleet', 1).ps[1]!.tg).toBe(1);
    expect(run('disarm', 1).ps[0]!.tokens).toBe(5);
    expect(AGENDAS).toHaveLength(12);
  });

  it('reaching the target wins at once; after the last round the most points win', () => {
    let g = quiet(newStar(2, 4, 7));
    g.ps[0]!.vp = 6;
    g.phase = 'status';
    g.queue = [0, 1];
    g.revealed = [objectiveIndex('spendRes5')];
    g = act(g, { t: 'score', obj: objectiveIndex('spendRes5') });
    expect(g.phase).toBe('over');
    expect(g.winners).toEqual([0]);
    let h = quiet(newStar(2, 4));
    h.round = h.maxRounds;
    h.phase = 'status';
    h.queue = [0, 1];
    h.ps[1]!.vp = 3;
    h = play(h, { t: 'skip' }, { t: 'skip' });
    expect(h.phase).toBe('over');
    expect(h.winners).toEqual([1]);
  });

  it('random games end and stay valid', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let g = newStar(2 + (seed % 3), seed);
      const rng = new Rng(seed);
      let k = 0;
      while (g.phase !== 'over' && k++ < 20_000) {
        g = act(g, rng.pick(legalActions(g)));
        if (k % 40 === 0) expect(isValidStar(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.phase).toBe('over');
      expect(g.winners.length).toBeGreaterThan(0);
    }
  }, 30_000);
});

describe('AI', () => {
  it('codes round-trip; observations hide the decks', () => {
    for (let n = 0; n < CODE.size; n += 7) {
      const a = decode(n)!;
      expect(encode(a)).toBe(n);
    }
    const g = newStar(3, 2);
    for (const a of legalActions(g)) expect(decode(encode(a))).toEqual(a);
    const o = observe(g, 0);
    expect(o).not.toHaveProperty('rng');
    expect(o).not.toHaveProperty('deck1');
    expect(o).not.toHaveProperty('agendas');
    expect(o.decks).toEqual([8, 8, 12]);
  });

  it('the regent beats envoys; envoys beat random play', () => {
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
    for (let seed = 1; seed <= 30; seed++) {
      const ids = seed % 2 ? ['regent', 'envoy'] : ['envoy', 'regent'];
      if (run(ids, seed).includes('regent')) wins++;
    }
    // Even play would win 15 of 30.
    expect(wins).toBeGreaterThanOrEqual(19);
    for (let seed = 1; seed <= 3; seed++) expect(run(['random', 'envoy'], seed)).toContain('envoy');
  }, 120_000);
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 4, target: 7 }],
  playouts: 2,
  maxSteps: 20_000,
  checkObservation: (s) => {
    expect(observe(s, 0).planets).toEqual(s.planets);
  },
});
