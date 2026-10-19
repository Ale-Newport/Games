import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { gravityFromHistory } from '../../shared/gravity/engine';
import { AGENT_PRESETS } from '../ai';
import { c5Env } from '../ai-adapter';
import { C5, winningRunLength, wonDiagonally } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(c5Env, {
  configs: [undefined, { firstPlayer: 1 }],
  playouts: 80,
  illegalActions: (s) => [-1, 9, ...s.heights.flatMap((h, c) => (h >= C5.rows ? [c] : []))],
});

describe('Connect Five Gravity', () => {
  it('needs five: four does not win, five and six do', () => {
    expect(gravityFromHistory(C5, [0, 0, 1, 1, 2, 2, 3]).result).toBeNull();
    const five = gravityFromHistory(C5, [0, 0, 1, 1, 2, 2, 3, 3, 4]);
    expect(five.result).toMatchObject({ kind: 'win', winner: 0 });
    expect(winningRunLength(five)).toBe(5);
    // Red builds 0,1 and 3,4 on the bottom, then fills 2 → a run of five; with 5 too → six.
    const six = gravityFromHistory(C5, [0, 0, 1, 1, 3, 3, 4, 4, 5, 8, 2]);
    expect(winningRunLength(six)).toBe(6);
  });

  it('wins vertically and diagonally', () => {
    expect(gravityFromHistory(C5, [0, 1, 0, 1, 0, 1, 0, 1, 0]).result).toMatchObject({
      kind: 'win',
      winner: 0,
    });
    // Rising diagonal for Red from (6,0) to (2,4).
    const diag = gravityFromHistory(C5, [0, 1, 1, 2, 2, 3, 2, 3, 3, 4, 3, 4, 4, 8, 4, 8, 4]);
    expect(diag.result?.kind).toBe('win');
    expect(wonDiagonally(diag)).toBe(true);
  });

  it('declares a 9-column action space and a [3,7,9] observation', () => {
    expect(c5Env.info.actionSpaceSize).toBe(9);
    expect(c5Env.getObservationTensor!(gravityFromHistory(C5, [4]), 0).data).toHaveLength(189);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(c5Env, preset('easy'), preset('random'), { games: 20, seed: 1 })
      .agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(17);
    const medium = evaluateAgents(c5Env, preset('medium'), preset('easy'), { games: 12, seed: 1 })
      .agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses * 3);
  }, 60_000);
});
