import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { cautiousAction, strategistAction } from '../ai';
import { summitEnv } from '../ai-adapter';
import {
  act,
  bustChance,
  HEIGHT,
  isValidSummit,
  legalActions,
  newSummit,
  options,
  turnWorth,
  type SummitGame,
} from '../engine';

const withDice = (g: SummitGame, dice: number[]): SummitGame => ({ ...g, dice, phase: 'choose' });

describe('Summit Rush rules', () => {
  it('pairs four dice into the three possible pairings', () => {
    const g = withDice(newSummit(2, 1), [1, 2, 3, 4]);
    // 1+2/3+4, 1+3/2+4, 1+4/2+3.
    expect(options(g)).toEqual([
      [3, 7],
      [4, 6],
      [5, 5],
    ]);
  });

  it('with the climbers used up only columns already climbed this turn may move', () => {
    const g = withDice({ ...newSummit(2, 1), climbers: { 4: 1, 6: 1, 8: 1 } }, [2, 2, 3, 3]);
    // Pairings: 4/6, 5/5, 5/5 — only 4 and 6 can be climbed.
    expect(options(g)).toEqual([[4, 6]]);
    const busted = withDice({ ...newSummit(2, 1), climbers: { 4: 1, 6: 1, 8: 1 } }, [1, 1, 1, 1]);
    // Only 2/2: no free climber, so nothing fits.
    expect(options(busted)).toEqual([]);
  });

  it('when only one sum of a pairing fits, either may be chosen', () => {
    const g = withDice({ ...newSummit(2, 1), climbers: { 4: 1, 6: 1 } }, [1, 2, 5, 6]);
    // Pairings 3/11, 6/8, 7/7: one free climber, so 3 or 11 alone, 6+8, or 7 twice.
    expect(options(g)).toEqual([[3], [11], [6, 8], [7, 7]]);
  });

  it('a bust loses the climb, stopping keeps it, and reaching the top claims the column', () => {
    let g = newSummit(2, 1);
    g = { ...g, climbers: { 2: 3, 7: 4 }, marks: [{ 7: 2 }, { 2: 1 }] };
    g = act(g, 'stop');
    expect(g.marks[0]).toEqual({ 2: 3, 7: 4 });
    expect(g.claimed).toEqual({ 2: 0 });
    // The opponent's progress on a claimed column is cleared.
    expect(g.marks[1]).toEqual({});
    expect(g.event).toEqual({ kind: 'stop', player: 0, claimed: [2] });
    expect(g.turn).toBe(1);
    // A claimed column can no longer be climbed.
    expect(options(withDice(g, [1, 1, 1, 1]))).toEqual([]);
  });

  it('claiming a third column wins', () => {
    const g: SummitGame = {
      ...newSummit(2, 1),
      claimed: { 2: 0, 12: 0 },
      climbers: { 3: HEIGHT[3]! },
    };
    const won = act(g, 'stop');
    expect(won.phase).toBe('over');
    expect(won.winner).toBe(0);
    expect(legalActions(won)).toEqual([]);
  });

  it('values turns by the rule of 28 and gives the exact bust chance', () => {
    const g: SummitGame = { ...newSummit(2, 1), climbers: { 7: 3, 6: 1 } };
    // 7: three steps plus placing (4 × 1); 6: one step plus placing (2 × 2).
    expect(turnWorth(g)).toBe(8);
    // With climbers on 6, 7 and 8, the classic bust chance is 8%.
    expect(bustChance({ ...newSummit(2, 1), climbers: { 6: 1, 7: 1, 8: 1 } })).toBeCloseTo(
      0.0802,
      3,
    );
    // With 2, 3 and 12 it is 56%.
    expect(bustChance({ ...newSummit(2, 1), climbers: { 2: 1, 3: 1, 12: 1 } })).toBeCloseTo(
      0.5617,
      3,
    );
    expect(bustChance(newSummit(2, 1))).toBe(0);
  });

  it('replays saved games', () => {
    let g = newSummit(3, 7);
    for (let i = 0; i < 80 && g.phase !== 'over'; i++) g = act(g, strategistAction(g));
    expect(isValidSummit(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidSummit({ ...g, claimed: { 7: 1 } })).toBe(false);
    expect(isValidSummit({ ...g, history: [...g.history, 'jump'] })).toBe(false);
  });
});

describe('Summit Rush players', () => {
  it('the strategist beats the cautious player', () => {
    let wins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      let g = newSummit(2, seed);
      const me = seed % 2;
      while (g.phase !== 'over')
        g = act(g, g.turn === me ? strategistAction(g) : cautiousAction(g));
      if (g.winner === me) wins++;
    }
    expect(wins).toBeGreaterThan(130);
  });
});

describeAdapterContract(summitEnv, {
  configs: [undefined, { players: 3 }, { players: 4 }],
  playouts: 2,
  maxSteps: 6000,
  illegalActions: (g) => ['jump', 'climb:13', 'stop'].filter((a) => !legalActions(g).includes(a)),
});
