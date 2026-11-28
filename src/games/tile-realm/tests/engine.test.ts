import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { AGENT_PRESETS, decode, encode, env, observe } from '../ai-adapter';
import {
  act,
  analyze,
  boardIndex,
  fits,
  isLegal,
  isValidRealm,
  legalActions,
  newRealm,
  placements,
  wardenSpots,
  WARDENS,
  type Realm,
} from '../engine';
import { START_TYPE, TILE_TYPES, TOTAL_TILES, sides } from '../tiles';

const T = (id: string) => TILE_TYPES.findIndex((t) => t.id === id);
/** A two-player game holding only the start tile, with `tile` in hand. */
function fresh(tile: string, bag: string[] = ['road-straight', 'road-curve', 'road-curve']): Realm {
  const g = newRealm(2, 1);
  g.board = [{ x: 0, y: 0, type: START_TYPE, rot: 0 }];
  g.current = T(tile);
  g.bag = bag.map(T);
  g.log = [];
  return g;
}

describe('tiles', () => {
  it('69 tiles of 22 types; every port belongs to exactly one feature', () => {
    expect(TOTAL_TILES).toBe(69);
    expect(TILE_TYPES).toHaveLength(22);
    for (const t of TILE_TYPES) {
      const ports = t.features.flatMap((f) => f.ports).sort((a, b) => a - b);
      expect(ports).toEqual(Array.from({ length: 12 }, (_, i) => i));
      for (const f of t.features) {
        // Towns own whole sides; meadows only touch towns of their own tile.
        if (f.kind === 'town') for (const p of f.ports) expect(f.ports).toContain(p - (p % 3));
        for (const c of f.touches ?? []) expect(t.features[c]!.kind).toBe('town');
      }
    }
  });

  it('rotation turns the sides clockwise', () => {
    for (let i = 0; i < TILE_TYPES.length; i++)
      for (let r = 0; r < 4; r++)
        for (let s = 0; s < 4; s++) expect(sides(i, r)[s]).toBe(sides(i, 0)[(s - r + 4) % 4]);
    expect(sides(START_TYPE, 0)).toEqual(['town', 'road', 'meadow', 'road']);
  });

  it('a new game: the start tile down, a shuffled bag of the rest, a tile in hand', () => {
    const g = newRealm(3, 7);
    expect(g.board).toHaveLength(1);
    expect(g.bag.length + 1).toBe(TOTAL_TILES - 1);
    expect(g).toEqual(newRealm(3, 7));
    expect(newRealm(3, 8).bag).not.toEqual(g.bag);
    expect(() => newRealm(6, 1)).toThrow();
  });
});

describe('placing', () => {
  it('sides must match every neighbour, and the tile must touch the board', () => {
    const g = fresh('town-cap');
    const idx = boardIndex(g);
    // The start tile's town faces north: a town cap above must face south.
    expect(fits(g, idx, 0, -1, T('town-cap'), 2)).toBe(true);
    expect(fits(g, idx, 0, -1, T('town-cap'), 0)).toBe(false);
    expect(fits(g, idx, 5, 5, T('town-cap'), 0)).toBe(false);
    expect(fits(g, idx, 0, 0, T('town-cap'), 0)).toBe(false);
    // A crossroads only fits beside the start's two road ends, in any rotation.
    expect(placements(g, T('road-cross'))).toEqual([
      [-1, 0, 0],
      [-1, 0, 1],
      [-1, 0, 2],
      [-1, 0, 3],
      [1, 0, 0],
      [1, 0, 1],
      [1, 0, 2],
      [1, 0, 3],
    ]);
  });

  it('a town closed by two tiles scores 2 a tile for its warden; the warden comes back', () => {
    let g = fresh('town-cap');
    g.wardens = [{ tile: 0, feature: 0, p: 0 }];
    g = act(g, { t: 'place', x: 0, y: -1, r: 2, warden: null });
    expect(g.scores).toEqual([4, 0]);
    expect(g.wardens).toEqual([]);
    expect(g.log.some((e) => e.k === 'score' && e.kind === 'town' && e.points === 4)).toBe(true);
    expect(g.turn).toBe(1);
  });

  it('a road between two junctions scores 1 a tile; a warden cannot join a held road', () => {
    let g = fresh('road-junction', ['road-junction', 'road-curve']);
    g.wardens = [{ tile: 0, feature: 1, p: 1 }];
    // The junction east of the start continues its road: no warden on that road end.
    const spots = wardenSpots(g, 1, 0, T('road-junction'), 0);
    expect(spots).not.toContain(2); // feature 2 = its west road end
    expect(spots).toContain(0); // its east road end is a separate road
    g = act(g, { t: 'place', x: 1, y: 0, r: 0, warden: 0 });
    expect(g.scores).toEqual([0, 0]);
    g = act(g, { t: 'place', x: -1, y: 0, r: 0, warden: null });
    expect(g.scores).toEqual([0, 3]);
    expect(g.wardens).toEqual([{ tile: 1, feature: 0, p: 0 }]);
  });

  it('a tie on a feature pays everyone tied', () => {
    let g = fresh('road-junction', ['road-junction', 'road-curve']);
    // Two road pieces, each held by one player, already joined; the last tile closes the road.
    g.board.push({ x: 1, y: 0, type: T('road-junction'), rot: 0 });
    g.wardens = [
      { tile: 0, feature: 1, p: 0 },
      { tile: 1, feature: 2, p: 1 },
    ];
    g = act(g, { t: 'place', x: -1, y: 0, r: 0, warden: null });
    expect(g.scores).toEqual([3, 3]);
    expect(g.wardens).toEqual([]);
    expect(isValidRealm(g)).toBe(true);
  });

  it('a shrine surrounded on all eight sides scores 9', () => {
    const g = fresh('road-straight');
    g.board = [{ x: 0, y: 0, type: T('shrine'), rot: 0 }];
    for (const [x, y] of [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
    ])
      g.board.push({ x: x!, y: y!, type: T('shrine'), rot: 0 });
    g.wardens = [{ tile: 0, feature: 0, p: 1 }];
    g.current = T('shrine');
    const n = act(g, { t: 'place', x: 1, y: 1, r: 0, warden: null });
    expect(n.scores).toEqual([0, 9]);
    expect(n.wardens).toEqual([]);
  });

  it('a tile that fits nowhere is set aside and the next one drawn', () => {
    let g = fresh('town-cap', ['road-cross', 'town-cap']);
    g.board = [{ x: 0, y: 0, type: T('town-full'), rot: 0 }];
    g = act(g, { t: 'place', x: 0, y: -1, r: 2, warden: null });
    expect(g.log.some((e) => e.k === 'discard' && e.type === T('road-cross'))).toBe(true);
    expect(g.current).toBe(T('town-cap'));
    expect(placements(g, T('road-cross'))).toEqual([]);
  });
});

