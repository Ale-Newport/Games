import { describe, expect, it } from 'vitest';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { STYLES, styleAction } from '../../shared/poker/ai';
import { simpleDiscard } from '../../shared/poker/draw-ai';
import {
  applyPokerAction,
  createPoker,
  legalPokerActions,
  type PokerState,
} from '../../shared/poker/engine';
import { AGENT_PRESETS } from '../ai';
import { bundle, drawEnv } from '../ai-adapter';
import { manifest } from '../manifest';
import { VARIANT } from '../rules';

const play = (s: PokerState, ...actions: string[]) =>
  actions.reduce((x, a) => applyPokerAction(x, a), s);

describe('Five Card Draw module', () => {
  it('wires the fixed-limit draw variant into the environment and the presets', () => {
    expect(VARIANT).toMatchObject({ id: 'draw', hole: 5, limit: 'fixed-limit' });
    expect(drawEnv.id).toBe(manifest.id);
    expect(drawEnv.version).toBe(manifest.version);
    expect(AGENT_PRESETS).toBe(bundle.agents);
    expect(drawEnv.reset(2).seats.every((x) => x.hole.length === 5)).toBe(true);
  });

  it('discards sensibly', () => {
    // A pair keeps the pair; four to a flush draws one; a straight stands pat.
    expect(
      simpleDiscard([c(SPADES, 9), c(HEARTS, 9), c(CLUBS, 2), c(DIAMONDS, 5), c(SPADES, 13)]),
    ).toEqual([2, 3, 4]);
    expect(
      simpleDiscard([c(SPADES, 2), c(SPADES, 7), c(HEARTS, 4), c(SPADES, 11), c(SPADES, 13)]),
    ).toEqual([2]);
    expect(
      simpleDiscard([c(SPADES, 5), c(HEARTS, 6), c(CLUBS, 7), c(DIAMONDS, 8), c(SPADES, 9)]),
    ).toEqual([]);
    // Four to a straight with the ace low.
    expect(
      simpleDiscard([c(SPADES, 1), c(HEARTS, 2), c(CLUBS, 3), c(DIAMONDS, 4), c(SPADES, 12)]),
    ).toEqual([4]);
    // The Medium player keeps its trips (drawing one or two).
    let s = createPoker(VARIANT, 4, 2);
    s = play(s, 'call', 'check');
    s.seats[1]!.hole = [c(SPADES, 8), c(HEARTS, 8), c(CLUBS, 8), c(DIAMONDS, 2), c(SPADES, 4)];
    expect(['draw:3', 'draw:4', 'draw:34']).toContain(styleAction(s, STYLES.medium, new Rng(1)));
  });

  it('raises a pat full house after the draw', () => {
    let s = createPoker(VARIANT, 6, 2);
    s = play(s, 'call', 'check', 'draw:012');
    s.seats[0]!.hole = [c(SPADES, 8), c(HEARTS, 8), c(CLUBS, 8), c(DIAMONDS, 2), c(SPADES, 2)];
    s = play(s, 'draw:');
    expect(s.street).toBe('final');
    const rng = new Rng(2);
    // Seat 1 acts first after the draw; whatever it does, the full house bets or raises.
    s = play(s, 'check');
    expect(styleAction(s, STYLES.medium, rng)).toBe('raise:40');
  });
});

describe('Five Card Draw opponents', () => {
  it('Medium beats Random over seeded heads-up hands', () => {
    const agent = (id: string) => AGENT_PRESETS.find((p) => p.id === id)!.create();
    const report = evaluateAgents(drawEnv, agent('medium'), agent('random'), {
      games: 300,
      seed: 1,
      maxSteps: 60,
    });
    expect(report.agents[0].averageReturn).toBeGreaterThan(0.5);
  }, 60_000);
});

describeAdapterContract(drawEnv, {
  configs: [undefined, { players: 6 }],
  playouts: 15,
  maxSteps: 80,
  illegalActions: (s) =>
    ['raise:1', 'draw:0123', 'draw:10', 'x'].filter((a) => !legalPokerActions(s).includes(a)),
});
