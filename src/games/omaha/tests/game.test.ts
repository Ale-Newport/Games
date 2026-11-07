import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import {
  applyPokerAction,
  createPoker,
  handScore,
  legalPokerActions,
  raiseRange,
} from '../../shared/poker/engine';
import { categoryOf } from '../../shared/poker/hands';
import { AGENT_PRESETS } from '../ai';
import { bundle, omahaEnv } from '../ai-adapter';
import { manifest } from '../manifest';
import { VARIANT } from '../rules';

describe('Omaha module', () => {
  it('wires the pot-limit four-card variant into the environment and the presets', () => {
    expect(VARIANT).toMatchObject({ id: 'omaha', hole: 4, limit: 'pot-limit' });
    expect(omahaEnv.id).toBe(manifest.id);
    expect(omahaEnv.version).toBe(manifest.version);
    expect(AGENT_PRESETS).toBe(bundle.agents);
    expect(omahaEnv.reset(1).seats.every((x) => x.hole.length === 4)).toBe(true);
  });

  it('scores exactly two hole cards with exactly three board cards', () => {
    const board = [c(HEARTS, 2), c(HEARTS, 7), c(HEARTS, 9), c(HEARTS, 12), c(CLUBS, 4)];
    // One heart in the hand: no flush, even with four on the board.
    const oneHeart = [c(HEARTS, 1), c(SPADES, 13), c(CLUBS, 13), c(DIAMONDS, 5)];
    expect(categoryOf(handScore('omaha', oneHeart, board))).toBe('pair');
    expect(categoryOf(handScore('holdem', oneHeart.slice(0, 2), board))).toBe('flush');
    // Two hearts make the flush.
    const twoHearts = [c(HEARTS, 1), c(HEARTS, 3), c(CLUBS, 13), c(DIAMONDS, 5)];
    expect(categoryOf(handScore('omaha', twoHearts, board))).toBe('flush');
  });

  it('caps raises at the pot as the betting grows', () => {
    let s = createPoker(VARIANT, 3, 3);
    // Pot 30, 20 to call: the largest raise is to 20 + 30 + 20 = 70.
    expect(raiseRange(s)).toEqual([40, 70]);
    s = applyPokerAction(s, 'raise:70');
    // Small blind: pot 100, 60 to call → to 70 + 100 + 60 = 230.
    expect(raiseRange(s)).toEqual([120, 230]);
    expect(() => applyPokerAction(s, 'raise:231')).toThrow();
  });

  it('Medium beats Random over seeded heads-up hands', () => {
    const agent = (id: string) => AGENT_PRESETS.find((p) => p.id === id)!.create();
    const report = evaluateAgents(omahaEnv, agent('medium'), agent('random'), {
      games: 120,
      seed: 1,
      maxSteps: 60,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(1);
  }, 120_000);
});

describeAdapterContract(omahaEnv, {
  configs: [undefined, { players: 6 }],
  playouts: 12,
  maxSteps: 80,
  illegalActions: (s) =>
    ['raise:1', 'raise:999999', 'draw:', 'x'].filter((a) => !legalPokerActions(s).includes(a)),
});
