import { describe, expect, it } from 'vitest';
import { Rng } from '../../core/game-engine/random';
import { AlphaBetaAgent } from '../agents/alpha-beta-agent';
import { MctsAgent } from '../agents/mcts-agent';
import { EpsilonAgent, RandomAgent } from '../agents/random-agent';
import { describeAdapterContract } from '../protocols/contract-suite';
import { evaluateAgents } from '../evaluation/evaluate';
import { pileEnv, type PileState } from './toy-env';

describeAdapterContract(pileEnv, {
  configs: [undefined, { pile: 21 }],
  illegalActions: (s) => [0, 4, s.pile + 1],
});

describe('AlphaBetaAgent', () => {
  it('plays the known optimal strategy (leave a multiple of 4)', () => {
    const agent = new AlphaBetaAgent<PileState, number>({ maxDepth: Infinity });
    for (let pile = 1; pile <= 20; pile++) {
      if (pile % 4 === 0) continue; // losing position: any move
      const state = pileEnv.createInitialState({ pile }, 0);
      const take = agent.selectAction(pileEnv, state, 0, { rng: new Rng(pile) });
      expect((pile - take) % 4).toBe(0);
      expect(agent.lastStats?.value).toBeGreaterThan(0);
    }
  });

  it('never loses from a winning position against random play', () => {
    const report = evaluateAgents(
      pileEnv,
      new AlphaBetaAgent({ maxDepth: Infinity }),
      new RandomAgent(),
      {
        games: 40,
        seed: 3,
        swapSeats: false,
        config: { pile: 21 },
      },
    );
    expect(report.agents[0].losses).toBe(0);
    expect(report.agents[0].wins).toBe(40);
  });

  it('respects a time budget with iterative deepening', () => {
    let clock = 0;
    const agent = new AlphaBetaAgent<PileState, number>({
      maxDepth: 50,
      timeLimitMs: 5,
      now: () => (clock += 0.01),
    });
    const action = agent.selectAction(pileEnv, pileEnv.createInitialState({ pile: 30 }, 0), 0, {
      rng: new Rng(1),
    });
    expect([1, 2, 3]).toContain(action);
    expect(agent.lastStats?.depth).toBeGreaterThanOrEqual(1);
  });
});

describe('MctsAgent', () => {
  it('finds winning moves in small positions', () => {
    const agent = new MctsAgent<PileState, number>({ iterations: 3000 });
    let correct = 0;
    for (const pile of [5, 6, 7, 9, 10, 11]) {
      const take = agent.selectAction(pileEnv, pileEnv.createInitialState({ pile }, 0), 0, {
        rng: new Rng(pile),
      });
      if ((pile - take) % 4 === 0) correct++;
    }
    expect(correct).toBeGreaterThanOrEqual(5);
  });
});

describe('EpsilonAgent', () => {
  it('always plays legal actions and sometimes deviates', () => {
    const agent = new EpsilonAgent(
      new AlphaBetaAgent<PileState, number>({ maxDepth: Infinity }),
      0.5,
    );
    const rng = new Rng(9);
    const choices = new Set<number>();
    for (let i = 0; i < 60; i++)
      choices.add(
        agent.selectAction(pileEnv, pileEnv.createInitialState({ pile: 5 }, 0), 0, { rng }),
      );
    expect(choices.has(1)).toBe(true);
    expect(choices.size).toBeGreaterThan(1);
  });
});

describe('evaluateAgents', () => {
  it('produces reproducible reports with explicit seeds and version metadata', () => {
    const run = () =>
      evaluateAgents(pileEnv, new RandomAgent(), new RandomAgent(), {
        games: 20,
        seed: 100,
        config: { pile: 15 },
      });
    const a = run();
    const b = run();
    expect(a.agents[0].wins).toBe(b.agents[0].wins);
    expect(a.seeds).toEqual(Array.from({ length: 20 }, (_, i) => 100 + i));
    expect(a.gameVersion).toBe('1.0.0');
    expect(a.rulesetId).toBe('take-1-3-normal');
    expect(a.agents[0].wins + a.agents[0].losses + a.agents[0].draws).toBe(20);
    expect(a.agents[0].wins).toBe(a.agents[1].losses);
  });
});
