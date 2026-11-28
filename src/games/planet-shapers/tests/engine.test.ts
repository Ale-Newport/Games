import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, CODE, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  awardMetric,
  card,
  complete,
  costOf,
  currentPlayer,
  isLegal,
  isValidShapers,
  legalActions,
  meetsReq,
  milestoneMet,
  newShapers,
  paymentFor,
  scoreAll,
  spotsFor,
  tagCount,
  type Action,
  type Shapers,
} from '../engine';
import {
  ADJ,
  AWARDS,
  BASINS,
  BONUS,
  CARDS,
  CORPS,
  MAX,
  MILESTONES,
  POS,
  START_TR,
  cardIndex,
  corpIndex,
} from '../world';

const C = (id: string) => cardIndex(id);
const play = (g: Shapers, ...as: Action[]) => as.reduce((s, a) => act(s, a), g);

/** A two-player game in the action phase, seat 0 to move, with a corporation and these cards. */
function ready(corp = 'meridian', hand: string[] = [], credits = 60): Shapers {
  const g = newShapers(2, 7);
  g.ps.forEach((x, p) => {
    x.corp = p === 0 ? corpIndex(corp as never) : corpIndex('archive');
    for (const [r, v] of Object.entries(CORPS[x.corp]!.prod)) x.prod[r as keyof typeof x.prod] += v;
    g.deck.push(...x.offer);
    x.offer = [];
    x.res.credits = credits;
  });
  for (const id of hand) {
    const i = C(id);
    g.deck = g.deck.filter((x) => x !== i);
    g.ps[0]!.hand.push(i);
  }
  g.phase = 'action';
  g.queue = [];
  g.turn = 0;
  return g;
}

describe('content', () => {
  it('the map: 37 spaces, ten basins, bonuses on land; 57 cards, six corporations', () => {
    expect(POS).toHaveLength(37);
    ADJ.forEach((ns, i) => ns.forEach((j) => expect(ADJ[j]).toContain(i)));
    expect(new Set(BASINS).size).toBe(10);
    BASINS.forEach((s) => expect(BONUS[s]).toEqual({}));
    expect(CARDS).toHaveLength(57);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(57);
    expect(CORPS).toHaveLength(6);
    CARDS.forEach((c) => {
      expect(c.cost).toBeGreaterThan(0);
      if (c.tags.includes('event')) expect(c.kind).toBe('event');
    });
  });

  it('a new game: two corporations each, ten cards on offer, TR 20, every card accounted for', () => {
    for (const n of [2, 3, 4]) {
      let g = newShapers(n, n);
      expect(g.ps.every((x) => x.tr === START_TR && x.offer.length === 0)).toBe(false);
      expect(g.ps[0]!.options).toHaveLength(2);
      expect(isValidShapers(g)).toBe(true);
      const seen = new Set<number>();
      for (let p = 0; p < n; p++) {
        expect(currentPlayer(g)).toBe(p);
        expect(g.ps[p]!.options).toHaveLength(2);
        g.ps[p]!.options.forEach((o) => seen.add(o));
        g = play(g, { t: 'corp', i: 0 }, { t: 'buy', mask: 0b11 });
      }
      // Options never repeat a corporation someone took.
      expect(new Set(g.ps.map((x) => x.corp)).size).toBe(n);
      expect(g.phase).toBe('action');
      expect(g.ps.every((x) => x.hand.length === 2)).toBe(true);
      expect(isValidShapers(g)).toBe(true);
    }
  });

  it('buying is limited by credits and costs 3 (Archive 2)', () => {
    let g = newShapers(2, 1);
    g.ps[0]!.options = [corpIndex('archive'), corpIndex('verdance')];
    g = act(g, { t: 'corp', i: 0 });
    expect(g.ps[0]!.res.credits).toBe(40);
    g = act(g, { t: 'buy', mask: 0b111 });
    expect(g.ps[0]!.res.credits).toBe(34);
    expect(g.ps[0]!.hand).toHaveLength(3);
  });
});

