import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, CODE, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  activeRegions,
  cost,
  isLegal,
  isValidFading,
  legalActions,
  newFading,
  targets,
  turnCoins,
  type Fading,
} from '../engine';
import { DIE, PEOPLES, REGIONS, START_COINS, TRAITS, TURNS } from '../world';

const P = (id: string) => PEOPLES.findIndex((x) => x.id === id);
const T = (id: string) => TRAITS.findIndex((x) => x.id === id);
const R = (en: string) => REGIONS.findIndex((r) => r.name.en === en);

/** Seat 0 holding a pairing with `hand` bands, in its conquest phase. */
function withEmpire(people: string, trait: string, hand = 10, players = 2): Fading {
  const g = newFading(players, 1);
  // Put the pairing on seat 0 and take it out of the row / decks.
  const strip = (xs: number[], v: number) => xs.filter((x) => x !== v);
  g.row = g.row.filter((c) => c.people !== P(people) && c.trait !== T(trait));
  g.peopleDeck = strip(g.peopleDeck, P(people));
  g.traitDeck = strip(g.traitDeck, T(trait));
  g.ps[0]!.active = { people: P(people), trait: T(trait), turns: 0 };
  g.ps[0]!.hand = hand;
  g.phase = { k: 'conquer', taken: 0, heldTaken: 0 };
  return g;
}
/** The engine's game state with a full set of peoples and traits again (for validation). */
const valid = (g: Fading) => {
  const c = structuredClone(g);
  const onBoard = c.ps.flatMap((x) => [x.active, x.declined].filter(Boolean));
  for (let i = 0; i < PEOPLES.length; i++)
    if (
      !c.peopleDeck.includes(i) &&
      !c.row.some((r) => r.people === i) &&
      !onBoard.some((e) => e!.people === i)
    )
      c.peopleDeck.push(i);
  for (let i = 0; i < TRAITS.length; i++)
    if (
      !c.traitDeck.includes(i) &&
      !c.row.some((r) => r.trait === i) &&
      !onBoard.some((e) => e!.trait === i)
    )
      c.traitDeck.push(i);
  return isValidFading(c);
};

describe('the valley', () => {
  it('26 regions (two lakes), each in one piece, symmetric borders, edge regions', () => {
    expect(REGIONS).toHaveLength(26);
    expect(REGIONS.filter((r) => r.terrain === 'lake')).toHaveLength(2);
    REGIONS.forEach((r, i) => {
      expect(r.cells.length).toBeGreaterThanOrEqual(4);
      for (const j of r.adj) expect(REGIONS[j]!.adj).toContain(i);
    });
    expect(REGIONS.filter((r) => r.border && r.terrain !== 'lake').length).toBeGreaterThanOrEqual(
      12,
    );
    expect(REGIONS.filter((r) => r.tribe)).toHaveLength(8);
    expect(PEOPLES).toHaveLength(10);
    expect(TRAITS).toHaveLength(12);
    expect(DIE).toEqual([0, 0, 0, 1, 2, 3]);
  });

  it('a new game: six pairings, five coins each, rounds by players, tribes in place', () => {
    for (const n of [2, 3, 4, 5]) {
      const g = newFading(n, n);
      expect(g.row).toHaveLength(6);
      expect(g.rounds).toBe(TURNS[n]);
      expect(g.ps.every((x) => x.coins === START_COINS)).toBe(true);
      expect(isValidFading(g)).toBe(true);
    }
    const g = newFading(3, 9);
    expect(g.bands.filter((b, r) => REGIONS[r]!.tribe && b === 1)).toHaveLength(8);
    expect(g).toEqual(newFading(3, 9));
  });
});

describe('pairings', () => {
  it('skipping pairings costs a coin each, left on them; the chosen one pays its coins', () => {
    const g = newFading(2, 4);
    g.row[2]!.coins = 3;
    const pick = g.row[2]!;
    const n = act(g, { t: 'pick', i: 2 });
    expect(n.ps[0]!.coins).toBe(START_COINS - 2 + 3);
    expect(n.row[0]!.coins).toBe(1);
    expect(n.row[1]!.coins).toBe(1);
    expect(n.row).toHaveLength(6);
    expect(n.ps[0]!.hand).toBe(PEOPLES[pick.people]!.bands + TRAITS[pick.trait]!.bands);
    expect(n.phase).toEqual({ k: 'conquer', taken: 0, heldTaken: 0 });
    const poor = structuredClone(g);
    poor.ps[0]!.coins = 1;
    expect(legalActions(poor)).toEqual([
      { t: 'pick', i: 0 },
      { t: 'pick', i: 1 },
    ]);
  });
});

