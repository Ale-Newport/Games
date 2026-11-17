import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import type { RaceAction } from '../sim';
import { env } from '../ai-adapter';
import { DEF } from '../definition';
import { manifest } from '../manifest';
import { TRACKS } from '../sim';

describe('top-down-racing setup', () => {
  it('binds the rules and the manifest', () => {
    expect(manifest.id).toBe(env.id);
    expect(env.createInitialState(undefined, 1).state.cars).toHaveLength(4);
  });

  it('offers every circuit, each named and described in English and Spanish', () => {
    expect(DEF.options[0]!.values).toEqual(TRACKS);
    for (const locale of ['en', 'es'] as const)
      for (const t of TRACKS) {
        expect(DEF.strings[locale][`track.${t}`]).toBeTruthy();
        expect(DEF.strings[locale][`track.${t}.hint`]).toBeTruthy();
      }
    for (const t of TRACKS) expect(DEF.init(1, { track: t }).track).toBe(t);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['fly', 'dive'] as unknown as RaceAction[],
});
