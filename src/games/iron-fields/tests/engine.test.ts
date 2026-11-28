import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, CODE, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  currentPlayer,
  homeOf,
  isLegal,
  isValidIron,
  legalActions,
  newIron,
  produceCost,
  reach,
  scoreAll,
  territories,
  tierOf,
  workers,
  type Action,
  type Iron,
} from '../engine';
import {
  ADJ,
  BOARDS,
  ENCOUNTERS,
  FACTIONS,
  FOUNDRY,
  POS,
  STARS_TO_END,
  TOPS,
  type FactionId,
} from '../world';

const F = (id: FactionId) => FACTIONS.findIndex((f) => f.id === id);
const play = (g: Iron, ...as: Action[]) => as.reduce((s, a) => act(s, a), g);
const section = (top: (typeof TOPS)[number]) => TOPS.indexOf(top);
/** A quiet land: every space a farm, units cleared but the characters at home. */
function quiet(faction0 = F('ashen'), players = 2): Iron {
  const g = newIron(players, 7, faction0);
  g.terrain = g.terrain.map((t) => (t === 'home' || t === 'foundry' ? t : 'farm'));
  g.tokens = g.tokens.map(() => false);
  g.units = g.units.filter((u) => u.kind === 'char');
  return g;
}
const place = (g: Iron, kind: 'worker' | 'mech' | 'char', owner: number, at: number) => {
  if (kind === 'char') g.units.find((u) => u.kind === 'char' && u.owner === owner)!.at = at;
  else g.units.push({ id: g.nextId++, kind, owner, at });
  return g.units[g.units.length - 1]!;
};
const charOf = (g: Iron, p: number) => g.units.find((u) => u.kind === 'char' && u.owner === p)!;

describe('set-up', () => {
  it('homes on corners, a character and two workers each, encounters away from homes', () => {
    for (const n of [2, 3, 4])
      for (let seed = 1; seed <= 6; seed++) {
        const g = newIron(n, seed);
        expect(g.terrain[FOUNDRY]).toBe('foundry');
        expect(g.tokens.filter(Boolean)).toHaveLength(6);
        for (let p = 0; p < n; p++) {
          const h = homeOf(g, p);
          expect(g.terrain[h]).toBe('home');
          expect(charOf(g, p).at).toBe(h);
          const ws = g.units.filter((u) => u.owner === p && u.kind === 'worker');
          expect(ws).toHaveLength(2);
          ws.forEach((w) => expect(ADJ[h]).toContain(w.at));
          ADJ[h]!.forEach((s) => expect(g.tokens[s]).toBe(false));
          expect(g.ps[p]!.res).toEqual({ oil: 1, metal: 1, food: 1, wood: 1 });
        }
        expect(new Set(g.ps.map((x) => x.faction)).size).toBe(n);
        expect(new Set(g.ps.map((x) => x.board)).size).toBe(n);
        expect(isValidIron(g)).toBe(true);
      }
    expect(POS).toHaveLength(37);
    expect(FACTIONS).toHaveLength(5);
    expect(BOARDS).toHaveLength(4);
    expect(ENCOUNTERS).toHaveLength(8);
  });

  it('starting power by faction, popularity and coins by board; a chosen faction', () => {
    const g = newIron(2, 3, F('crown'));
    expect(FACTIONS[g.ps[0]!.faction]!.id).toBe('crown');
    expect(g.ps[0]!.power).toBe(5);
    const b = BOARDS[g.ps[0]!.board]!;
    expect(g.ps[0]!.popularity).toBe(b.popularity);
    expect(g.ps[0]!.coins).toBe(b.coins);
    expect(newIron(2, 3, F('ashen')).ps[0]!.costs.deploy).toBe(1);
  });
});