describe('conquest', () => {
  it('the first region must be on the edge; costs 2 + defenders + 1 on a mountain', () => {
    const g = withEmpire('hordes', 'numerous', 15);
    const first = targets(g, 0);
    expect(first.every((r) => REGIONS[r]!.border && REGIONS[r]!.terrain !== 'lake')).toBe(true);
    expect(cost(g, 0, R('Barley Reach'))).toBe(2);
    expect(cost(g, 0, R('Flint Ridge'))).toBe(3);
    expect(cost(g, 0, R('Northmoor'))).toBe(3); // a wild tribe
    let n = act(g, { t: 'take', r: R('Northmoor') });
    expect(n.tribes[R('Northmoor')]).toBe(false);
    expect(n.bands[R('Northmoor')]).toBe(3);
    expect(n.ps[0]!.hand).toBe(12);
    // Then only neighbours.
    for (const r of targets(n, 0)) expect(REGIONS[r]!.adj).toContain(R('Northmoor'));
    n = act(n, { t: 'take', r: R('Copper Hills') });
    expect(activeRegions(n, 0)).toHaveLength(2);
  });

  it('peoples and traits change costs and reach', () => {
    const g = withEmpire('marshlings', 'fierce');
    expect(cost(g, 0, R('Northmoor'))).toBe(3 - 2);
    expect(cost(g, 0, R('Barley Reach'))).toBe(1);
    const sky = withEmpire('skyriders', 'numerous');
    expect(targets(sky, 0)).toHaveLength(24);
    const delvers = withEmpire('delvers', 'numerous');
    delvers.holds[R('Grey Fen')] = { p: 0, declined: false };
    delvers.bands[R('Grey Fen')] = 2;
    expect(targets(delvers, 0)).toContain(R('Ember Vale')); // another cave, far away
    expect(cost(delvers, 0, R('Ember Vale'))).toBe(1);
    const mounted = withEmpire('hordes', 'mounted');
    expect(cost(mounted, 0, R('Bramble Down'))).toBe(1);
  });

  it('beaten active defenders lose one band (two to the merciless); the rest withdraw', () => {
    for (const [trait, lost] of [
      ['numerous', 1],
      ['merciless', 2],
    ] as const) {
      const g = withEmpire('hordes', trait, 20);
      g.ps[1]!.active = { people: g.row[0]!.people, trait: g.row[0]!.trait, turns: 1 };
      g.row.shift();
      g.holds[R('Barley Reach')] = { p: 1, declined: false };
      g.bands[R('Barley Reach')] = 4;
      g.holds[R('Millbrook')] = { p: 1, declined: false };
      g.bands[R('Millbrook')] = 1;
      expect(cost(g, 0, R('Barley Reach'))).toBe(6);
      const n = act(g, { t: 'take', r: R('Barley Reach') });
      expect(n.holds[R('Barley Reach')]).toEqual({ p: 0, declined: false });
      expect(n.bands[R('Millbrook')]).toBe(1 + 4 - lost);
      expect(n.phase).toEqual({ k: 'conquer', taken: 1, heldTaken: 1 });
    }
  });

  it('a declined people just loses its band, and leaves the board with its last region', () => {
    const g = withEmpire('hordes', 'numerous', 20);
    const old = g.row.shift()!;
    g.ps[1]!.declined = { people: old.people, trait: old.trait, turns: 3 };
    g.holds[R('Barley Reach')] = { p: 1, declined: true };
    g.bands[R('Barley Reach')] = 1;
    const n = act(g, { t: 'take', r: R('Barley Reach') });
    expect(n.ps[1]!.declined).toBeNull();
    expect(n.peopleDeck.at(-1)).toBe(old.people);
    expect(n.traitDeck.at(-1)).toBe(old.trait);
  });

  it('the reinforcement die: one last try, win or lose', () => {
    let won: Fading | null = null;
    let lost: Fading | null = null;
    for (let k = 0; k < 200 && (!won || !lost); k++) {
      const g = withEmpire('hordes', 'numerous', 1);
      g.rng = new Rng(k).state;
      const n = act(g, { t: 'gamble', r: R('Flint Ridge') }); // costs 3
      const roll = [...n.log].reverse().find((e) => e.k === 'gamble')!;
      expect(roll.k).toBe('gamble');
      if (roll.k === 'gamble' && roll.ok) won = n;
      if (roll.k === 'gamble' && !roll.ok) lost = n;
      expect(n.phase.k).toBe('redeploy');
    }
    expect(won!.holds[R('Flint Ridge')]).toEqual({ p: 0, declined: false });
    expect(won!.bands[R('Flint Ridge')]).toBe(1);
    expect(lost!.holds[R('Flint Ridge')]).toBeNull();
    expect(lost!.ps[0]!.hand).toBe(1);
    // Only when short: with enough bands it is a plain take.
    const g = withEmpire('hordes', 'numerous', 2);
    const barley = legalActions(g).filter((a) => 'r' in a && a.r === R('Barley Reach'));
    expect(barley).toEqual([{ t: 'take', r: R('Barley Reach') }]);
    expect(legalActions(withEmpire('hordes', 'numerous', 1))).toContainEqual({
      t: 'gamble',
      r: R('Barley Reach'),
    });
  });
});