describe('cards', () => {
  it('requirements, costs, discounts and payment with ore and crystal', () => {
    const g = ready('forgeline', ['polar-melt', 'trade-hub', 'sunshade', 'fusion-cell']);
    expect(meetsReq(g, 0, C('polar-melt'))).toBe(false);
    g.params.heat = 6;
    expect(meetsReq(g, 0, C('polar-melt'))).toBe(true);
    expect(meetsReq(g, 0, C('fusion-cell'))).toBe(false);
    g.ps[0]!.res.ore = 4;
    // Forgeline ore is worth 3: Trade Hub (18) takes 4 ore (12) and 6 credits.
    expect(paymentFor(g, 0, C('trade-hub'))).toEqual({ credits: 6, ore: 4, crystal: 0 });
    g.ps[0]!.played.push(C('builders-guild'));
    expect(costOf(g, 0, C('trade-hub'))).toBe(16);
    g.ps[0]!.res.credits = 2;
    g.ps[0]!.res.ore = 5;
    // Overpaying with one more ore when credits run short.
    expect(paymentFor(g, 0, C('trade-hub'))).toEqual({ credits: 1, ore: 5, crystal: 0 });
    g.ps[0]!.res.ore = 3;
    expect(paymentFor(g, 0, C('trade-hub'))).toBeNull();
    expect(isLegal(g, { t: 'play', card: C('trade-hub') })).toBe(false);
  });

  it('playing a card: production, gains, tags and triggers; events keep no tags', () => {
    let g = ready('meridian', ['arboretum', 'moss', 'lichen']);
    g.params.heat = 2;
    g.params.air = 2;
    g = play(g, { t: 'play', card: C('arboretum') });
    // Arboretum is a plant tag itself: +2 flora.
    expect(g.ps[0]!.res.flora).toBe(2);
    g.turn = 0;
    g = act(g, { t: 'play', card: C('moss') });
    expect(g.ps[0]!.prod.flora).toBe(1);
    expect(g.ps[0]!.res.flora).toBe(4);
    g.turn = 0;
    g = act(g, { t: 'play', card: C('lichen') });
    expect(g.ps[0]!.res.flora).toBe(4 + 3 + 2);
    expect(tagCount(g, 0, 'plant')).toBe(2);
    expect(g.ps[0]!.events).toEqual([C('lichen')]);
  });

  it('production cannot drop below zero (credits to −5)', () => {
    const g = ready('meridian', ['oxygen-works']);
    expect(isLegal(g, { t: 'play', card: C('oxygen-works') })).toBe(false);
    g.ps[0]!.prod.power = 1;
    expect(isLegal(g, { t: 'play', card: C('oxygen-works') })).toBe(true);
  });

  it('Meridian gets 4 back on cards and projects costing 20 or more', () => {
    let g = ready('meridian', ['ark-archive']);
    g = act(g, { t: 'play', card: C('ark-archive') });
    expect(g.ps[0]!.res.credits).toBe(60 - 20 + 4);
  });
});