describe('turns', () => {
  it('a section other than last turn’s; trade, bolster, then the bottom action', () => {
    let g = quiet(F('ember'));
    g = act(g, { t: 'section', i: section('trade') });
    g = act(g, { t: 'trade', a: 'oil', b: 'metal' });
    // Emberfold gets a third of the first resource.
    expect(g.ps[0]!.res).toMatchObject({ oil: 3, metal: 2 });
    if (g.phase === 'turn') g = act(g, { t: 'done' });
    expect(g.turn).toBe(1);
    g = play(g, { t: 'section', i: section('bolster') });
    if (g.phase === 'turn') g = act(g, { t: 'done' });
    expect(g.turn).toBe(0);
    expect(isLegal(g, { t: 'section', i: section('trade') })).toBe(false);
  });

  it('producing: workers make resources (villages make workers), paid as the workforce grows', () => {
    let g = quiet(F('thorn'));
    const home = homeOf(g, 0);
    const [a, b] = ADJ[home]!.filter((s) => g.terrain[s] !== 'home');
    g.terrain[a!] = 'forest';
    g.terrain[b!] = 'village';
    place(g, 'worker', 0, a!);
    place(g, 'worker', 0, a!);
    place(g, 'worker', 0, b!);
    expect(produceCost(g, 0)).toEqual({ power: 0, popularity: 0, coins: 0 });
    g = play(
      g,
      { t: 'section', i: section('produce') },
      { t: 'produce', hex: a! },
      { t: 'produce', hex: b! },
    );
    // Two workers on a forest + Rootbound = 3 wood; the village worker brings a new worker.
    expect(g.ps[0]!.res.wood).toBe(1 + 3);
    expect(workers(g, 0)).toBe(4);
    expect(produceCost(g, 0)).toEqual({ power: 1, popularity: 0, coins: 0 });
  });

  it('moving: one step (two with the first mech), lakes need the second mech or the Saltmarch', () => {
    const g = quiet();
    const c = charOf(g, 0);
    c.at = FOUNDRY;
    const ring1 = ADJ[FOUNDRY]!;
    g.terrain[ring1[0]!] = 'lake';
    expect(reach(g, c).sort()).toEqual(ring1.slice(1).sort());
    g.ps[0]!.mechs = 1;
    expect(reach(g, c).length).toBeGreaterThan(6);
    expect(reach(g, c)).not.toContain(ring1[0]);
    g.ps[0]!.mechs = 2;
    expect(reach(g, c)).toContain(ring1[0]);
    // Never into a rival's home.
    expect(reach(g, { ...c, at: ADJ[homeOf(g, 1)]![0]! })).not.toContain(homeOf(g, 1));
  });

  it('walking onto lone enemy workers sends them home and costs popularity', () => {
    let g = quiet();
    const target = ADJ[FOUNDRY]![0]!;
    charOf(g, 0).at = FOUNDRY;
    g.ps[0]!.foundry = true;
    place(g, 'worker', 1, target);
    const pop = g.ps[0]!.popularity;
    g = play(
      g,
      { t: 'section', i: section('move') },
      { t: 'move', unit: charOf(g, 0).id, to: target },
    );
    expect(g.units.find((u) => u.owner === 1 && u.kind === 'worker')!.at).toBe(homeOf(g, 1));
    expect(g.ps[0]!.popularity).toBe(Math.max(0, pop - 1));
  });

  it('fights: secret bids plus units and bonuses, attackers win ties, losers go home, a star', () => {
    let g = quiet(F('crown'));
    const target = ADJ[FOUNDRY]![0]!;
    charOf(g, 0).at = FOUNDRY;
    g.ps[0]!.foundry = true;
    charOf(g, 1).at = target;
    g.ps[0]!.power = 5;
    g.ps[1]!.power = 7;
    g = play(
      g,
      { t: 'section', i: section('move') },
      { t: 'move', unit: charOf(g, 0).id, to: target },
    );
    expect(g.phase).toBe('attack');
    g = act(g, { t: 'bid', n: 4 });
    expect(g.phase).toBe('defend');
    expect(currentPlayer(g)).toBe(1);
    // The defender does not see the attack bid.
    expect(observe(g, 1).battle!.attackBid).toBeNull();
    // Highcrown: 4 + 1 unit + 2 = 7 against 6 + 1 = 7: the attacker wins the tie.
    g = act(g, { t: 'bid', n: 6 });
    expect(g.log.findLast((e) => e.k === 'battle')).toMatchObject({ a: 7, dv: 7, won: true });
    expect(charOf(g, 1).at).toBe(homeOf(g, 1));
    expect(g.ps[0]!.stars).toEqual(['combat']);
    expect(g.ps[0]!.power).toBe(1);
    expect(g.ps[1]!.power).toBe(1);
  });

  it('the Foundry pays once; encounters offer three choices', () => {
    let g = quiet();
    const c = charOf(g, 0);
    c.at = ADJ[FOUNDRY]![0]!;
    const coins = g.ps[0]!.coins;
    g = play(g, { t: 'section', i: section('move') }, { t: 'move', unit: c.id, to: FOUNDRY });
    expect(g.ps[0]!.coins).toBe(coins + 3);
    expect(g.ps[0]!.foundry).toBe(true);
    let h = quiet();
    const spot = ADJ[FOUNDRY]![1]!;
    h.tokens[spot] = true;
    charOf(h, 0).at = FOUNDRY;
    h.ps[0]!.foundry = true;
    h.deck = [0];
    h = play(
      h,
      { t: 'section', i: section('move') },
      { t: 'move', unit: charOf(h, 0).id, to: spot },
    );
    expect(h.phase).toBe('encounter');
    expect(legalActions(h).map((a) => (a as { k: number }).k)).toEqual([0, 1, 2]);
    const before = h.ps[0]!.coins;
    h = act(h, { t: 'option', k: 0 });
    expect(h.ps[0]!.coins).toBe(before + (ENCOUNTERS[0]!.options[0]!.coins ?? 0));
    expect(h.tokens[spot]).toBe(false);
  });

  it('bottom actions: costs and coins; upgrades cheapen a bottom action; structures and recruits', () => {
    let g = quiet(F('thorn'));
    g.ps[0]!.board = 0; // move/upgrade, trade/deploy, produce/build, bolster/enlist
    g.ps[0]!.res = { oil: 5, metal: 5, food: 5, wood: 5 };
    const home = homeOf(g, 0);
    const w = ADJ[home]!.find((s) => g.terrain[s] === 'farm')!;
    place(g, 'worker', 0, w);
    g = play(
      g,
      { t: 'section', i: section('move') },
      { t: 'coin' },
      { t: 'upgrade', top: 'produce', bottom: 'deploy' },
    );
    expect(g.ps[0]!.res.oil).toBe(3);
    expect(g.ps[0]!.costs.deploy).toBe(1);
    expect(g.ps[0]!.improved).toEqual(['produce']);
    g.turn = 0;
    g = play(
      g,
      { t: 'section', i: section('trade') },
      { t: 'trade', a: 'pop', b: 'pop' },
      { t: 'deploy', hex: w },
    );
    expect(g.ps[0]!.mechs).toBe(1);
    expect(g.units.some((u) => u.kind === 'mech' && u.at === w)).toBe(true);
    g.turn = 0;
    const pop = g.ps[0]!.popularity;
    g = play(
      g,
      { t: 'section', i: section('produce') },
      { t: 'done' },
      { t: 'build', hex: w, kind: 'monument' },
    );
    expect(g.ps[0]!.popularity).toBe(pop + 2);
    expect(g.structures).toEqual([{ hex: w, owner: 0, kind: 'monument' }]);
  });

  it('five stars end the game; scoring by popularity tier', () => {
    let g = quiet();
    g.ps[0]!.stars = ['combat', 'combat', 'mechs', 'recruits'];
    g.ps[0]!.power = 11;
    g.ps[0]!.coins = 5;
    g = play(g, { t: 'section', i: section('bolster') });
    expect(g.phase).toBe('over');
    expect(g.ps[0]!.stars).toHaveLength(STARS_TO_END);
    const s = scoreAll(g)[0]!;
    const t = tierOf(g.ps[0]!.popularity);
    expect(s.stars).toBe(STARS_TO_END * t.star);
    expect(s.territories).toBe(territories(g, 0) * t.territory);
    expect(tierOf(13).star).toBe(5);
  });

  it('random games end and stay valid', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let g = newIron(2 + (seed % 3), seed);
      const rng = new Rng(seed);
      let k = 0;
      while (g.phase !== 'over' && k++ < 50_000) {
        g = act(g, rng.pick(legalActions(g)));
        if (k % 30 === 0) expect(isValidIron(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.phase).toBe('over');
      expect(g.scores).toHaveLength(g.players);
    }
  }, 30_000);
});

