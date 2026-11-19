import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import { loadVectors } from '../../shared/semantic/semantic';
import { subjectOf } from '../bots';

describe('Draw Telephone in Spanish', () => {
  it('finds the subject of a Spanish sentence by meaning with Spanish vectors', async () => {
    const es = await loadVectors('es');
    // No class name appears in the sentence: "puppy" must lead to the dog class.
    expect(subjectOf('un cachorro ladrando', es, new Rng(1))).toBe('dog');
    // Names with ñ and accents still match directly.
    expect(subjectOf('el niño come una hamburguesa', es, new Rng(1))).toBe('hamburger');
  });
});