describe('parameters and tiles', () => {
  it('raising heat gives TR, heat production at 3 and 6, a sea at 8', () => {
    let g = ready('meridian', [], 200);
    for (let k = 0; k < 8; k++) {
      g.turn = 0;
      g = act(g, { t: 'std', id: 'heater' });
      if (g.phase === 'place') g = act(g, legalActions(g)[0]!);
    }
    expect(g.params.heat).toBe(8);
    expect(g.ps[0]!.prod.heat).toBe(2);
    expect(g.params.sea).toBe(1);
    expect(g.ps[0]!.tr).toBe(START_TR + 9);
  });

  it('seas go in basins with their bonuses; tiles next to seas pay 2 credits', () => {
    let g = ready('meridian', [], 100);
    g = act(g, { t: 'std', id: 'aquifer' });
    expect(g.phase).toBe('place');
    expect(spotsFor(g, 0, 'sea').sort()).toEqual([...BASINS].sort());
    const basin = BASINS[4]!;
    g = act(g, { t: 'tile', space: basin });
    expect(g.tiles[basin]).toEqual({ kind: 'sea', owner: -1 });
    expect(g.params.sea).toBe(1);
    g.turn = 0;
    const credits = g.ps[0]!.res.credits;
    g = act(g, { t: 'std', id: 'grove' });
    const land = ADJ[basin]!.find((s) => !BASINS.includes(s))!;
    g = act(g, { t: 'tile', space: land });
    expect(g.ps[0]!.res.credits).toBe(credits - 23 + 4 + 2);
    expect(g.params.air).toBe(1);
  });

  it('groves must touch your tiles when they can; settlements may not touch each other', () => {
    let g = ready('meridian', [], 200);
    g = play(g, { t: 'std', id: 'settlement' }, { t: 'tile', space: 30 });
    expect(g.ps[0]!.prod.credits).toBe(2);
    g.turn = 0;
    g = act(g, { t: 'std', id: 'grove' });
    const spots = spotsFor(g, 0, 'grove');
    expect(spots.every((s) => ADJ[s]!.includes(30))).toBe(true);
    g = act(g, { t: 'tile', space: spots[0]! });
    expect(spotsFor(g, 1, 'settlement').some((s) => ADJ[s]!.includes(30))).toBe(false);
  });

  it('flora and heat convert; seas run out at seven', () => {
    let g = ready('verdance', [], 300);
    g.ps[0]!.res.flora = 7;
    g.ps[0]!.res.heat = 8;
    expect(isLegal(g, { t: 'convert', what: 'flora' })).toBe(true);
    g = act(g, { t: 'convert', what: 'heat' });
    expect(g.params.heat).toBe(1);
    g.turn = 0;
    for (let k = 0; k < MAX.sea; k++) {
      g.turn = 0;
      g = act(g, { t: 'std', id: 'aquifer' });
      g = act(g, legalActions(g)[0]!);
    }
    expect(g.params.sea).toBe(MAX.sea);
    g.turn = 0;
    expect(isLegal(g, { t: 'std', id: 'aquifer' })).toBe(false);
  });
});

