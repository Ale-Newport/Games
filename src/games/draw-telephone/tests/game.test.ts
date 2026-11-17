import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { loadDoodles, loadModel } from '../../shared/doodle/doodle';
import { loadVectors } from '../../shared/semantic/semantic';
import { applyChain, env } from '../ai-adapter';
import { botDescribe, botDraw, botSentence, subjectOf } from '../bots';
import { chainFor, cleanText, handIn, newGame, received, stepKind, type Entry } from '../engine';

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i}`, bot: false }));

describe('Draw Telephone rules', () => {
  it('passes every chain round the table, alternating draw and describe', () => {
    let s = newGame('en', people(4));
    expect(stepKind(0)).toBe('write');
    expect(stepKind(1)).toBe('draw');
    expect(stepKind(2)).toBe('describe');
    for (let p = 0; p < 4; p++) s = handIn(s, p, { kind: 'text', text: `S${p}`, by: p });
    expect(s.step).toBe(1);
    const got = received(s, 1);
    expect(got).toMatchObject({ kind: 'text', text: 'S0' });
    expect(chainFor(s, 1)).toBe(0);
    for (let step = 1; step < 4; step++)
      for (let p = 0; p < 4; p++) {
        const e: Entry =
          stepKind(step) === 'draw'
            ? {
                kind: 'drawing',
                strokes: [
                  [
                    [1, 2],
                    [3, 4],
                  ],
                ],
                by: p,
              }
            : { kind: 'text', text: 'x', by: p };
        s = handIn(s, p, e);
      }
    expect(s.status).toBe('album');
    for (const ch of s.chains) {
      expect(ch).toHaveLength(4);
      expect(new Set(ch.map((e) => e.by)).size).toBe(4);
    }
    expect(() =>
      handIn(newGame('en', people(3)), 0, { kind: 'drawing', strokes: [], by: 0 }),
    ).toThrow();
    expect(cleanText('   ', 'blank')).toBe('blank');
  });

  it('lets bots write, draw by meaning and describe', async () => {
    const [doodles, model, vectors] = await Promise.all([
      loadDoodles(),
      loadModel(),
      loadVectors(),
    ]);
    const rng = new Rng(3);
    const { text, subject } = botSentence('en', rng);
    expect(text.length).toBeGreaterThan(3);
    expect(subjectOf(text, vectors, rng)).toBe(subject);
    expect(subjectOf('a happy puppy', vectors, rng)).toBe('dog');
    expect(subjectOf('Una mariposa en la playa', vectors, rng)).toBe('butterfly');
    const drawing = botDraw('a cat on holiday', doodles, vectors, rng);
    expect(drawing.length).toBeGreaterThan(0);
    expect(botDescribe(model, drawing, 'en', new Rng(1))).toMatch(/^a /);
  });
});

describe('Draw Telephone AI', () => {
  it('keeps the message alive more often with the recognizer than at random', async () => {
    const { MODEL } = await import('../ai-adapter');
    const { classify } = await import('../../shared/doodle/doodle');
    let kept = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let s = env.createInitialState({ length: 6 }, seed);
      while (s.status === 'playing')
        s = applyChain(s, `d:${classify(MODEL, s.drawing, 1)[0]!.label}`);
      kept += env.getReward(s, 0);
    }
    expect(kept / 20).toBeGreaterThan(0.5);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { length: 8 }],
  playouts: 3,
  maxSteps: 10,
  illegalActions: () => ['d:not-a-thing', 'pass' as never],
});
