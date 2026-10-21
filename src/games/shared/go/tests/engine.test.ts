import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  PASS,
  applyGoAction,
  areaScore,
  createGoState,
  isLegalPoint,
  isValidGoState,
  legalGoActions,
  replayGo,
  type GoRules,
} from '../engine';

const R5: GoRules = { size: 5, komi: 0.5, maxPlies: 75 };
const at = (r: number, c: number) => r * 5 + c;
/** Plays alternating moves from the start; PASS keeps the alternation. */
const play = (moves: number[]) => replayGo(R5, moves);

describe('go rules', () => {
  it('captures a stone without liberties and counts the capture', () => {
    // Black surrounds the white stone on (1,1).
    const s = play([at(0, 1), at(1, 1), at(1, 0), PASS, at(1, 2), PASS, at(2, 1)]);
    expect(s.board[at(1, 1)]).toBe(0);
    expect(s.captures).toEqual([1, 0]);
  });

  it('forbids suicide but allows a move that captures first', () => {
    // White on the corner (0,0) is surrounded on (0,1) and (1,0) by Black? Build: Black 0,1 and 1,0.
    const s = play([at(0, 1), PASS, at(1, 0)]);
    expect(isLegalPoint(s, at(0, 0))).toBe(false); // White at the corner would have no liberty
    // If the white stone captures, it is legal: White surrounds (0,1) first.
    const t = play([at(0, 1), at(0, 2), at(1, 0), at(1, 1), PASS]);
    expect(isLegalPoint(t, at(0, 0))).toBe(true);
    const after = applyGoAction(R5, t, at(0, 0));
    expect(after.board[at(0, 1)]).toBe(0);
  });

  it('forbids immediately retaking a ko (positional superko)', () => {
    // A ko shape in the middle: Black takes on (1,2); White may not retake at once.
    const moves = [at(0, 2), at(0, 3), at(1, 1), at(1, 4), at(2, 2), at(2, 3), PASS, at(1, 2)];
    let s = play(moves);
    expect(s.board[at(1, 2)]).toBe(2);
    s = applyGoAction(R5, s, at(1, 3)); // Black captures the white stone on (1,2)
    expect(s.board[at(1, 2)]).toBe(0);
    expect(isLegalPoint(s, at(1, 2))).toBe(false); // retaking would repeat the board
    s = applyGoAction(R5, s, at(4, 4)); // a ko threat elsewhere
    s = applyGoAction(R5, s, at(4, 0));
    expect(isLegalPoint(s, at(1, 2))).toBe(true);
  });

  it('ends after two passes and scores area plus komi', () => {
    // Black owns the left two columns, White the right two; the middle column is neutral.
    const board = [1, 1, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0, 2, 2];
    expect(areaScore(board, 5).black).toBe(10);
    expect(areaScore(board, 5).white).toBe(10);
    const walls = [1, 0, 1, 2, 0, 1, 1, 1, 2, 2, 0, 1, 0, 2, 0, 1, 1, 1, 2, 2, 1, 0, 1, 2, 0];
    const score = areaScore(walls, 5);
    // 11 black stones + 3 black points ((0,1), (2,0), (4,1)); (2,2) touches both colors.
    expect([score.black, score.white]).toEqual([14, 10]);
    expect(score.territory[at(2, 2)]).toBe(0);
    expect(score.territory[at(0, 1)]).toBe(1);
    expect(score.territory[at(0, 4)]).toBe(2);
    const ended = play([at(2, 2), PASS, PASS]);
    expect(ended.result).toEqual({ kind: 'win', winner: 0, reason: 'score', score: [25, 0.5] });
  });

  it('plays random games that end and validate by replay', () => {
    const rng = new Rng(6);
    for (let g = 0; g < 10; g++) {
      let s = createGoState(R5);
      while (!s.result) s = applyGoAction(R5, s, rng.pick(legalGoActions(s)));
      expect(isValidGoState(R5, JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(isValidGoState(R5, { ...s, captures: [9, 9] })).toBe(false);
    }
  });
});
