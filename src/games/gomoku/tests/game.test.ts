import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { pointName, starPoints } from '../../shared/goban/GoBoard';
import { createMnkState, playCell, stateFromHistory } from '../../shared/mnk/engine';
import { AGENT_PRESETS } from '../ai';
import { gomokuEnv } from '../ai-adapter';
import { GOMOKU, winnerStoneCount } from '../rules';

const N = 15;
const at = (r: number, c: number) => r * N + c;
const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(gomokuEnv, {
  configs: [undefined],
  playouts: 25,
  illegalActions: (s) => [-1, 225, ...s.history.slice(0, 3)],
});

describe('Gomoku rules', () => {
  it('wins with five in every direction, not with four', () => {
    const lines = [
      [at(7, 3), at(7, 4), at(7, 5), at(7, 6), at(7, 7)],
      [at(2, 9), at(3, 9), at(4, 9), at(5, 9), at(6, 9)],
      [at(3, 3), at(4, 4), at(5, 5), at(6, 6), at(7, 7)],
      [at(3, 11), at(4, 10), at(5, 9), at(6, 8), at(7, 7)],
    ];
    for (const line of lines) {
      const fillers = [at(0, 0), at(0, 2), at(0, 4), at(0, 6)];
      const history = line.slice(0, 4).flatMap((p, k) => [p, fillers[k]!]);
      expect(stateFromHistory(GOMOKU, history).result).toBeNull();
      const s = playCell(GOMOKU, stateFromHistory(GOMOKU, history), line[4]!);
      expect(s.result).toMatchObject({ kind: 'win', winner: 0 });
    }
  });

  it('counts overlines (six) as wins in freestyle', () => {
    const black = [at(7, 2), at(7, 3), at(7, 4), at(7, 6), at(7, 7)];
    const white = [at(0, 0), at(0, 2), at(0, 4), at(0, 6), at(0, 8)];
    const s = stateFromHistory(
      GOMOKU,
      black.flatMap((b, k) => [b, white[k]!]),
    );
    expect(s.result).toBeNull();
    const six = playCell(GOMOKU, s, at(7, 5));
    expect(six.result?.kind === 'win' && six.result.line).toHaveLength(6);
    expect(winnerStoneCount(six)).toBe(5 + 1);
  });

  it('names points like a Go board and places star points', () => {
    expect(pointName(at(14, 0), 15)).toBe('A1');
    expect(pointName(at(0, 14), 15)).toBe('P15');
    expect(pointName(at(7, 8), 15)).toBe('J8');
    expect(starPoints(15)).toContain(at(7, 7));
    expect(starPoints(15)).toHaveLength(9);
  });
});

describe('Gomoku agents', () => {
  it('every level completes its own five and blocks the opponent’s five', () => {
    // Black has four in a row on row 7 with both ends open; White to move must block one end.
    const four = stateFromHistory(GOMOKU, [
      at(7, 4),
      at(0, 0),
      at(7, 5),
      at(0, 2),
      at(7, 6),
      at(0, 4),
      at(7, 7),
    ]);
    for (const id of ['easy', 'medium', 'hard', 'expert']) {
      const block = preset(id).selectAction(gomokuEnv, four, 1, { rng: new Rng(1) });
      expect([at(7, 3), at(7, 8)], id).toContain(block);
    }
    const ownFour = stateFromHistory(GOMOKU, [
      at(7, 4),
      at(0, 0),
      at(7, 5),
      at(0, 2),
      at(7, 6),
      at(0, 4),
      at(7, 7),
      at(14, 14),
    ]);
    for (const id of ['easy', 'medium', 'hard', 'expert']) {
      const win = preset(id).selectAction(gomokuEnv, ownFour, 0, { rng: new Rng(2) });
      expect(playCell(GOMOKU, ownFour, win).result?.kind, id).toBe('win');
    }
  });

  it('opens in the center', () => {
    expect(
      preset('hard').selectAction(gomokuEnv, createMnkState(GOMOKU), 0, { rng: new Rng(3) }),
    ).toBe(at(7, 7));
  });

  it('levels are ordered by strength (seeded, reproducible)', () => {
    const medVsEasy = evaluateAgents(gomokuEnv, preset('medium'), preset('easy'), {
      games: 10,
      seed: 4,
    }).agents[0];
    expect(medVsEasy.wins).toBeGreaterThanOrEqual(9);
    const hardVsMed = evaluateAgents(gomokuEnv, preset('hard'), preset('medium'), {
      games: 8,
      seed: 4,
    }).agents[0];
    expect(hardVsMed.wins).toBeGreaterThan(hardVsMed.losses);
  }, 60_000);
});
