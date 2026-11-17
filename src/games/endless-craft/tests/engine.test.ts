import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { AGENT_PRESETS, BUDGET, craftActions, env } from '../ai-adapter';
import { RECIPE_ROWS } from '../data';
import {
  combine,
  combineIds,
  dropOn,
  duplicate,
  ELEMENT_IDS,
  ELEMENTS,
  isCraft,
  moveChip,
  newCraft,
  place,
  reachable,
  removeChip,
  RECIPES,
} from '../engine';

describe('Endless Craft recipe book', () => {
  it('names every ingredient and result, has no conflicting pairs, and everything is reachable', () => {
    const seen = new Set<string>();
    for (const line of RECIPE_ROWS.trim().split('\n')) {
      const [lhs, out] = line.split('=');
      const parts = lhs!.split('+');
      expect(parts).toHaveLength(2);
      for (const p of [...parts, out!]) expect(ELEMENTS[p], `${p} in ${line}`).toBeDefined();
      const key = [...parts].sort().join('+');
      expect(seen.has(key), line).toBe(false);
      seen.add(key);
    }
    expect(RECIPES.size).toBe(seen.size);
    expect(reachable().size).toBe(ELEMENT_IDS.length);
    for (const e of Object.values(ELEMENTS)) {
      expect(e.emoji.length).toBeGreaterThan(0);
      expect(e.en.length).toBeGreaterThan(0);
      expect(e.es.length).toBeGreaterThan(0);
    }
  });

  it('combines in either order', () => {
    expect(combine('water', 'fire')).toBe('steam');
    expect(combine('fire', 'water')).toBe('steam');
    expect(combine('cat', 'sushi')).toBeNull();
  });
});

describe('Endless Craft workspace', () => {
  it('drops a chip on another to make a discovery where the target was', () => {
    let c = newCraft();
    const water = c.chips.find((k) => k.id === 'water')!;
    const fire = c.chips.find((k) => k.id === 'fire')!;
    c = dropOn(c, water.uid, fire.uid);
    expect(c.found).toContain('steam');
    expect(c.last).toEqual({ a: 'water', b: 'fire', out: 'steam', fresh: true });
    const steam = c.chips.find((k) => k.id === 'steam')!;
    expect([steam.x, steam.y]).toEqual([fire.x, fire.y]);
    expect(c.chips.some((k) => k.uid === water.uid || k.uid === fire.uid)).toBe(false);
    // Making it again is not new.
    c = place(place(c, 'water', 0.1, 0.1), 'fire', 0.2, 0.2);
    const [w2, f2] = c.chips.slice(-2);
    c = dropOn(c, w2!.uid, f2!.uid);
    expect(c.last?.fresh).toBe(false);
    expect(c.found.filter((x) => x === 'steam')).toHaveLength(1);
  });

  it('unknown pairs leave both chips; chips move, duplicate and go away; only discoveries can be placed', () => {
    let c = newCraft();
    c = place(c, 'water', 0.5, 0.5);
    const [a, b] = c.chips.filter((k) => k.id === 'water');
    c = dropOn(c, a!.uid, b!.uid);
    expect(c.found).toContain('lake');
    let d = newCraft();
    const earth = d.chips.find((k) => k.id === 'earth')!;
    d = place(d, 'earth', 0.3, 0.3);
    d = combineIds(d, 'earth', 'earth');
    expect(d.found).toContain('mountain');
    const n = d.chips.length;
    d = duplicate(d, earth.uid);
    expect(d.chips).toHaveLength(n + 1);
    d = moveChip(d, earth.uid, 5, -1);
    expect(d.chips.find((k) => k.uid === earth.uid)).toMatchObject({ x: 0.98, y: 0.02 });
    d = removeChip(d, earth.uid);
    expect(d.chips.some((k) => k.uid === earth.uid)).toBe(false);
    expect(place(d, 'dragon', 0.5, 0.5)).toBe(d);
    expect(isCraft(d)).toBe(true);
    expect(isCraft({ ...d, found: ['nope'] })).toBe(false);
  });
});

describe('Endless Craft environment', () => {
  it('offers untried pairs and the recipe book agent discovers everything', () => {
    let c = env.createInitialState({}, 1);
    expect(craftActions(c)).toHaveLength(10);
    const oracle = AGENT_PRESETS.find((a) => a.id === 'recipe-book')!.create();
    while (!env.isTerminal(c))
      c = env.applyAction(
        c,
        oracle.selectAction(env, c, 0, { rng: null as never, timeLimitMs: 0 } as never),
      );
    expect(c.found).toHaveLength(ELEMENT_IDS.length);
    expect(c.tried.length).toBeLessThanOrEqual(BUDGET);
  });
});

describeAdapterContract(env, { configs: [{}], playouts: 2, maxSteps: BUDGET + 1 });