describe('the end', () => {
  it('unfinished features score half; meadows score 3 per finished town they border', () => {
    // Last tile closes the start's town; a meadow warden and a road warden wait for the end.
    let g = fresh('town-cap', []);
    g.wardens = [
      { tile: 0, feature: 3, p: 0 }, // the start's southern meadow: borders no town, 0
      { tile: 0, feature: 2, p: 1 }, // the northern meadow strip, beside the town: 3
      { tile: 0, feature: 1, p: 0 }, // the road, unfinished: 1
    ];
    g = act(g, { t: 'place', x: 0, y: -1, r: 2, warden: null });
    expect(g.phase).toBe('over');
    // Town (unheld) closed: nobody scores it. Meadow 1 borders it: 3 for player 1.
    expect(g.scores).toEqual([1, 3]);
    expect(g.winners).toEqual([1]);
    expect(env.getOutcome(g)!.returns).toEqual([0, 1]);
  });

  it('random games run to the end with every warden accounted for', () => {
    for (let seed = 1; seed <= 3; seed++) {
      let g = newRealm(2 + seed, seed);
      const rng = new Rng(seed);
      let turns = 0;
      while (g.phase !== 'over') {
        g = act(g, rng.pick(legalActions(g)));
        turns++;
        for (let p = 0; p < g.players; p++)
          expect(g.wardens.filter((w) => w.p === p).length).toBeLessThanOrEqual(WARDENS);
        if (turns % 10 === 0) expect(isValidRealm(JSON.parse(JSON.stringify(g)))).toBe(true);
      }
      expect(g.board.length + g.log.filter((e) => e.k === 'discard').length).toBeLessThanOrEqual(
        TOTAL_TILES,
      );
      expect(g.wardens).toEqual([]);
      const a = analyze(g);
      expect(a.features.size).toBeGreaterThan(g.board.length);
    }
  });
});

describe('AI', () => {
  it('codes round-trip; observations hide the bag order', () => {
    const g = newRealm(2, 3);
    for (const a of legalActions(g)) {
      expect(decode(encode(a))).toEqual(a);
      expect(isLegal(g, a)).toBe(true);
    }
    const o = observe(g, 0);
    expect(o).not.toHaveProperty('bag');
    expect(o.left.reduce((s, x) => s + x, 0)).toBe(g.bag.length);
  });

  it('the master beats apprentices; the apprentice beats random play', () => {
    const play = (ids: string[], seed: number) => {
      const agents = ids.map((id) => AGENT_PRESETS.find((a) => a.id === id)!.create());
      let s = env.createInitialState({ players: ids.length }, seed);
      const rng = new Rng(seed * 5);
      while (!env.isTerminal(s)) {
        const p = env.getCurrentPlayer(s);
        s = env.applyAction(s, agents[p]!.selectAction(env, s, p, { rng }));
      }
      return s.winners.map((w) => ids[w]!);
    };
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const ids = ['apprentice', 'apprentice'];
      ids.splice(seed % 3, 0, 'master');
      if (play(ids, seed).includes('master')) wins++;
    }
    // One seat in three: even play would win 4 of 12.
    expect(wins).toBeGreaterThanOrEqual(8);
    for (let seed = 1; seed <= 3; seed++)
      expect(play(['random', 'apprentice'], seed)).toContain('apprentice');
  }, 90_000);

  it('the master takes a free completed town over a random spot', () => {
    const g = fresh('town-cap');
    g.wardens = [{ tile: 0, feature: 0, p: 0 }];
    const a = decide(g, 'master', new Rng(1));
    expect([a.x, a.y, a.r]).toEqual([0, -1, 2]);
  });
});

describeAdapterContract(env, {
  configs: [{ players: 2 }, { players: 4 }],
  playouts: 1,
  maxSteps: 200,
  checkObservation: (s) => {
    expect(observe(s, 0).board).toEqual(s.board);
  },
});
