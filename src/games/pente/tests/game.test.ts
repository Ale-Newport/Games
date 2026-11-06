import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS } from '../ai';
import { penteEnv } from '../ai-adapter';
import { CENTER, SIZE, createState, play, replay, type PenteState } from '../engine';
import { hadDoubleCapture, wonByCaptures } from '../rules';

const at = (r: number, c: number) => r * SIZE + c;
const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(penteEnv, {
  configs: [undefined],
  playouts: 8,
  illegalActions: (s) =>
    s.history.length === 0
      ? [at(0, 0)]
      : [-1, 361, ...s.history.slice(-1).filter((i) => s.board[i] !== 0)],
});

function position(
  stones: [number, 1 | 2][],
  toMove: 0 | 1,
  captures: [number, number] = [0, 0],
): PenteState {
  const s = createState();
  for (const [i, v] of stones) s.board[i] = v;
  return { ...s, toMove, captures, history: [1, 2, 3, 4] };
}

describe('Pente agents', () => {
  it('every level blocks an open four and takes a winning capture', () => {
    const four = position(
      [
        [at(9, 6), 1],
        [at(9, 7), 1],
        [at(9, 8), 1],
        [at(9, 9), 1],
        [at(3, 3), 2],
        [at(3, 5), 2],
      ],
      1,
    );
    for (const id of ['medium', 'hard']) {
      const block = preset(id).selectAction(penteEnv, four, 1, { rng: new Rng(1) });
      expect([at(9, 5), at(9, 10)], id).toContain(block);
    }
    const capture = position(
      [
        [at(5, 5), 1],
        [at(5, 6), 2],
        [at(5, 7), 2],
        [at(12, 12), 2],
      ],
      0,
      [4, 0],
    );
    for (const id of ['easy', 'medium', 'hard']) {
      const agent = preset(id);
      // Easy has randomness: try several seeds and require the winning capture most of the time.
      let wins = 0;
      for (let seed = 0; seed < 10; seed++)
        if (play(capture, agent.selectAction(penteEnv, capture, 0, { rng: new Rng(seed) })).result)
          wins++;
      expect(wins, id).toBeGreaterThanOrEqual(id === 'easy' ? 6 : 10);
    }
  });

  it('levels are ordered (seeded, reproducible)', () => {
    const r = evaluateAgents(penteEnv, preset('medium'), preset('easy'), { games: 8, seed: 6 })
      .agents[0];
    expect(r.wins).toBeGreaterThan(r.losses);
  }, 60_000);

  it('detects capture wins and double captures for achievements', () => {
    const s = position(
      [
        [at(5, 5), 1],
        [at(5, 6), 2],
        [at(5, 7), 2],
      ],
      0,
      [4, 0],
    );
    expect(wonByCaptures(play(s, at(5, 8)))).toBe(true);
    // A real history: Black's 5th stone at (6,6) closes the vertical pair (4,6)(5,6) against (3,6)
    // and the horizontal pair (6,4)(6,5) against (6,3) at once.
    const h = [
      CENTER,
      at(5, 6),
      at(3, 6),
      at(4, 6),
      at(6, 3),
      at(6, 4),
      at(15, 15),
      at(6, 5),
      at(6, 6),
    ];
    const end = replay(h);
    expect(end.captures).toEqual([2, 0]);
    expect(end.lastCaptured).toEqual(
      [at(4, 6), at(5, 6), at(6, 4), at(6, 5)].sort((a, b) => a - b),
    );
    expect(hadDoubleCapture(end, 0)).toBe(true);
    expect(hadDoubleCapture(end, 1)).toBe(false);
    expect(hadDoubleCapture(replay(h.slice(0, 8)), null)).toBe(false);
  });
});
