import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { createMnkState, stateFromHistory } from '../../shared/mnk/engine';
import { MnkSolver } from '../../shared/mnk/solver';
import { AGENT_PRESETS } from '../ai';
import { t4Env } from '../ai-adapter';
import { T4 } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describe('Tic-Tac-Toe 4×4 solver facts', () => {
  it('proves the game is a draw and every position with ≤ 3 marks is a draw (opening book)', () => {
    const solver = new MnkSolver(T4);
    expect(solver.value(createMnkState(T4))).toBe(0);
    let positions = 0;
    for (let a = 0; a < 16; a++) {
      expect(solver.value(stateFromHistory(T4, [a]))).toBe(0);
      for (let b = 0; b < 16; b++) {
        if (b === a) continue;
        expect(solver.value(stateFromHistory(T4, [a, b]))).toBe(0);
        for (let c = 0; c < 16; c++) {
          if (c === a || c === b) continue;
          expect(solver.value(stateFromHistory(T4, [a, b, c]))).toBe(0);
          positions++;
        }
      }
    }
    expect(positions).toBe(3360);
  }, 60_000);
});

describe('Tic-Tac-Toe 4×4 computer opponents', () => {
  it('Perfect never loses against Random, Easy or Medium (both seats, seeded)', () => {
    for (const opponent of ['random', 'easy', 'medium']) {
      const report = evaluateAgents(t4Env, preset('perfect'), preset(opponent), {
        games: 24,
        seed: 100,
      });
      expect(report.agents[0].losses, `vs ${opponent}`).toBe(0);
    }
  }, 60_000);

  it('Perfect vs Perfect always draws', () => {
    const report = evaluateAgents(t4Env, preset('perfect'), preset('perfect'), {
      games: 6,
      seed: 9,
    });
    expect(report.agents[0].draws).toBe(6);
  }, 60_000);

  it('Perfect converts a forced win and blocks a forced loss', () => {
    const agent = preset('perfect');
    const rng = new Rng(1);
    // X to move with 0,1,2 and 3 empty: must win at 3.
    expect(agent.selectAction(t4Env, stateFromHistory(T4, [0, 4, 1, 5, 2, 8]), 0, { rng })).toBe(3);
    // O to move must block X's row at 3.
    expect(agent.selectAction(t4Env, stateFromHistory(T4, [0, 4, 1, 5, 2]), 1, { rng })).toBe(3);
  });

  it('difficulty ordering holds empirically (seeded, reproducible)', () => {
    const medVsEasy = evaluateAgents(t4Env, preset('medium'), preset('easy'), {
      games: 100,
      seed: 3,
    }).agents[0];
    expect(medVsEasy.wins).toBeGreaterThan(medVsEasy.losses * 3);
    const perfVsMed = evaluateAgents(t4Env, preset('perfect'), preset('medium'), {
      games: 60,
      seed: 3,
    }).agents[0];
    expect(perfVsMed.losses).toBe(0);
    expect(perfVsMed.wins).toBeGreaterThan(0);
  }, 60_000);
});
