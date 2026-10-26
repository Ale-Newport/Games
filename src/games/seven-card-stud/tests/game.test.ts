import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { STYLES, estimateEquity, styleAction } from '../../shared/poker/ai';
import { applyPokerAction, createPoker, legalPokerActions } from '../../shared/poker/engine';
import { UNKNOWN } from '../../shared/poker/environment';
import { AGENT_PRESETS } from '../ai';
import { bundle, studEnv } from '../ai-adapter';
import { manifest } from '../manifest';
import { VARIANT } from '../rules';

describe('Seven Card Stud module', () => {
  it('wires the fixed-limit stud variant into the environment and the presets', () => {
    expect(VARIANT).toMatchObject({ id: 'stud', hole: 7, limit: 'fixed-limit', first: 'third' });
    expect(studEnv.id).toBe(manifest.id);
    expect(studEnv.version).toBe(manifest.version);
    expect(AGENT_PRESETS).toBe(bundle.agents);
    const s = studEnv.reset(4);
    const view = studEnv.getObservation(s, 0);
    expect(view.seats[1]!.hole).toEqual([UNKNOWN, UNKNOWN, s.seats[1]!.hole[2]]);
  });

  it('counts the cards it can see: an opponent showing the case aces kills our ace draws', () => {
    const s = createPoker(VARIANT, 2, 2);
    s.seats[0]!.hole = [c(SPADES, 1), c(HEARTS, 1), c(CLUBS, 9)];
    s.seats[1]!.hole = [c(SPADES, 4), c(HEARTS, 8), c(CLUBS, 1)];
    const rng = new Rng(3);
    const live = estimateEquity(s, 0, 1500, rng);
    s.seats[1]!.hole[2] = c(DIAMONDS, 1);
    // With both other aces gone the pair of aces can no longer improve to trips with an ace.
    const dead = estimateEquity(s, 0, 1500, rng);
    expect(live).toBeGreaterThan(0.6);
    expect(dead).toBeLessThan(live);
  });

  it('completes rolled-up trips and folds junk to a raise', () => {
    let s = createPoker(VARIANT, 6, 2);
    const bringIn = s.seats.findIndex((x) => x.bet > 0);
    const other = 1 - bringIn;
    s.seats[other]!.hole = [c(SPADES, 12), c(HEARTS, 12), c(CLUBS, 12)];
    expect(styleAction(s, STYLES.medium, new Rng(1))).toBe('raise:20');
    s = applyPokerAction(s, 'raise:20');
    s.seats[bringIn]!.hole = [c(SPADES, 2), c(HEARTS, 7), c(DIAMONDS, 3)];
    expect(['fold', 'call']).toContain(styleAction(s, STYLES.medium, new Rng(2)));
  });

  it('Medium beats Random over seeded heads-up hands', () => {
    const agent = (id: string) => AGENT_PRESETS.find((p) => p.id === id)!.create();
    const report = evaluateAgents(studEnv, agent('medium'), agent('random'), {
      games: 300,
      seed: 1,
      maxSteps: 80,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(0.5);
  }, 120_000);
});

describeAdapterContract(studEnv, {
  configs: [undefined, { players: 6 }],
  playouts: 12,
  maxSteps: 100,
  illegalActions: (s) =>
    ['raise:1', 'raise:999999', 'draw:', 'x'].filter((a) => !legalPokerActions(s).includes(a)),
});
