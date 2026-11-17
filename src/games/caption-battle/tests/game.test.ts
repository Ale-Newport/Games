import { describe, expect, it } from 'vitest';
import {
  botCaption,
  botRating,
  newGame,
  nextRound,
  round,
  roundScores,
  setCaption,
  setRating,
  totals,
} from '../engine';
import { SCENES } from '../scenes';

describe('Caption Battle', () => {
  it('has original scenes with bot captions in both languages', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(8);
    for (const sc of SCENES) {
      expect(sc.captions.en.length).toBeGreaterThanOrEqual(4);
      expect(sc.captions.es.length).toBe(sc.captions.en.length);
    }
  });

  it('collects captions, ratings and scores a round with the best-caption bonus', () => {
    let s = newGame('en', ['Ana', 'Ben'], 2, 3, 9);
    expect(s.players).toHaveLength(4);
    s = setCaption(s, 0, '  me   when the code compiles  ');
    s = setCaption(s, 1, '');
    expect(round(s).captions[0]).toBe('me when the code compiles');
    expect(round(s).captions[1]).toBe('…');
    s = setCaption(s, 2, botCaption(s, 2));
    s = setCaption(s, 3, botCaption(s, 3));
    expect(s.phase).toBe('rate');
    expect(round(s).captions[2]).not.toBe(round(s).captions[3]);
    for (let rater = 0; rater < 4; rater++)
      for (let author = 0; author < 4; author++) {
        if (rater === author) continue;
        const stars = rater < 2 ? (author === 0 ? 5 : 2) : botRating(s, rater, author);
        expect(stars).toBeGreaterThanOrEqual(1);
        expect(stars).toBeLessThanOrEqual(5);
        s = setRating(s, rater, author, stars);
      }
    expect(s.phase).toBe('results');
    const sc = roundScores(round(s));
    expect(sc[0]).toBeGreaterThanOrEqual(5 + 3);
    expect(totals(s)).toEqual(sc);
    s = nextRound(s);
    expect(s.phase).toBe('caption');
    expect(s.history[1]!.scene).not.toBe(s.history[0]!.scene);
  });

  it('bots like relatable captions more than one-word ones', () => {
    let s = newGame('en', ['A', 'B'], 3, 3, 4);
    s = setCaption(s, 0, 'me when the wifi drops during the meeting');
    s = setCaption(s, 1, 'lol');
    let a = 0;
    let b = 0;
    for (let bot = 2; bot < 5; bot++) {
      a += botRating(s, bot, 0);
      b += botRating(s, bot, 1);
    }
    expect(a).toBeGreaterThan(b);
  });
});

import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { captionActions, crowdPleaser, env } from '../ai-adapter';

describe('Caption Battle environment', () => {
  it('rewards the crowd pleaser more than random lines', () => {
    let smart = 0;
    let rand = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = env.createInitialState(undefined, seed);
      smart += env.getReward(env.applyAction(s, crowdPleaser(s)), 0);
      rand += env.getReward(env.applyAction(s, new Rng(seed).pick(captionActions(s))), 0);
    }
    expect(smart).toBeGreaterThan(rand);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { lang: 'es' }],
  playouts: 3,
  maxSteps: 3,
  illegalActions: () => ['c:99' as never, 'c:-1' as never],
});
