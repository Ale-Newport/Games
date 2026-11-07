import { describe, expect, it } from 'vitest';
import { exploitability, strategyValue } from '../../../ai/agents/cfr';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import {
  AGENT_PRESETS,
  KUHN_GAME,
  easyPolicy,
  kuhnEquilibrium,
  mediumPolicy,
  nashPolicy,
  type KuhnHistory,
  type KuhnPolicy,
} from '../ai';
import { kuhnEnv } from '../ai-adapter';
import {
  START_CHIPS,
  applyKuhnAction,
  createKuhn,
  isValidKuhnState,
  legalKuhnActions,
  replayKuhn,
  type KuhnState,
} from '../engine';

const play = (s: KuhnState, ...actions: string[]) =>
  actions.reduce((x, a) => applyKuhnAction(x, a), s);
const asTree = (p: KuhnPolicy) => (h: KuhnHistory) => p(h.cards![h.betting.length % 2]!, h.betting);

describe('Kuhn poker rules', () => {
  it('antes one chip each and offers check or bet', () => {
    const s = createKuhn(1);
    expect(s.chips).toEqual([START_CHIPS - 1, START_CHIPS - 1]);
    expect(s.cards[0]).not.toBe(s.cards[1]);
    expect(legalKuhnActions(s)).toEqual(['check', 'bet']);
  });

  it('settles check-check, bet-fold and check-bet-call', () => {
    const cc = play(createKuhn(1), 'check', 'check');
    expect(cc.result!.showdown).toBe(true);
    expect(cc.result!.won).toBe(1);
    expect(cc.chips[cc.result!.winner]).toBe(START_CHIPS + 1);
    const bf = play(createKuhn(1), 'bet', 'fold');
    expect(bf.result).toEqual({ winner: 0, won: 1, showdown: false });
    expect(bf.chips).toEqual([START_CHIPS + 1, START_CHIPS - 1]);
    const cbc = play(createKuhn(2), 'check', 'bet', 'call');
    expect(cbc.result!.won).toBe(2);
    expect(cbc.chips[0] + cbc.chips[1]).toBe(2 * START_CHIPS);
  });

  it('alternates the first player, ends the match when a player cannot cover a hand, and replays', () => {
    let s = createKuhn(5);
    s = play(s, 'check', 'check', 'next');
    expect(s.first).toBe(1);
    expect(s.toAct).toBe(1);
    // Player 1 always bets, player 0 always folds: player 0 runs out.
    let k = 0;
    while (s.winner === null && k++ < 100) {
      const legal = legalKuhnActions(s);
      s = applyKuhnAction(
        s,
        legal.includes('next')
          ? 'next'
          : s.toAct === 0
            ? legal.includes('fold')
              ? 'fold'
              : 'check'
            : 'bet',
      );
    }
    expect(s.winner).toBe(1);
    expect(s.chips[0]).toBeLessThan(2);
    expect(replayKuhn(5, s.history)).toEqual(s);
    expect(isValidKuhnState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidKuhnState({ ...s, chips: [s.chips[0] + 1, s.chips[1]] })).toBe(false);
    expect(legalKuhnActions(s)).toEqual([]);
  });
});

describe('Kuhn poker equilibrium (CFR+)', () => {
  it('finds the known Nash equilibrium family', () => {
    const eq = kuhnEquilibrium();
    const alpha = eq['0:']![1]!; // how often the first player bluffs a jack
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1 / 3 + 0.02);
    // The king bets three times as often as the jack bluffs; the queen always checks first.
    expect(eq['2:']![1]!).toBeCloseTo(3 * alpha, 1);
    expect(eq['1:']![1]!).toBeLessThan(0.02);
    // The second player calls a bet with the queen a third of the time and bluffs a jack a third.
    expect(eq['1:bet']![1]!).toBeCloseTo(1 / 3, 1);
    expect(eq['0:check']![1]!).toBeCloseTo(1 / 3, 1);
    // Game value: the first player loses 1/18 of a chip a hand.
    expect(strategyValue(KUHN_GAME, asTree(nashPolicy), asTree(nashPolicy))).toBeCloseTo(
      -1 / 18,
      3,
    );
    expect(exploitability(KUHN_GAME, asTree(nashPolicy))).toBeLessThan(0.002);
  });

  it('ranks the hand-written strategies by exploitability', () => {
    const medium = exploitability(KUHN_GAME, asTree(mediumPolicy));
    const easy = exploitability(KUHN_GAME, asTree(easyPolicy));
    expect(medium).toBeGreaterThan(0.01);
    expect(easy).toBeGreaterThan(medium);
  });

  it('Nash never loses on average and beats the weaker players (seeded hands)', () => {
    const agent = (id: string) => AGENT_PRESETS.find((p) => p.id === id)!.create();
    const vs = (a: string, b: string) =>
      evaluateAgents(kuhnEnv, agent(a), agent(b), { games: 20000, seed: 3, maxSteps: 10 }).agents[0]
        .averageReturn;
    expect(vs('hard', 'random')).toBeGreaterThan(0.1);
    expect(vs('hard', 'easy')).toBeGreaterThan(0.01);
    expect(vs('hard', 'medium')).toBeGreaterThan(-0.02);
    expect(vs('medium', 'easy')).toBeGreaterThan(0.01);
  }, 60_000);
});

describeAdapterContract(kuhnEnv, {
  configs: [undefined],
  playouts: 30,
  maxSteps: 10,
  illegalActions: (s) => ['raise', 'next', 'x'].filter((a) => !legalKuhnActions(s).includes(a)),
  checkObservation: (s, player) => {
    const view = kuhnEnv.getObservation(s, player) as KuhnState;
    if (!s.result?.showdown) expect(view.cards[1 - player]).toBe(-1);
  },
});