describe('actions, milestones, awards, generations, scoring', () => {
  it('card actions once per generation', () => {
    let g = ready('meridian', ['power-broker']);
    g = act(g, { t: 'play', card: C('power-broker') });
    g.turn = 0;
    g.ps[0]!.res.power = 2;
    g = act(g, { t: 'use', card: C('power-broker') });
    expect(g.ps[0]!.res.credits).toBe(60 - 7 + 2);
    g.turn = 0;
    expect(isLegal(g, { t: 'use', card: C('power-broker') })).toBe(false);
  });

  it('milestones (three at most) and awards (8, 14, 20)', () => {
    let g = ready('meridian', [], 100);
    g.ps[0]!.tr = 30;
    expect(milestoneMet(g, 0, MILESTONES.indexOf('shaper'))).toBe(true);
    g = act(g, { t: 'claim', m: MILESTONES.indexOf('shaper') });
    expect(g.ps[0]!.res.credits).toBe(92);
    g.turn = 0;
    g = act(g, { t: 'fund', a: AWARDS.indexOf('banker') });
    g.turn = 0;
    g = act(g, { t: 'fund', a: AWARDS.indexOf('thermalist') });
    expect(g.ps[0]!.res.credits).toBe(92 - 8 - 14);
    g.claimed.push({ m: 1, p: 1 }, { m: 2, p: 1 });
    g.turn = 0;
    expect(legalActions(g).some((a) => a.t === 'claim')).toBe(false);
    expect(awardMetric(g, 0, AWARDS.indexOf('banker'))).toBe(1);
  });

  it('a generation: pass, production (power turns to heat), research of four cards', () => {
    let g = ready('meridian');
    g.ps[0]!.res.power = 3;
    g.ps[0]!.prod.heat = 1;
    g = play(g, { t: 'pass' }, { t: 'pass' });
    expect(g.phase).toBe('research');
    expect(g.gen).toBe(2);
    expect(g.ps[0]!.res.heat).toBe(4);
    expect(g.ps[0]!.res.power).toBe(0);
    expect(g.ps[0]!.res.credits).toBe(60 + 20 + 1);
    expect(g.ps[0]!.offer).toHaveLength(4);
    expect(g.ps[1]!.offer).toHaveLength(5);
    expect(currentPlayer(g)).toBe(1);
  });

  it('the planet complete ends the game after production; points add up', () => {
    let g = ready('meridian');
    g.params = { heat: MAX.heat, air: MAX.air, sea: MAX.sea };
    g.tiles = g.tiles.map((_, s) =>
      BASINS.slice(0, MAX.sea).includes(s) ? { kind: 'sea', owner: -1 } : null,
    );
    g.tiles[30] = { kind: 'settlement', owner: 0 };
    const grove = ADJ[30]!.find((s) => !BASINS.includes(s))!;
    g.tiles[grove] = { kind: 'grove', owner: 1 };
    g.claimed = [{ m: 0, p: 0 }];
    g.funded = [{ a: AWARDS.indexOf('landlord'), p: 0 }];
    g.ps[0]!.played = [C('monument')];
    expect(complete(g)).toBe(true);
    g = play(g, { t: 'pass' }, { t: 'pass' });
    expect(g.phase).toBe('over');
    const s = scoreAll(g);
    expect(s[0]).toMatchObject({ tr: START_TR, milestones: 5, settlements: 1, cards: 2 });
    // A tie for the award: both get first place (two players: no second).
    expect(s[0]!.awards).toBe(5);
    expect(s[1]!.awards).toBe(5);
    expect(s[1]!.groves).toBe(1);
    expect(g.winners).toEqual([0]);
  });

  it('random games end and stay valid', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let g = newShapers(2 + (seed % 3), seed);
      const rng = new Rng(seed);
      let k = 0;
      while (g.phase !== 'over' && k++ < 50_000) {
        g = act(g, rng.pick(legalActions(g)));
        if (k % 40 === 0) expect(isValidShapers(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.phase).toBe('over');
      expect(g.scores).toHaveLength(g.players);
    }
  }, 30_000);
});

describe('AI', () => {
  it('codes round-trip; observations hide other hands and the deck', () => {
    for (let n = 0; n < CODE.size; n += 5) expect(encode(decode(n)!)).toBe(n);
    const g = newShapers(3, 2);
    for (const a of legalActions(g)) expect(decode(encode(a))).toEqual(a);
    const o = observe(g, 1);
    expect(o).not.toHaveProperty('rng');
    expect(o).not.toHaveProperty('deck');
    expect(o.ps[0]!.offer).toBeNull();
    expect(o.ps[1]!.offer).toEqual(g.ps[1]!.offer);
    expect(card(0).id).toBe('wind-rows');
  });

  it('the architect beats cadets; cadets beat random play', () => {
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
    for (let seed = 1; seed <= 16; seed++) {
      const ids = seed % 2 ? ['architect', 'cadet'] : ['cadet', 'architect'];
      if (run(ids, seed).includes('architect')) wins++;
    }
    // Even play would win 8 of 16.
    expect(wins).toBeGreaterThanOrEqual(10);
    for (let seed = 1; seed <= 3; seed++) expect(run(['random', 'cadet'], seed)).toContain('cadet');
  }, 180_000);
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 4 }],
  playouts: 2,
  maxSteps: 50_000,
  checkObservation: (s) => {
    expect(observe(s, 0).ps[1]!.hand).toBeNull();
  },
});