describe('turns and scoring', () => {
  it('redeploy, then a coin per region and the pairing’s bonuses; Wealthy pays once', () => {
    let g = withEmpire('stonefolk', 'wealthy', 12);
    g = act(g, { t: 'take', r: R('Bramble Down') }); // hills
    g = act(g, { t: 'take', r: R('Grey Fen') }); // next door
    g = act(g, { t: 'stop' });
    expect(g.phase.k).toBe('redeploy');
    expect(turnCoins(g, 0, 0)).toBe(2 + 1 + 7);
    while (g.ps[0]!.hand > 0) g = act(g, legalActions(g)[0]!);
    g = act(g, { t: 'done' });
    expect(g.ps[0]!.coins).toBe(START_COINS + 10);
    expect(g.turn).toBe(1);
    expect(g.ps[0]!.active!.turns).toBe(1);
    expect(turnCoins(g, 0, 0)).toBe(3);
  });

  it('declining: one band stays on each region; the older declined people leaves; a new pick next turn', () => {
    let g = withEmpire('hordes', 'numerous', 15);
    g = act(g, { t: 'take', r: R('Barley Reach') });
    g = act(g, { t: 'take', r: R('Millbrook') });
    g = act(g, { t: 'stop' });
    while (g.ps[0]!.hand > 0) g = act(g, legalActions(g)[0]!);
    g = act(g, { t: 'done' });
    // Seat 1 picks and passes.
    g = act(g, { t: 'pick', i: 0 });
    g = act(g, { t: 'stop' });
    while (legalActions(g)[0]!.t === 'place') g = act(g, legalActions(g)[0]!);
    g = act(g, { t: 'done' });
    expect(g.phase).toEqual({ k: 'start' });
    expect(isLegal(g, { t: 'decline' })).toBe(true);
    const coins = g.ps[0]!.coins;
    g = act(g, { t: 'decline' });
    expect(g.holds[R('Barley Reach')]).toEqual({ p: 0, declined: true });
    expect(g.bands[R('Barley Reach')]).toBe(1);
    expect(g.ps[0]!.active).toBeNull();
    expect(g.ps[0]!.coins).toBe(coins + 2);
    // Next turn for seat 0 is a pick.
    g = act(g, { t: 'march' });
    g = act(g, { t: 'stop' });
    while (legalActions(g)[0]!.t === 'place') g = act(g, legalActions(g)[0]!);
    g = act(g, { t: 'done' });
    expect(g.phase).toEqual({ k: 'pick' });
    expect(valid(g)).toBe(true);
  });

  it('Stalwart may decline at the end of a turn of conquest', () => {
    let g = withEmpire('hordes', 'stalwart', 4);
    g = act(g, { t: 'take', r: R('Barley Reach') });
    g = act(g, { t: 'stop' });
    while (legalActions(g)[0]!.t === 'place') g = act(g, legalActions(g)[0]!);
    expect(legalActions(g)).toEqual([{ t: 'done' }, { t: 'decline' }]);
    const n = act(g, { t: 'decline' });
    expect(n.holds[R('Barley Reach')]).toEqual({ p: 0, declined: true });
    expect(n.turn).toBe(1);
  });

  it('the game ends after the last round with the most coins winning', () => {
    const g = newFading(2, 5);
    g.round = g.rounds;
    g.turn = 1;
    g.ps[1]!.active = null;
    g.ps[0]!.coins = 30;
    g.phase = { k: 'redeploy', heldTaken: 0 };
    const n = act(g, { t: 'done' });
    expect(n.phase.k).toBe('over');
    expect(n.winners).toEqual([0]);
    expect(env.getOutcome(n)!.returns).toEqual([1, 0]);
  });

  it('random games end with every people and trait accounted for', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let g = newFading(2 + (seed % 4), seed);
      const rng = new Rng(seed);
      let k = 0;
      while (g.phase.k !== 'over' && k++ < 20_000) {
        g = act(g, rng.pick(legalActions(g)));
        if (k % 25 === 0) expect(isValidFading(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.phase.k).toBe('over');
      expect(g.round).toBe(g.rounds + 1);
    }
  });
});

describe('AI', () => {
  it('codes round-trip; observations hide the deck order', () => {
    for (let n = 0; n < CODE.size; n++) expect(encode(decode(n)!)).toBe(n);
    const o = observe(newFading(3, 2), 0);
    expect(o).not.toHaveProperty('rng');
    expect(o).not.toHaveProperty('peopleDeck');
    expect(o.decks).toEqual([4, 6]);
  });

  it('the warlord beats raiders; raiders beat random play', () => {
    const play = (ids: string[], seed: number) => {
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
      const ids = ['raider', 'raider'];
      ids.splice(seed % 3, 0, 'warlord');
      if (play(ids, seed).includes('warlord')) wins++;
    }
    // One seat in three: even play would win 10 of 30.
    expect(wins).toBeGreaterThanOrEqual(17);
    for (let seed = 1; seed <= 5; seed++)
      expect(play(['random', 'raider'], seed)).toContain('raider');
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 5 }],
  playouts: 2,
  maxSteps: 20_000,
  checkObservation: (s) => {
    expect(observe(s, 0).holds).toEqual(s.holds);
  },
});
