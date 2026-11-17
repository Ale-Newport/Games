import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env, medianGuess } from '../ai-adapter';
import { CATEGORIES, ITEMS } from '../data';
import { guess, isRight, isRun, itemA, itemB, MODES, newRun } from '../engine';

describe('Higher or Lower decks', () => {
  it('every category has plenty of cards with positive numbers and names in both languages', () => {
    for (const c of CATEGORIES) {
      expect(ITEMS[c].length).toBeGreaterThan(40);
      for (const i of ITEMS[c]) {
        expect(i.value).toBeGreaterThan(0);
        expect(i.en && i.es).toBeTruthy();
        expect(i.flag ?? i.emoji).toBeTruthy();
      }
    }
    expect(ITEMS.mountains.find((m) => m.en === 'Mount Everest')!.value).toBe(8849);
  });
});

describe('Higher or Lower runs', () => {
  it('a right guess scores and moves the card across; a wrong one ends the run', () => {
    let r = newRun(1, 'mountains');
    const right = isRight(r, 'higher') ? 'higher' : 'lower';
    const wrong = right === 'higher' ? 'lower' : 'higher';
    const b = r.b;
    r = guess(r, right);
    expect(r.score).toBe(1);
    expect(r.a).toBe(b);
    expect(r.b).not.toBe(b);
    expect(itemA(r).value).not.toBe(itemB(r).value);
    const w = isRight(r, wrong) ? right : wrong;
    r = guess(r, w);
    expect(r.over).toBe(true);
    expect(r.score).toBe(1);
  });

  it('long runs never repeat a card back to back and mix mode changes category', () => {
    for (const mode of MODES) {
      let r = newRun(7, mode);
      const cats = new Set<string>();
      for (let i = 0; i < 120; i++) {
        cats.add(itemA(r).cat);
        expect(r.a).not.toBe(r.b);
        expect(itemA(r).cat).toBe(itemB(r).cat);
        r = guess(r, isRight(r, 'higher') ? 'higher' : 'lower');
      }
      expect(r.score).toBe(120);
      expect(isRun(r)).toBe(true);
      if (mode === 'mix') expect(cats.size).toBeGreaterThan(2);
    }
  });

  it('the median player beats a coin flip on average', () => {
    let total = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let r = newRun(seed, 'population');
      while (!r.over && r.score < 100) r = guess(r, medianGuess(r));
      total += r.score;
    }
    expect(total / 40).toBeGreaterThan(1.5);
  });
});

describeAdapterContract(env, {
  configs: [{ mode: 'animals' }, { mode: 'mix' }],
  playouts: 3,
  maxSteps: 101,
});
