import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { playMatch } from '../../../ai/evaluation/match';
import { AGENT_PRESETS } from '../ai';
import { renjuEnv } from '../ai-adapter';
import { isForbiddenForBlack } from '../forbidden';
import { CENTER, SIZE, isLegalRenju, legalRenju, playRenju, replayRenju } from '../rules';

const at = (r: number, c: number) => r * SIZE + c;
const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(renjuEnv, {
  configs: [undefined],
  playouts: 12,
  illegalActions: (s) =>
    s.history.length === 0 ? [at(0, 0), -1] : [-1, 225, ...s.history.slice(0, 2)],
});

describe('Renju rules', () => {
  it('requires Black’s first stone on the center point', () => {
    const s = replayRenju([]);
    expect(legalRenju(s)).toEqual([CENTER]);
    expect(isLegalRenju(s, at(0, 0))).toBe(false);
    expect(() => playRenju(s, at(3, 3))).toThrow();
  });

  it('rejects Black’s forbidden points and allows White there', () => {
    // Build a 3-3 point for Black at (7,9) with White stones far away.
    const history = [CENTER, at(0, 0), at(7, 8), at(0, 2), at(5, 9), at(0, 4), at(6, 9), at(0, 6)];
    const s = replayRenju(history);
    expect(s.toMove).toBe(0);
    expect(isForbiddenForBlack(s.board, SIZE, at(7, 9))).toBe(true);
    expect(isLegalRenju(s, at(7, 9))).toBe(false);
    expect(() => playRenju(s, at(7, 9))).toThrow(/forbidden/);
    const whiteTurn = playRenju(s, at(14, 14));
    expect(isLegalRenju(whiteTurn, at(7, 9))).toBe(true);
  });

  it('Black wins with exactly five; White wins with an overline', () => {
    const black = [
      CENTER,
      at(0, 0),
      at(7, 8),
      at(0, 2),
      at(7, 9),
      at(0, 4),
      at(7, 10),
      at(0, 6),
      at(7, 11),
    ];
    const won = replayRenju(black);
    expect(won.result).toMatchObject({
      kind: 'win',
      winner: 0,
      line: [at(7, 7), at(7, 8), at(7, 9), at(7, 10), at(7, 11)],
    });
    // White builds O O O . O O on row 0, then fills the gap → six → White wins.
    const white = [
      CENTER,
      at(0, 0),
      at(9, 9),
      at(0, 1),
      at(3, 12),
      at(0, 2),
      at(11, 3),
      at(0, 4),
      at(13, 13),
      at(0, 5),
      at(2, 2),
      at(0, 3),
    ];
    const over = replayRenju(white);
    expect(over.result).toMatchObject({ kind: 'win', winner: 1 });
    expect(over.result?.kind === 'win' && over.result.line).toHaveLength(6);
  });

  it('no agent ever plays a forbidden point (seeded games)', () => {
    for (const [a, b] of [
      ['medium', 'easy'],
      ['hard', 'medium'],
    ] as const) {
      const result = playMatch(renjuEnv, [preset(a), preset(b)], { seed: 7 });
      let s = replayRenju([]);
      for (const move of result.actions) {
        if (s.toMove === 0) expect(isForbiddenForBlack(s.board, SIZE, move)).toBe(false);
        s = playRenju(s, move);
      }
      expect(result.outcome).not.toBeNull();
    }
  }, 60_000);
});
