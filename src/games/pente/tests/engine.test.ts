import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import {
  CENTER,
  SIZE,
  capturesAt,
  createState,
  isLegal,
  isValidState,
  legalMoves,
  play,
  replay,
  undo,
} from '../engine';

const at = (r: number, c: number) => r * SIZE + c;

/** Plays the opening (center, a reply, a legal tournament move) then the given moves. */
const opening = [CENTER, at(9, 10), at(3, 3)];

describe('Pente engine', () => {
  it('requires the first stone on the center and applies the tournament rule', () => {
    const s = createState();
    expect(legalMoves(s)).toEqual([CENTER]);
    const s2 = play(play(s, CENTER), at(8, 8));
    expect(isLegal(s2, at(9, 11))).toBe(false); // distance 2
    expect(isLegal(s2, at(9, 12))).toBe(true); // distance 3
    expect(isLegal(s2, at(6, 6))).toBe(true);
    const s3 = play(s2, at(6, 6));
    expect(isLegal(s3, at(9, 11))).toBe(true); // the rule only constrains move 3
  });

  it('captures exactly two bracketed stones, in any direction, possibly several at once', () => {
    // Black at (5,5); White at (5,6),(5,7); Black plays (5,8) → captures the pair.
    let s = replay([...opening, at(5, 6), at(5, 5), at(5, 7)]);
    expect(s.toMove).toBe(0);
    s = play(s, at(5, 8));
    expect(s.board[at(5, 6)]).toBe(0);
    expect(s.board[at(5, 7)]).toBe(0);
    expect(s.captures).toEqual([1, 0]);
    expect(s.lastCaptured).toEqual([at(5, 6), at(5, 7)]);
    // Three stones in a row are not captured.
    const b = createState().board.slice();
    b[at(2, 2)] = 1;
    b[at(2, 3)] = 2;
    b[at(2, 4)] = 2;
    b[at(2, 5)] = 2;
    expect(capturesAt(b, at(2, 6), 0)).toEqual([]);
    // Double capture from one stone.
    const d = createState().board.slice();
    d[at(10, 10)] = 1;
    d[at(10, 11)] = 2;
    d[at(10, 12)] = 2;
    d[at(13, 13)] = 1;
    d[at(12, 13)] = 2;
    d[at(11, 13)] = 2;
    expect(capturesAt(d, at(10, 13), 0).sort((a, b) => a - b)).toEqual([
      at(10, 11),
      at(10, 12),
      at(11, 13),
      at(12, 13),
    ]);
  });

  it('a stone placed between two enemies is not captured (no suicide capture)', () => {
    // White at (4,4) and (4,7); Black places (4,5) then (4,6): Black's pair is now bracketed but safe.
    let s = replay([...opening, at(4, 4), at(4, 5), at(4, 7), at(4, 6)]);
    expect(s.board[at(4, 5)]).toBe(1);
    expect(s.board[at(4, 6)]).toBe(1);
    expect(s.captures).toEqual([0, 0]);
    s = play(s, at(12, 12));
    expect(s.board[at(4, 5)]).toBe(1);
  });

  it('wins by five in a row and by five captured pairs', () => {
    const five = replay([
      ...opening,
      at(0, 0),
      at(3, 4),
      at(0, 2),
      at(3, 5),
      at(0, 4),
      at(3, 6),
      at(0, 6),
      at(3, 7),
    ]);
    expect(five.result).toMatchObject({ kind: 'win', winner: 0, reason: 'five' });
    const s = createState();
    const near = {
      ...s,
      history: [1, 2, 3],
      captures: [4, 0] as [number, number],
      toMove: 0 as const,
    };
    near.board[at(5, 5)] = 1;
    near.board[at(5, 6)] = 2;
    near.board[at(5, 7)] = 2;
    const won = play(near, at(5, 8));
    expect(won.result).toMatchObject({ kind: 'win', winner: 0, reason: 'captures' });
  });

  it('undoes by replay and validates states (randomized)', () => {
    const rng = new Rng(3);
    for (let g = 0; g < 20; g++) {
      let s = createState();
      for (let k = 0; k < 80 && !s.result; k++) s = play(s, rng.pick(legalMoves(s)));
      expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
      expect(undo(s, 2).history).toEqual(s.history.slice(0, -2));
    }
    const s = replay([CENTER]);
    expect(isValidState({ ...s, captures: [1, 0] })).toBe(false);
  });
});
