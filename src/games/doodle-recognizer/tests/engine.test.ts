import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { classify } from '../../shared/doodle/doodle';
import { DOODLES, env, MODEL, networkAction } from '../ai-adapter';
import {
  current,
  finishRound,
  giveUp,
  newGame,
  over,
  recognizes,
  ROUNDS,
  score,
  wordName,
} from '../engine';

describe('Doodle Recognizer rounds', () => {
  it('deals six different words and scores recognized rounds', () => {
    let g = newGame(3);
    expect(new Set(g.words).size).toBe(ROUNDS);
    const w = current(g)!;
    const doodle = DOODLES[w]![0]!;
    const guesses = classify(MODEL, doodle, 3);
    g = finishRound(g, doodle, [{ label: w, p: 0.9 }, ...guesses], 4200);
    expect(g.rounds[0]).toMatchObject({ word: w, recognized: true, ms: 4200 });
    g = giveUp(g, [], []);
    expect(g.rounds[1]!.recognized).toBe(false);
    while (!over(g)) g = giveUp(g, [], []);
    expect(score(g)).toBe(1);
    expect(recognizes([{ label: 'cat', p: 0.1 }], 'cat')).toBe(false);
    expect(wordName('light bulb', 'es')).toBe('bombilla');
  });

  it('the network recognizes most real doodles of their word', () => {
    let right = 0;
    let total = 0;
    for (const [word, list] of Object.entries(DOODLES))
      for (const d of list.slice(0, 3)) {
        total++;
        if (recognizes(classify(MODEL, d, 3), word)) right++;
      }
    expect(right / total).toBeGreaterThan(0.6);
  });
});

describe('Doodle Recognizer environment', () => {
  it('the network wins most rounds while the doodles are drawn', () => {
    let won = 0;
    for (let seed = 1; seed <= 5; seed++) {
      let s = env.createInitialState({}, seed);
      while (!env.isTerminal(s)) s = env.applyAction(s, networkAction(s));
      won += env.getOutcome(s)!.returns[0]!;
    }
    expect(won / 30).toBeGreaterThan(0.6);
  });
});

describeAdapterContract(env, { configs: [{}], playouts: 2, maxSteps: 61 });
