import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  applyMove,
  initialState,
  isPlayable,
  isValidDraughtsState,
  legalMoves,
  positionKey,
  type DraughtsState,
  type DraughtsVariant,
  type Piece,
} from '../engine';
import { ENGLISH, INTERNATIONAL, SPANISH } from '../variants';

/** Board from rows of text: '.' empty, 'w' seat-0 man, 'W' seat-0 king, 'b' seat-1 man, 'B' seat-1 king. */
function position(v: DraughtsVariant, rows: string[], toMove: 0 | 1 = 0): DraughtsState {
  const n = v.size;
  const board = new Array<Piece>(n * n).fill(0);
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      const i = r * n + c;
      const p = ({ w: 1, W: 2, b: 3, B: 4 } as Record<string, Piece>)[ch];
      if (p) {
        if (!isPlayable(v, i)) throw new Error(`(${r},${c}) is not a playable square`);
        board[i] = p;
      }
    }),
  );
  const s: DraughtsState = {
    board,
    toMove,
    history: [],
    noProgress: 0,
    recent: [],
    endgamePlies: 0,
    result: null,
  };
  return { ...s, recent: [positionKey(s)] };
}
const sq = (v: DraughtsVariant, r: number, c: number) => r * v.size + c;
/** Position from explicit [row, col, piece] triples (playability is checked). */
function place(
  v: DraughtsVariant,
  pieces: [number, number, 'w' | 'W' | 'b' | 'B'][],
  toMove: 0 | 1 = 0,
): DraughtsState {
  const rows = Array.from({ length: v.size }, () => '.'.repeat(v.size).split(''));
  for (const [r, c, ch] of pieces) rows[r]![c] = ch;
  return position(
    v,
    rows.map((r) => r.join('')),
    toMove,
  );
}
const sorted = (moves: number[][]) => moves.map((m) => m.join('-')).sort();

describe('English checkers', () => {
  const v = ENGLISH;
  it('starts with 12 men each and 7 opening moves', () => {
    const s = initialState(v);
    expect(s.board.filter((p) => p === 1)).toHaveLength(12);
    expect(s.board.filter((p) => p === 3)).toHaveLength(12);
    expect(legalMoves(v, s)).toHaveLength(7);
  });

  it('makes captures mandatory and lets the player choose any capture sequence', () => {
    // White man (5,2) can take (4,1)→(3,0), or (4,3)→(3,4) and then (2,5)→(1,6).
    const s = place(v, [
      [5, 2, 'w'],
      [7, 6, 'w'],
      [4, 1, 'b'],
      [4, 3, 'b'],
      [2, 5, 'b'],
    ]);
    expect(sorted(legalMoves(v, s))).toEqual(
      sorted([
        [sq(v, 5, 2), sq(v, 3, 0)],
        [sq(v, 5, 2), sq(v, 3, 4), sq(v, 1, 6)],
      ]),
    );
    const after = applyMove(v, s, [sq(v, 5, 2), sq(v, 3, 4), sq(v, 1, 6)]);
    expect(after.board[sq(v, 4, 3)]).toBe(0);
    expect(after.board[sq(v, 2, 5)]).toBe(0);
    expect(after.board[sq(v, 4, 1)]).toBe(3);
    expect(() => applyMove(v, s, [sq(v, 7, 6), sq(v, 6, 5)])).toThrow(); // quiet move while a capture exists
  });

  it('men never capture backward', () => {
    const s = place(v, [
      [5, 2, 'w'],
      [6, 1, 'b'],
    ]);
    expect(legalMoves(v, s).every((m) => m.length === 2)).toBe(true);
    expect(legalMoves(v, s)).not.toContainEqual([sq(v, 5, 2), sq(v, 7, 0)]);
  });

  it('crowning during a capture ends the move', () => {
    // (2,3) jumps (1,4) to (0,5) and is crowned; as a king it could take (1,6) next, but the move ends.
    const s = place(v, [
      [2, 3, 'w'],
      [1, 4, 'b'],
      [1, 6, 'b'],
    ]);
    expect(legalMoves(v, s)).toEqual([[sq(v, 2, 3), sq(v, 0, 5)]]);
    const after = applyMove(v, s, [sq(v, 2, 3), sq(v, 0, 5)]);
    expect(after.board[sq(v, 0, 5)]).toBe(2);
    expect(after.board[sq(v, 1, 6)]).toBe(3);
  });

  it('kings move one step in all four directions', () => {
    const s = place(v, [
      [3, 2, 'W'],
      [0, 7, 'b'],
    ]);
    expect(sorted(legalMoves(v, s))).toEqual(
      sorted([
        [sq(v, 3, 2), sq(v, 2, 1)],
        [sq(v, 3, 2), sq(v, 2, 3)],
        [sq(v, 3, 2), sq(v, 4, 1)],
        [sq(v, 3, 2), sq(v, 4, 3)],
      ]),
    );
  });

  it('wins when the opponent cannot move, draws by repetition and by the 40-move rule', () => {
    const win = applyMove(
      v,
      place(v, [
        [5, 2, 'w'],
        [4, 3, 'b'],
      ]),
      [sq(v, 5, 2), sq(v, 3, 4)],
    );
    expect(win.result).toEqual({ kind: 'win', winner: 0, reason: 'no-moves' });
    let k = place(v, [
      [7, 6, 'W'],
      [0, 1, 'B'],
    ]);
    const cycle = [
      [sq(v, 7, 6), sq(v, 6, 7)],
      [sq(v, 0, 1), sq(v, 1, 0)],
      [sq(v, 6, 7), sq(v, 7, 6)],
      [sq(v, 1, 0), sq(v, 0, 1)],
    ];
    let plies = 0;
    for (let round = 0; round < 2; round++)
      for (const m of cycle) {
        if (k.result) continue;
        k = applyMove(v, k, m);
        plies++;
      }
    expect(k.result).toEqual({ kind: 'draw', reason: 'repetition' });
    expect(plies).toBe(8);
    const quiet = {
      ...place(v, [
        [7, 6, 'W'],
        [0, 1, 'B'],
      ]),
      noProgress: 79,
    };
    expect(applyMove(v, quiet, [sq(v, 7, 6), sq(v, 6, 5)]).result).toEqual({
      kind: 'draw',
      reason: 'no-progress',
    });
  });
});

