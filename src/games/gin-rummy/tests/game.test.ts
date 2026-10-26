import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { levelAction, undercutRisk } from '../ai';
import { ginEnv } from '../ai-adapter';
import {
  applyGinAction,
  canKnockWith,
  createGin,
  isValidGinState,
  legalGinActions,
  replayGin,
  type GinState,
} from '../engine';
import { allMelds, bestMelds, deadwoodOf, extendsMeld, layOff } from '../melds';

describe('Gin rummy melds', () => {
  it('finds sets and runs and the arrangement with the least deadwood', () => {
    const hand = [
      c(HEARTS, 4),
      c(HEARTS, 5),
      c(HEARTS, 6),
      c(HEARTS, 7),
      c(SPADES, 7),
      c(CLUBS, 7),
      c(DIAMONDS, 13),
      c(DIAMONDS, 1),
      c(CLUBS, 2),
      c(SPADES, 9),
    ];
    expect(allMelds(hand).length).toBeGreaterThanOrEqual(4);
    // 4-5-6-7♥ and the three sevens share the 7♥: the best uses 4-5-6♥ with 7♥ 7♠ 7♣.
    const best = bestMelds(hand);
    expect(best.points).toBe(10 + 1 + 2 + 9);
    expect(best.melds).toHaveLength(2);
    expect(deadwoodOf([c(SPADES, 1), c(SPADES, 2), c(SPADES, 3)])).toBe(0);
    expect(deadwoodOf([c(SPADES, 12), c(SPADES, 13), c(SPADES, 1)])).toBe(21); // no K-A wrap
  });

  it('extends melds and lays off deadwood', () => {
    expect(extendsMeld([c(HEARTS, 4), c(HEARTS, 5), c(HEARTS, 6)], c(HEARTS, 7))).toBe(true);
    expect(extendsMeld([c(HEARTS, 4), c(HEARTS, 5), c(HEARTS, 6)], c(SPADES, 7))).toBe(false);
    expect(extendsMeld([c(HEARTS, 9), c(SPADES, 9), c(CLUBS, 9)], c(DIAMONDS, 9))).toBe(true);
    const off = layOff(
      [[c(HEARTS, 4), c(HEARTS, 5), c(HEARTS, 6)]],
      [c(HEARTS, 7), c(HEARTS, 8), c(CLUBS, 13)],
    );
    expect(off.laid.sort()).toEqual([c(HEARTS, 7), c(HEARTS, 8)].sort());
  });
});

describe('Gin rummy rules', () => {
  it('deals ten each with an upcard; the non-dealer draws first', () => {
    const s = createGin(1);
    expect(s.hands.map((h) => h.length)).toEqual([10, 10]);
    expect(s.discard).toHaveLength(1);
    expect(s.stock).toHaveLength(31);
    expect(s.toAct).toBe(0);
    expect(legalGinActions(s)).toEqual(['draw:stock', 'draw:discard']);
  });

  it('forbids throwing back the card just taken from the pile', () => {
    let s = createGin(2);
    const top = s.discard[0]!;
    s = applyGinAction(s, 'draw:discard');
    expect(s.picks[0]).toEqual([top]);
    expect(legalGinActions(s)).not.toContain(`discard:${top}`);
    expect(legalGinActions(s).filter((a) => a.startsWith('discard:'))).toHaveLength(10);
  });

  it('scores gin, knocks with lay-offs, and undercuts', () => {
    const base = applyGinAction(createGin(3), 'draw:stock');
    // Gin: ten cards in melds after throwing the extra card.
    const gin: GinState = structuredClone(base);
    gin.hands[0] = [
      c(HEARTS, 1),
      c(HEARTS, 2),
      c(HEARTS, 3),
      c(SPADES, 5),
      c(SPADES, 6),
      c(SPADES, 7),
      c(CLUBS, 9),
      c(DIAMONDS, 9),
      c(SPADES, 9),
      c(HEARTS, 9),
      c(CLUBS, 13),
    ];
    gin.hands[1] = [
      c(CLUBS, 1),
      c(CLUBS, 2),
      c(DIAMONDS, 4),
      c(DIAMONDS, 5),
      c(DIAMONDS, 11),
      c(DIAMONDS, 12),
      c(CLUBS, 3),
      c(CLUBS, 6),
      c(HEARTS, 12),
      c(SPADES, 2),
    ];
    expect(canKnockWith(gin, c(CLUBS, 13))).toBe(true);
    const g = applyGinAction(gin, `knock:${c(CLUBS, 13)}`);
    expect(g.result!.kind).toBe('gin');
    // Opponent: A-2-3♣ melded; 4 + 5 + 10 + 10 + 6 + 10 + 2 = 47 deadwood.
    expect(g.result!.points).toBe(25 + 47);
    expect(g.scores[0]).toBe(72);
    // An undercut: the defender holds less deadwood than the knocker.
    const under: GinState = structuredClone(base);
    under.hands[0] = [
      c(HEARTS, 1),
      c(HEARTS, 2),
      c(HEARTS, 3),
      c(SPADES, 5),
      c(SPADES, 6),
      c(SPADES, 7),
      c(CLUBS, 9),
      c(DIAMONDS, 9),
      c(SPADES, 9),
      c(DIAMONDS, 8),
      c(CLUBS, 13),
    ];
    under.hands[1] = [
      c(CLUBS, 1),
      c(CLUBS, 2),
      c(CLUBS, 3),
      c(DIAMONDS, 4),
      c(DIAMONDS, 5),
      c(DIAMONDS, 6),
      c(HEARTS, 11),
      c(HEARTS, 12),
      c(HEARTS, 13),
      c(SPADES, 2),
    ];
    const u = applyGinAction(under, `knock:${c(CLUBS, 13)}`);
    expect(u.result!.kind).toBe('undercut');
    expect(u.result!.winner).toBe(1);
    expect(u.result!.points).toBe(25 + (8 - 2));
  });

  it('voids a hand when the stock runs down, ends the match at 100 and replays', () => {
    const rng = new Rng(3);
    let s = createGin(4);
    for (let k = 0; k < 3000 && s.winner === null; k++)
      s = applyGinAction(s, levelAction(s, 'medium', rng));
    expect(s.winner).not.toBeNull();
    expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(100);
    expect(replayGin(4, s.history)).toEqual(s);
    expect(isValidGinState(JSON.parse(JSON.stringify(s)))).toBe(true);
    // A hand where nobody knocks ends void with two cards left.
    let v = createGin(5);
    while (v.phase !== 'done') {
      const legal = legalGinActions(v);
      v = applyGinAction(
        v,
        legal.includes('draw:stock') ? 'draw:stock' : legal.find((a) => a.startsWith('discard:'))!,
      );
    }
    expect(v.result!.kind).toBe('void');
    expect(v.stock.length).toBeLessThanOrEqual(2);
  });
});

describe('Gin rummy opponents', () => {
  it('rates the undercut risk of a knock', () => {
    const s = applyGinAction(createGin(6), 'draw:stock');
    const rest = s.hands[0]!.slice(0, 10);
    const risk = undercutRisk(s, rest, 20, new Rng(1));
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(1);
    expect(legalGinActions(s)).toContain(levelAction(s, 'hard', new Rng(2)));
  });
});

describeAdapterContract(ginEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 100,
  allowTruncation: true,
  illegalActions: (s) =>
    ['discard:99', 'knock:99', 'x'].filter((a) => !legalGinActions(s).includes(a)),
});
