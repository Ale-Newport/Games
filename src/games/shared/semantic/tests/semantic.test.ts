import { describe, expect, it } from 'vitest';
import { loadVectors, lookup, rankAll, similarity } from '../semantic';

describe('semantic vectors', () => {
  it('loads 30,000 words with meaningful neighbours', async () => {
    const v = await loadVectors();
    expect(v.words.length).toBe(30000);
    expect(v.dims).toBe(160);
    const dog = lookup(v, 'dog')!;
    const ranks = rankAll(v, dog);
    expect(ranks[dog]).toBe(1);
    expect(ranks[lookup(v, 'cat')!]).toBeLessThan(10);
    expect(ranks[lookup(v, 'puppy')!]).toBeLessThan(30);
    expect(ranks[lookup(v, 'algebra')!]).toBeGreaterThan(5000);
    expect(similarity(v, dog, dog)).toBeGreaterThan(0.95);
  });

  it('folds plurals and rejects non-words', async () => {
    const v = await loadVectors();
    expect(lookup(v, 'Dogs')).toBe(lookup(v, 'dog'));
    expect(lookup(v, 'berries')).toBe(lookup(v, 'berry'));
    expect(lookup(v, 'boxes')).toBe(lookup(v, 'box'));
    expect(lookup(v, 'qwzxv')).toBeNull();
    expect(lookup(v, '12')).toBeNull();
  });
});
