import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { presetById } from '../ai';
import { tttEnv } from '../ai-adapter';
import { legalMoves, play, replay, newRound, type Seat, type TttState } from '../rules';

/** Explores every opponent reply against the agent; returns the number of agent losses found. */
function lossesAgainstAllReplies(agentSeat: Seat): { losses: number; terminals: number } {
  const agent = presetById('perfect').create();
  const rng = new Rng(1);
  let losses = 0;
  let terminals = 0;
  const visit = (s: TttState) => {
    if (s.result) {
      terminals++;
      if (s.result.kind === 'win' && s.result.winner !== agentSeat) losses++;
      return;
    }
    if (s.toMove === agentSeat) visit(play(s, agent.selectAction(tttEnv, s, agentSeat, { rng })));
    else for (const cell of legalMoves(s)) visit(play(s, cell));
  };
  visit(newRound(0));
  return { losses, terminals };
}

describe('Tic-Tac-Toe computer opponents', () => {
  it('Perfect never loses as X against any sequence of replies', () => {
    const { losses, terminals } = lossesAgainstAllReplies(0);
    expect(terminals).toBeGreaterThan(50);
    expect(losses).toBe(0);
  });

  it('Perfect never loses as O against any sequence of replies', () => {
    const { losses, terminals } = lossesAgainstAllReplies(1);
    expect(terminals).toBeGreaterThan(100);
    expect(losses).toBe(0);
  });

  it('Perfect vs Perfect always draws (the game-theoretic value)', () => {
    const report = evaluateAgents(
      tttEnv,
      presetById('perfect').create(),
      presetById('perfect').create(),
      { games: 30, seed: 5 },
    );
    expect(report.agents[0].draws).toBe(30);
  });

  it('Perfect takes an immediate win and blocks an immediate loss', () => {
    const agent = presetById('perfect').create();
    const rng = new Rng(3);
    // X has 0 and 1; X to move must play 2.
    expect(agent.selectAction(tttEnv, replay([0, 4, 1, 8]), 0, { rng })).toBe(2);
    // O to move must block X at 2.
    expect(agent.selectAction(tttEnv, replay([0, 4, 1]), 1, { rng })).toBe(2);
  });

  it('difficulty ordering holds empirically (seeded, reproducible)', () => {
    const vsRandom = (id: string) =>
      evaluateAgents(tttEnv, presetById(id).create(), presetById('random').create(), {
        games: 200,
        seed: 11,
      }).agents[0];
    const easy = vsRandom('easy');
    const medium = vsRandom('medium');
    const perfect = vsRandom('perfect');
    expect(perfect.losses).toBe(0);
    expect(medium.winRate).toBeGreaterThan(easy.winRate);
    expect(perfect.winRate).toBeGreaterThan(0.75);
    const mediumVsPerfect = evaluateAgents(
      tttEnv,
      presetById('medium').create(),
      presetById('perfect').create(),
      { games: 100, seed: 2 },
    );
    expect(mediumVsPerfect.agents[0].wins).toBe(0);
    expect(mediumVsPerfect.agents[1].wins).toBeGreaterThan(0);
  });
});
