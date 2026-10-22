import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  MISERE_NIM,
  NIM,
  SUBTRACTION,
  WYTHOFF,
  applyHeapsAction,
  createHeapsState,
  isValidHeapsState,
  legalHeapsActions,
  setupFor,
} from '../engine';
import { heapsCodec } from '../environment';
import { HeapsSolver } from '../solver';

const xor = (heaps: number[]) => heaps.reduce((a, b) => a ^ b, 0);

describe('heap engine', () => {
  it('takes any amount from one heap in Nim, and only 1–3 in the subtraction game', () => {
    const s = createHeapsState([3, 1]);
    expect(legalHeapsActions(NIM, s)).toEqual(['0:1', '0:2', '0:3', '1:1']);
    expect(legalHeapsActions(SUBTRACTION, createHeapsState([5]))).toEqual(['0:1', '0:2', '0:3']);
    expect(legalHeapsActions(SUBTRACTION, createHeapsState([2]))).toEqual(['0:1', '0:2']);
  });

  it('adds equal takes from both heaps in Wythoff', () => {
    const moves = legalHeapsActions(WYTHOFF, createHeapsState([2, 3]));
    expect(moves.filter((a) => a.startsWith('b:'))).toEqual(['b:1', 'b:2']);
    expect(applyHeapsAction(WYTHOFF, createHeapsState([2, 3]), 'b:2').heaps).toEqual([0, 1]);
  });

  it('the last counter wins in normal play and loses in misère', () => {
    const normal = applyHeapsAction(NIM, createHeapsState([0, 2], 1), '1:2');
    expect(normal.result).toEqual({ winner: 1 });
    const misere = applyHeapsAction(MISERE_NIM, createHeapsState([0, 2], 1), '1:2');
    expect(misere.result).toEqual({ winner: 0 });
  });

  it('draws setups from the seed within each variant’s ranges', () => {
    for (let seed = 0; seed < 50; seed++) {
      const nim = setupFor(NIM, seed);
      expect(nim.length).toBeGreaterThanOrEqual(3);
      expect(nim.length).toBeLessThanOrEqual(5);
      expect(nim.every((n) => n >= 1 && n <= 9)).toBe(true);
      const [w0, w1] = setupFor(WYTHOFF, seed);
      expect(w0! >= 4 && w0! <= 15 && w1! >= 4 && w1! <= 15).toBe(true);
      const [single] = setupFor(SUBTRACTION, seed);
      expect(single! >= 15 && single! <= 30).toBe(true);
    }
    expect(setupFor(NIM, 7)).toEqual(setupFor(NIM, 7));
  });

  it('validates saves by replay and rejects edited heaps', () => {
    const s = applyHeapsAction(NIM, createHeapsState([3, 4, 5], 1), '2:2');
    expect(isValidHeapsState(NIM, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidHeapsState(NIM, { ...s, heaps: [3, 4, 1] })).toBe(false);
    expect(isValidHeapsState(NIM, { ...s, start: [] })).toBe(false);
  });

  it('encodes single-heap and both-heap moves to unique indices', () => {
    for (const a of ['0:1', '4:30', 'b:1', 'b:15', '2:9'])
      expect(heapsCodec.decode(heapsCodec.encode(a))).toBe(a);
  });
});

describe('heap solver (checked against the known theory)', () => {
  it('Nim: the side to move loses exactly when the nim-sum is zero', () => {
    const solver = new HeapsSolver(NIM);
    const rng = new Rng(3);
    for (let i = 0; i < 300; i++) {
      const heaps = Array.from({ length: rng.range(1, 5) }, () => rng.range(0, 9));
      expect(solver.wins(heaps)).toBe(xor(heaps) !== 0);
    }
  });

  it('Misère Nim: like Nim, except when every heap has at most one counter', () => {
    const solver = new HeapsSolver(MISERE_NIM);
    const rng = new Rng(4);
    for (let i = 0; i < 300; i++) {
      const heaps = Array.from({ length: rng.range(1, 5) }, () => rng.range(0, 6));
      const allSmall = heaps.every((n) => n <= 1);
      const ones = heaps.filter((n) => n === 1).length;
      expect(solver.wins(heaps)).toBe(allSmall ? ones % 2 === 0 : xor(heaps) !== 0);
    }
  });

  it('Wythoff: the lost positions are the golden-ratio pairs', () => {
    const solver = new HeapsSolver(WYTHOFF);
    const phi = (1 + Math.sqrt(5)) / 2;
    const cold = new Set<string>();
    for (let k = 0; k < 12; k++) {
      const a = Math.floor(k * phi);
      cold.add(`${a},${a + k}`);
      cold.add(`${a + k},${a}`);
    }
    for (let a = 0; a <= 15; a++)
      for (let b = 0; b <= 15; b++) expect(solver.wins([a, b])).toBe(!cold.has(`${a},${b}`));
  });

  it('Subtraction 1–3: the lost positions are the multiples of four', () => {
    const solver = new HeapsSolver(SUBTRACTION);
    for (let n = 0; n <= 30; n++) expect(solver.wins([n])).toBe(n % 4 !== 0);
  });
});
