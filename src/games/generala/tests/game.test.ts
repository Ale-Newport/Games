import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import {
  act,
  isValidDiceGame,
  legalActions,
  newDiceGame,
  totals,
  winners,
  type DiceGame,
} from '../../shared/scorecard/game';
import { plannedAction, simpleAction } from '../../shared/scorecard/planner';
import { countsOf } from '../../shared/scorecard/turn';
import { generalaEnv } from '../ai-adapter';
import { GENERALA, GENERALA_PLANNING, isStraight, scoreFor, total } from '../engine';

const c = (...dice: number[]) => countsOf(dice);

describe('Generala scoring', () => {
  it('scores numbers, straights, full house, four of a kind and the generalas', () => {
    expect(scoreFor({}, 'fives', c(5, 5, 1, 2, 5), false)).toBe(15);
    expect(isStraight(c(3, 4, 5, 6, 1))).toBe(true);
    expect(isStraight(c(1, 2, 3, 4, 6))).toBe(false);
    expect(scoreFor({}, 'straight', c(2, 3, 4, 5, 6), false)).toBe(20);
    expect(scoreFor({}, 'straight', c(2, 3, 4, 5, 6), true)).toBe(25);
    expect(scoreFor({}, 'fullHouse', c(2, 2, 6, 6, 6), false)).toBe(30);
    expect(scoreFor({}, 'fourKind', c(2, 6, 6, 6, 6), true)).toBe(45);
    expect(scoreFor({}, 'generala', c(4, 4, 4, 4, 4), false)).toBe(50);
    expect(scoreFor({}, 'doubleGenerala', c(4, 4, 4, 4, 4), false)).toBe(0);
    expect(scoreFor({ generala: 50 }, 'doubleGenerala', c(4, 4, 4, 4, 4), false)).toBe(100);
    expect(total({ ones: 3, straight: 20, generala: 50 })).toBe(73);
  });

  it('a served generala wins at once', () => {
    let g: DiceGame = newDiceGame(2, 1);
    g = { ...g, dice: [6, 6, 6, 6, 6], rolls: 1 };
    g = act(GENERALA, g, 'score:generala');
    expect(g.phase).toBe('over');
    expect(winners(GENERALA, g)).toEqual([0]);
  });
});

describe('Generala play', () => {
  it('the planner outscores the simple player and games replay', () => {
    let planned = 0;
    let simple = 0;
    for (let seed = 1; seed <= 8; seed++) {
      let g = newDiceGame(2, seed);
      while (g.phase !== 'over')
        g = act(
          GENERALA,
          g,
          g.turn === 0 ? plannedAction(GENERALA, GENERALA_PLANNING, g) : simpleAction(GENERALA, g),
        );
      const [a, b] = totals(GENERALA, g);
      planned += a!;
      simple += b!;
      expect(isValidDiceGame(GENERALA, g)).toBe(true);
    }
    expect(planned).toBeGreaterThan(simple);
  });

  it('the planner stands on a served four of a kind of sixes when only that box pays', () => {
    let g = newDiceGame(1, 1);
    g = {
      ...g,
      dice: [6, 6, 6, 6, 2],
      rolls: 1,
      cards: [
        {
          ones: 1,
          twos: 2,
          threes: 3,
          fours: 4,
          fives: 5,
          sixes: 6,
          straight: 0,
          fullHouse: 0,
          generala: 0,
          doubleGenerala: 0,
        },
      ],
    };
    expect(plannedAction(GENERALA, GENERALA_PLANNING, g)).toBe('score:fourKind');
    expect(legalActions(GENERALA, g)).toContain('score:fourKind');
  });
});

describeAdapterContract(generalaEnv, {
  configs: [undefined, { players: 1 }],
  playouts: 2,
  maxSteps: 400,
  illegalActions: (g) =>
    ['roll:22222', 'score:nothing', 'jump'].filter((a) => !legalActions(GENERALA, g).includes(a)),
});
