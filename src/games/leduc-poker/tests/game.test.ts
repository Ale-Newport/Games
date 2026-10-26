import { describe, expect, it } from 'vitest';
import { exploitability, strategyValue } from '../../../ai/agents/cfr';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { easyPolicy, mediumPolicy, nashPolicy, type LeducPolicy } from '../ai';
import { leducEnv } from '../ai-adapter';
import { LEDUC_GAME, type LeducHistory } from '../cfr-game';
import {
  HAND_COST,
  START_CHIPS,
  applyLeducAction,
  createLeduc,
  isValidLeducState,
  legalLeducActions,
  replayLeduc,
  type LeducState,
} from '../engine';
import { LEDUC_NASH } from '../strategy';

const play = (s: LeducState, ...actions: string[]) =>
  actions.reduce((x, a) => applyLeducAction(x, a), s);
const tree = (p: LeducPolicy) => (h: LeducHistory) => {
  const q = h.betting[h.round].length % 2;
  return p(h.cards![q]!, h.round === 1 ? h.cards![2] : null, h.betting);
};

describe('Leduc poker rules', () => {
  it('bets 2 in the first round, allows one raise, then reveals the public card and bets 4', () => {
    let s = createLeduc(1);
    expect(s.paid).toEqual([1, 1]);
    expect(legalLeducActions(s)).toEqual(['check', 'bet']);
    s = play(s, 'bet');
    expect(s.paid).toEqual([3, 1]);
    expect(legalLeducActions(s)).toEqual(['fold', 'call', 'raise']);
    s = play(s, 'raise');
    expect(s.paid).toEqual([3, 5]);
    expect(legalLeducActions(s)).toEqual(['fold', 'call']);
    s = play(s, 'call');
    expect(s.round).toBe(1);
    expect(s.toAct).toBe(0);
    s = play(s, 'bet', 'call');
    expect(s.paid).toEqual([9, 9]);
    expect(s.result!.showdown).toBe(true);
    expect(s.chips[0] + s.chips[1]).toBe(2 * START_CHIPS);
  });

  it('pays a fold, splits equal ranks and pairs beat high cards', () => {
    const f = play(createLeduc(1), 'bet', 'fold');
    expect(f.result).toEqual({ winner: 0, won: 1, showdown: false });
    // Find deals for a split and for a pair against a king.
    let split: LeducState | null = null;
    let pair: LeducState | null = null;
    for (let seed = 1; seed < 400 && (!split || !pair); seed++) {
      const s = createLeduc(seed);
      const r = s.cards.map((c) => Math.floor(c / 2));
      if (r[0] === r[1]) split ??= s;
      if (r[1] === r[2] && r[0] === 2 && r[1] !== 2) pair ??= s;
    }
    const sp = play(split!, 'check', 'check', 'check', 'check');
    expect(sp.result).toEqual({ winner: null, won: 0, showdown: true });
    expect(sp.chips).toEqual([START_CHIPS, START_CHIPS]);
    const pr = play(pair!, 'check', 'check', 'check', 'check');
    expect(pr.result!.winner).toBe(1);
  });

  it('ends the match below one hand of chips and validates by replay', () => {
    let s = createLeduc(3);
    // Player 0 folds to every bet; player 1 bets every time.
    for (let k = 0; k < 400 && s.winner === null; k++) {
      const legal = legalLeducActions(s);
      s = applyLeducAction(
        s,
        legal.includes('next')
          ? 'next'
          : s.toAct === 1
            ? legal.includes('bet')
              ? 'bet'
              : 'call'
            : legal.includes('fold')
              ? 'fold'
              : 'check',
      );
    }
    expect(s.winner).toBe(1);
    expect(s.chips[0]).toBeLessThan(HAND_COST);
    expect(replayLeduc(3, s.history)).toEqual(s);
    expect(isValidLeducState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidLeducState({ ...s, round: 0 })).toBe(s.round === 0);
  });
});

describe('Leduc poker equilibrium (precomputed CFR+)', () => {
  it('covers every information set and is close to a Nash equilibrium', () => {
    const keys = new Set<string>();
    const walk = (h: LeducHistory) => {
      if (LEDUC_GAME.isTerminal(h)) return;
      if (LEDUC_GAME.isChance(h)) return LEDUC_GAME.chance(h).forEach((o) => walk(o.next));
      keys.add(LEDUC_GAME.infoKey(h));
      for (const a of LEDUC_GAME.actions(h)) walk(LEDUC_GAME.play(h, a));
    };
    walk(LEDUC_GAME.root());
    expect(keys.size).toBe(288);
    for (const k of keys) expect(LEDUC_NASH[k], k).toBeDefined();
    expect(strategyValue(LEDUC_GAME, tree(nashPolicy), tree(nashPolicy))).toBeCloseTo(-0.0855, 2);
    expect(exploitability(LEDUC_GAME, tree(nashPolicy))).toBeLessThan(0.005);
  });

  it('beats the hand-written strategies, which are far more exploitable', () => {
    const ev = (a: LeducPolicy, b: LeducPolicy) =>
      (strategyValue(LEDUC_GAME, tree(a), tree(b)) - strategyValue(LEDUC_GAME, tree(b), tree(a))) /
      2;
    expect(ev(nashPolicy, mediumPolicy)).toBeGreaterThan(0.1);
    expect(ev(nashPolicy, easyPolicy)).toBeGreaterThan(0.1);
    expect(ev(mediumPolicy, easyPolicy)).toBeGreaterThan(0.03);
    expect(exploitability(LEDUC_GAME, tree(mediumPolicy))).toBeGreaterThan(0.3);
  });
});

describeAdapterContract(leducEnv, {
  configs: [undefined],
  playouts: 30,
  maxSteps: 20,
  illegalActions: (s) => ['next', 'x'].filter((a) => !legalLeducActions(s).includes(a)),
  checkObservation: (s, player) => {
    const view = leducEnv.getObservation(s, player) as LeducState;
    if (!s.result?.showdown) expect(view.cards[1 - player]).toBe(-1);
    if (s.round === 0) expect(view.cards[2]).toBe(-1);
  },
});
