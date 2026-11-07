import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { memoryFlip, MEMORY } from '../ai';
import { memoryEnv } from '../ai-adapter';
import { act, isValidMemory, legalActions, newMemory, observe, winners } from '../engine';

describe('Memory Pairs rules', () => {
  it('deals every face twice', () => {
    const g = newMemory('medium', 1, 3);
    expect(g.faces).toHaveLength(24);
    for (let f = 0; f < 12; f++) expect(g.faces.filter((x) => x === f)).toHaveLength(2);
  });

  it('a pair is taken and the player goes again; a miss passes the turn', () => {
    let g = newMemory('small', 2, 1);
    const a = 0;
    const twin = g.faces.findIndex((f, i) => i !== a && f === g.faces[a]);
    const other = g.faces.findIndex((f, i) => i !== a && f !== g.faces[a]);
    g = act(act(g, `flip:${a}`), `flip:${other}`);
    expect(g.turn).toBe(1);
    expect(g.last).toEqual([a, other]);
    g = act(act(g, `flip:${a}`), `flip:${twin}`);
    expect(g.taken[a] && g.taken[twin]).toBe(true);
    expect(g.pairs).toEqual([0, 1]);
    expect(g.turn).toBe(1);
    expect(legalActions(g)).not.toContain(`flip:${a}`);
  });

  it('faces stay hidden until turned over; saves replay', () => {
    let g = newMemory('small', 2, 4);
    expect(observe(g).faces.every((f) => f === -1)).toBe(true);
    g = act(g, 'flip:5');
    expect(observe(g).faces[5]).toBe(g.faces[5]);
    expect(observe(g).faces.filter((f) => f >= 0)).toHaveLength(1);
    expect(isValidMemory(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidMemory({ ...g, pairs: [3, 0] })).toBe(false);
  });
});

describe('Memory Pairs players', () => {
  const soloTurns = (span: number, size: string, seeds = 40) => {
    let total = 0;
    for (let s = 1; s <= seeds; s++) {
      let g = newMemory(size, 1, s);
      while (g.phase === 'play') g = act(g, `flip:${memoryFlip(g, span)}`);
      total += g.turns[0]!;
    }
    return total / seeds;
  };

  it('a remembered pair is taken at once', () => {
    let g = newMemory('small', 1, 2);
    const a = 0;
    const twin = g.faces.findIndex((f, i) => i !== a && f === g.faces[a]);
    const other = g.faces.findIndex((_, i) => i !== a && i !== twin);
    g = act(act(g, `flip:${a}`), `flip:${other}`);
    g = act(g, `flip:${twin}`);
    // The first card of this turn was the twin: its partner at `a` is remembered.
    expect(memoryFlip(g, MEMORY.perfect)).toBe(a);
  });

  it('better memories clear the grid in fewer turns and win', () => {
    const perfect = soloTurns(MEMORY.perfect, 'medium');
    const forgetful = soloTurns(MEMORY.forgetful, 'medium');
    expect(perfect).toBeLessThan(forgetful);
    let w = 0;
    for (let s = 1; s <= 40; s++) {
      let g = newMemory('small', 2, s);
      const me = s & 1;
      while (g.phase === 'play')
        g = act(g, `flip:${memoryFlip(g, g.turn === me ? MEMORY.perfect : MEMORY.forgetful)}`);
      if (winners(g).length === 1 && winners(g)[0] === me) w++;
    }
    expect(w).toBeGreaterThan(28);
  });
});

describeAdapterContract(memoryEnv, {
  configs: [undefined, { size: 'medium', players: 1 }, { size: 'large', players: 2 }],
  playouts: 2,
  maxSteps: 4000,
  illegalActions: (g) => ['jump', 'flip:99'].filter((a) => !legalActions(g).includes(a)),
});
