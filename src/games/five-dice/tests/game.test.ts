import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import {
  act,
  isValidDiceGame,
  legalActions,
  newDiceGame,
  totals,
} from '../../shared/scorecard/game';
import { plannedAction, simpleAction } from '../../shared/scorecard/planner';
import { countsOf, keeps, outcomes, planTurn } from '../../shared/scorecard/turn';
import { fiveDiceEnv } from '../ai-adapter';
import {
  FIVE_DICE,
  FIVE_DICE_PLANNING,
  boxScore,
  fiveKindBonus,
  openBoxes,
  scoreFor,
  total,
  type Card,
} from '../engine';

const c = (...dice: number[]) => countsOf(dice);

describe('Five Dice scoring', () => {
  it('scores every box', () => {
    expect(boxScore('threes', c(3, 3, 3, 1, 2))).toBe(9);
    expect(boxScore('threeKind', c(4, 4, 4, 1, 2))).toBe(15);
    expect(boxScore('fourKind', c(4, 4, 4, 1, 2))).toBe(0);
    expect(boxScore('fullHouse', c(2, 2, 3, 3, 3))).toBe(25);
    expect(boxScore('fullHouse', c(3, 3, 3, 3, 3))).toBe(0);
    expect(boxScore('smallStraight', c(1, 2, 3, 4, 6))).toBe(30);
    expect(boxScore('largeStraight', c(2, 3, 4, 5, 6))).toBe(40);
    expect(boxScore('largeStraight', c(1, 2, 3, 4, 6))).toBe(0);
    expect(boxScore('fiveKind', c(6, 6, 6, 6, 6))).toBe(50);
    expect(boxScore('chance', c(6, 5, 4, 3, 1))).toBe(19);
  });

  it('adds the upper bonus at 63 and the five-of-a-kind extras with the joker rule', () => {
    const card: Card = { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 };
    expect(total(card, 0)).toBe(63 + 35);
    const joker: Card = { fiveKind: 50, fours: 12 };
    const hand = c(4, 4, 4, 4, 4);
    expect(fiveKindBonus(joker, hand)).toBe(100);
    // The fours box is filled, so any lower box takes it at full value.
    expect(openBoxes(joker, hand)).not.toContain('fours');
    expect(scoreFor(joker, 'largeStraight', hand)).toBe(40);
    expect(openBoxes({ fiveKind: 50 }, hand)).toEqual(['fours']);
  });
});

describe('Turn planner', () => {
  it('enumerates hands, keeps and outcomes', () => {
    expect(outcomes(5)).toHaveLength(252);
    expect(outcomes(2).reduce((a, o) => a + o.p, 0)).toBeCloseTo(1);
    expect(keeps(c(1, 1, 2, 3, 3))).toHaveLength(3 * 2 * 3);
  });

  it('chases five of a kind with four alike when only that box is open', () => {
    const card: Card = Object.fromEntries(
      FIVE_DICE.boxes.filter((b) => b !== 'fiveKind').map((b) => [b, 0]),
    );
    const plan = planTurn((hand) => FIVE_DICE_PLANNING.handValue(card, hand, 0));
    expect(plan.bestKeep(c(6, 6, 6, 6, 2), 2)).toEqual(c(6, 6, 6, 6));
  });

  it('the planner outscores the simple player over a few games', () => {
    let planned = 0;
    let simple = 0;
    for (let seed = 1; seed <= 6; seed++) {
      let g = newDiceGame(2, seed);
      while (g.phase !== 'over')
        g = act(
          FIVE_DICE,
          g,
          g.turn === 0
            ? plannedAction(FIVE_DICE, FIVE_DICE_PLANNING, g)
            : simpleAction(FIVE_DICE, g),
        );
      const [a, b] = totals(FIVE_DICE, g);
      planned += a!;
      simple += b!;
      expect(isValidDiceGame(FIVE_DICE, g)).toBe(true);
    }
    expect(planned).toBeGreaterThan(simple);
    expect(planned / 6).toBeGreaterThan(190);
  });

  it('rolls and scores through the action API', () => {
    let g = newDiceGame(1, 3);
    expect(legalActions(FIVE_DICE, g)).toEqual(['roll:00000']);
    g = act(FIVE_DICE, g, 'roll:00000');
    expect(g.dice).toHaveLength(5);
    const kept = act(FIVE_DICE, g, 'roll:11000');
    expect(kept.dice!.slice(0, 2)).toEqual(g.dice!.slice(0, 2));
    const scored = act(FIVE_DICE, kept, 'score:chance');
    expect(scored.cards[0]!.chance).toBe(kept.dice!.reduce((a, b) => a + b, 0));
    expect(act(FIVE_DICE, scored, 'score:chance')).toBe(scored);
  });
});

describeAdapterContract(fiveDiceEnv, {
  configs: [undefined, { players: 1 }],
  playouts: 2,
  maxSteps: 400,
  illegalActions: (g) =>
    ['roll:22222', 'score:nothing', 'jump'].filter((a) => !legalActions(FIVE_DICE, g).includes(a)),
});