describe('AI', () => {
  it('codes round-trip; observations hide the deck', () => {
    for (let n = 0; n < CODE.size; n += 3) expect(encode(decode(n)!)).toBe(n);
    const g = newIron(3, 2);
    for (const a of legalActions(g)) expect(decode(encode(a))).toEqual(a);
    const o = observe(g, 0);
    expect(o).not.toHaveProperty('rng');
    expect(o).not.toHaveProperty('deck');
    expect(o.deckSize).toBe(ENCOUNTERS.length);
  });

  it('the marshal beats recruits; recruits beat random play', () => {
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
    for (let seed = 1; seed <= 4; seed++) {
      const ids = seed % 2 ? ['marshal', 'recruit'] : ['recruit', 'marshal'];
      if (run(ids, seed).includes('marshal')) wins++;
    }
    // Even play would win 2 of 4.
    expect(wins).toBeGreaterThanOrEqual(3);
    for (let seed = 1; seed <= 3; seed++)
      expect(run(['random', 'recruit'], seed)).toContain('recruit');
  }, 400_000);
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 4 }],
  playouts: 2,
  maxSteps: 50_000,
  checkObservation: (s, seat) => {
    if (s.battle && s.battle.attacker !== seat)
      expect(observe(s, seat).battle!.attackBid).toBeNull();
  },
});