describe('International draughts', () => {
  const v = INTERNATIONAL;
  it('starts with 20 men each and 9 opening moves', () => {
    const s = initialState(v);
    expect(s.board.filter((p) => p === 1)).toHaveLength(20);
    expect(legalMoves(v, s)).toHaveLength(9);
  });

  it('men capture backward and the majority capture is compulsory', () => {
    const back = place(v, [
      [5, 4, 'w'],
      [6, 5, 'b'],
    ]);
    expect(legalMoves(v, back)).toEqual([[sq(v, 5, 4), sq(v, 7, 6)]]);
    // (5,4): x(4,3)→(3,2) takes one; x(4,5)→(3,6) then x(2,5)→(1,4) takes two → only the double is legal.
    const majority = place(v, [
      [5, 4, 'w'],
      [4, 3, 'b'],
      [4, 5, 'b'],
      [2, 5, 'b'],
    ]);
    expect(legalMoves(v, majority)).toEqual([[sq(v, 5, 4), sq(v, 3, 6), sq(v, 1, 4)]]);
  });

  it('kings fly and capture at a distance with a choice of landing squares', () => {
    const flying = place(v, [
      [8, 1, 'W'],
      [6, 3, 'b'],
    ]);
    expect(sorted(legalMoves(v, flying))).toEqual(
      sorted([5, 4, 3, 2, 1, 0].map((r) => [sq(v, 8, 1), sq(v, r, 9 - r)])),
    );
    const after = applyMove(v, flying, [sq(v, 8, 1), sq(v, 2, 7)]);
    expect(after.board[sq(v, 6, 3)]).toBe(0);
    expect(after.board[sq(v, 2, 7)]).toBe(2);
    const quiet = place(v, [
      [9, 0, 'W'],
      [0, 9, 'b'],
    ]);
    // The long diagonal is empty up to the black man: the king can stop on any of the 8 squares before it.
    expect(legalMoves(v, quiet).filter((m) => m[0] === sq(v, 9, 0))).toHaveLength(8);
  });

  it('a man passing the crown row during a capture stays a man', () => {
    // (2,3) takes (1,4) landing on the crown row (0,5), then takes (1,6) backward to (2,7).
    const s = place(v, [
      [2, 3, 'w'],
      [1, 4, 'b'],
      [1, 6, 'b'],
      [9, 8, 'b'],
    ]);
    expect(legalMoves(v, s)).toEqual([[sq(v, 2, 3), sq(v, 0, 5), sq(v, 2, 7)]]);
    expect(applyMove(v, s, legalMoves(v, s)[0]!).board[sq(v, 2, 7)]).toBe(1);
  });

  it('applies the FMJD count: three pieces (one a king) against a lone king is drawn after 16 moves each', () => {
    const s = place(v, [
      [9, 0, 'W'],
      [9, 2, 'w'],
      [9, 4, 'w'],
      [0, 1, 'B'],
    ]);
    const first = applyMove(v, s, [sq(v, 9, 0), sq(v, 8, 1)]);
    expect(first.endgamePlies).toBe(1);
    const nearly = { ...s, endgamePlies: 31 };
    // A king move keeps the configuration; it reaches 32 plies → draw.
    expect(applyMove(v, nearly, [sq(v, 9, 0), sq(v, 8, 1)]).result).toEqual({
      kind: 'draw',
      reason: 'endgame-count',
    });
  });
});

describe('Spanish checkers', () => {
  const v = SPANISH;
  it('starts with 12 men each on the other color and 7 opening moves', () => {
    const s = initialState(v);
    expect(s.board.filter((p) => p === 1)).toHaveLength(12);
    expect(legalMoves(v, s)).toHaveLength(7);
    expect(isPlayable(v, 0)).toBe(true);
  });

  it('must capture the most pieces, then the most kings', () => {
    // Two single captures for White: (5,5)x(4,4) a man, or (5,3)x(4,2) a king → must take the king.
    const s = position(v, [
      '........',
      '........',
      '........',
      '........',
      '..B.b...',
      '...w.w..',
      '........',
      '........',
    ]);
    expect(legalMoves(v, s)).toEqual([[sq(v, 5, 3), sq(v, 3, 1)]]);
  });
});

describe('all variants (randomized)', () => {
  it('play complete random games that end and replay identically', () => {
    for (const v of [ENGLISH, INTERNATIONAL, SPANISH]) {
      const rng = new Rng(9);
      for (let g = 0; g < 15; g++) {
        let s = initialState(v);
        let plies = 0;
        while (!s.result && plies < 2000) {
          const moves = legalMoves(v, s);
          expect(moves.length).toBeGreaterThan(0);
          s = applyMove(v, s, rng.pick(moves));
          plies++;
        }
        expect(s.result).not.toBeNull();
        expect(isValidDraughtsState(v, JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
  }, 60_000);
});
