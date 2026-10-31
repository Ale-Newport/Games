import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { plannedAction, simpleAction } from '../ai';
import { farkleEnv } from '../ai-adapter';
import { canScore, countsOf, scoreSet, scoringChoices, turnTables } from '../engine';
import { act, canBank, isValidFarkle, legalActions, newFarkle, type FarkleGame } from '../match';

const c = (...dice: number[]) => countsOf(dice);

describe('Farkle scoring', () => {
  it('scores singles, sets and the six-dice patterns', () => {
    expect(scoreSet(c(1))).toBe(100);
    expect(scoreSet(c(5, 5))).toBe(100);
    expect(scoreSet(c(1, 1, 1))).toBe(1000);
    expect(scoreSet(c(4, 4, 4))).toBe(400);
    expect(scoreSet(c(4, 4, 4, 4))).toBe(1000);
    expect(scoreSet(c(2, 2, 2, 2, 2, 2))).toBe(3000);
    expect(scoreSet(c(1, 2, 3, 4, 5, 6))).toBe(1500);
    expect(scoreSet(c(2, 2, 3, 3, 4, 4))).toBe(1500);
    expect(scoreSet(c(2, 2, 2, 3, 3, 3))).toBe(2500);
    expect(scoreSet(c(2, 2, 2, 2, 3, 3))).toBe(1500);
    expect(scoreSet(c(2, 3))).toBe(0);
    expect(canScore(c(2, 3, 4, 6, 6, 2))).toBe(false);
    expect(canScore(c(2, 3, 4, 6, 6, 5))).toBe(true);
  });

  it('lists every scoring choice in which all dice score', () => {
    const choices = scoringChoices(c(1, 5, 2, 2, 2, 3));
    expect(choices.map((x) => x.points).sort((a, b) => a - b)).toEqual([
      50, 100, 150, 200, 250, 300, 350,
    ]);
  });

  it('plans a turn by dynamic programming: about 600 expected from six dice', () => {
    const t = turnTables();
    expect(t.value[6]![0]).toBeGreaterThan(500);
    expect(t.value[6]![0]).toBeLessThan(700);
    // With one die left it is worth banking 400 rather than rolling.
    expect(t.roll[1]![8]).toBeLessThan(400);
  });
});

describe('Farkle play', () => {
  it('a farkle loses the stake, the opening needs 500, hot dice roll six again', () => {
    let g: FarkleGame = { ...newFarkle(2, 1), phase: 'choose', dice: [1, 5, 2, 3, 4, 6], stake: 0 };
    expect(canBank(g, 150)).toBe(false);
    expect(legalActions(g).some((a) => a.endsWith(':bank'))).toBe(true);
    g = act(g, 'keep:111111:roll');
    expect(g.aside).toHaveLength(6);
    expect(g.event?.kind).toBe('hot');
    const rolled = act(g, 'roll');
    expect(rolled.aside.length === 0 || rolled.turn !== g.turn).toBe(true);
  });

  it('agents finish games that replay, and the planner beats the cautious player', () => {
    let wins = 0;
    for (let seed = 1; seed <= 10; seed++) {
      let g = newFarkle(2, seed);
      for (let i = 0; i < 20000 && g.phase !== 'over'; i++)
        g = act(g, g.turn === 0 ? plannedAction(g) : simpleAction(g));
      expect(g.phase).toBe('over');
      expect(isValidFarkle(g)).toBe(true);
      if (g.winner === 0) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(5);
  });
});

describeAdapterContract(farkleEnv, {
  configs: [undefined, { players: 1 }],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: (g) =>
    ['keep:999999:roll', 'jump', 'bank'].filter((a) => !legalActions(g).includes(a)),
});
