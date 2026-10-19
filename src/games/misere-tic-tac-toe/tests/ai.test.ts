import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import {
  createMnkState,
  legalCells,
  playCell,
  type MnkState,
  type Seat,
} from '../../shared/mnk/engine';
import { AGENT_PRESETS } from '../ai';
import { misereEnv } from '../ai-adapter';
import { MISERE } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(misereEnv, {
  configs: [undefined, { firstPlayer: 1 }],
  playouts: 150,
  illegalActions: (s) => [-1, 9, ...s.history],
});

function lossesAgainstAllReplies(agentSeat: Seat): number {
  const agent = preset('perfect');
  const rng = new Rng(4);
  let losses = 0;
  const visit = (s: MnkState) => {
    if (s.result) {
      if (s.result.kind === 'win' && s.result.winner !== agentSeat) losses++;
      return;
    }
    if (s.toMove === agentSeat)
      visit(playCell(MISERE, s, agent.selectAction(misereEnv, s, agentSeat, { rng })));
    else for (const c of legalCells(MISERE, s)) visit(playCell(MISERE, s, c));
  };
  visit(createMnkState(MISERE));
  return losses;
}

describe('Misère Tic-Tac-Toe computer opponents', () => {
  it('Perfect opens in the center (the only non-losing first move)', () => {
    const agent = preset('perfect');
    for (let seed = 0; seed < 10; seed++)
      expect(agent.selectAction(misereEnv, createMnkState(MISERE), 0, { rng: new Rng(seed) })).toBe(
        4,
      );
  });

  it('Perfect never loses as X or as O against any sequence of replies', () => {
    expect(lossesAgainstAllReplies(0)).toBe(0);
    expect(lossesAgainstAllReplies(1)).toBe(0);
  });

  it('Perfect vs Perfect always draws; Medium beats Easy (seeded)', () => {
    expect(
      evaluateAgents(misereEnv, preset('perfect'), preset('perfect'), { games: 20, seed: 1 })
        .agents[0].draws,
    ).toBe(20);
    const med = evaluateAgents(misereEnv, preset('medium'), preset('easy'), { games: 200, seed: 1 })
      .agents[0];
    expect(med.wins).toBeGreaterThan(med.losses);
    const perf = evaluateAgents(misereEnv, preset('perfect'), preset('medium'), {
      games: 100,
      seed: 1,
    }).agents[0];
    expect(perf.losses).toBe(0);
  }, 60_000);
});
