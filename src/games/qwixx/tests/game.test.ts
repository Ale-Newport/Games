import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { carefulAction, plannerAction, sheetValue } from '../ai';
import { rowsEnv } from '../ai-adapter';
import {
  act,
  decider,
  isValidRows,
  legalActions,
  markOptions,
  newRows,
  sheetScore,
  type RowsGame,
  type Sheet,
} from '../engine';

/** A game in its white step with the given dice. */
const thrown = (g: RowsGame, white: [number, number], colour: number[]): RowsGame => ({
  ...g,
  dice: { white, colour: colour.map((c, r) => (g.locked[r] ? null : c)) },
  phase: 'white',
  queue: Array.from({ length: g.players }, (_, i) => (g.active + i) % g.players),
  activeMarked: false,
  pending: [],
  newLocks: [],
});

const sheetWith = (marks: number[][], penalties = 0): Sheet => ({
  marks,
  locks: [false, false, false, false],
  penalties,
});

describe('Colour Rows rules', () => {
  it('everyone may cross the white sum, then the thrower a white plus a colour', () => {
    let g = thrown(newRows(2, 1), [3, 4], [1, 2, 5, 6]);
    expect(decider(g)).toBe(0);
    expect(markOptions(g)).toEqual([
      [0, 7],
      [1, 7],
      [2, 7],
      [3, 7],
    ]);
    g = act(g, 'mark:0:7');
    expect(decider(g)).toBe(1);
    g = act(g, 'mark:2:7');
    expect(g.phase).toBe('colour');
    expect(decider(g)).toBe(0);
    // Red (3+1, 4+1) is behind its 7 now; yellow 5, 6; green 8, 9; blue 9, 10.
    expect(markOptions(g)).toEqual([
      [1, 5],
      [1, 6],
      [2, 8],
      [2, 9],
      [3, 9],
      [3, 10],
    ]);
    g = act(g, 'mark:3:10');
    expect(g.phase).toBe('roll');
    expect(g.active).toBe(1);
    expect(g.sheets[0]!.marks).toEqual([[5], [], [], [2]]);
    expect(g.sheets[1]!.marks).toEqual([[], [], [5], []]);
    expect(g.event).toEqual({ penalty: null, locked: [] });
  });

  it('numbers are crossed left to right, and the thrower who crosses nothing takes a penalty', () => {
    let g: RowsGame = { ...newRows(1, 1), sheets: [sheetWith([[5], [9], [8], [8]])] };
    g = thrown(g, [1, 2], [6, 6, 6, 6]);
    // White 3: red and yellow are past it; green and blue (12→2) are at 4, so 3 is to the right.
    expect(markOptions(g).map(([r]) => r)).toEqual([2, 3]);
    g = act(g, 'pass');
    expect(g.phase).toBe('colour');
    g = act(g, 'pass');
    expect(g.sheets[0]!.penalties).toBe(1);
    expect(g.event).toEqual({ penalty: 0, locked: [] });
    expect(sheetScore(g.sheets[0]!)).toBe(4 * 1 - 5);
  });

  it('the last number needs five crosses, locks the row and counts double', () => {
    const four = sheetWith([[0, 1, 2, 3], [], [], []]);
    let g: RowsGame = {
      ...newRows(2, 1),
      sheets: [four, sheetWith([[0, 1, 2, 3, 4], [], [], []])],
    };
    g = thrown(g, [6, 6], [6, 6, 6, 6]);
    // Seat 0 has four crosses in red: 12 is not available there; seat 1 has five.
    expect(markOptions(g).some(([r]) => r === 0)).toBe(false);
    g = act(g, 'pass');
    expect(markOptions(g).some(([r, n]) => r === 0 && n === 12)).toBe(true);
    g = act(g, 'mark:0:12');
    // The lock applies once the white step ends: red's die is gone.
    expect(g.locked).toEqual([true, false, false, false]);
    expect(g.dice!.colour[0]).toBeNull();
    expect(g.sheets[1]!.locks[0]).toBe(true);
    // Five crosses plus the 12 plus the lock: 7 crosses, 28 points.
    expect(sheetScore(g.sheets[1]!)).toBe(28);
    g = act(g, 'pass');
    expect(g.event).toEqual({ penalty: 0, locked: [0] });
  });

  it('ends on a second locked row or a fourth penalty', () => {
    const g: RowsGame = { ...newRows(2, 1), locked: [true, false, false, false] };
    const rows = [[0, 1, 2, 3, 4, 5], [], [], []];
    let h = thrown(
      { ...g, sheets: [sheetWith([[], [0, 1, 2, 3, 4], [], []]), sheetWith(rows)] },
      [6, 6],
      [6, 6, 6, 6],
    );
    h = act(h, 'mark:1:12');
    h = act(h, 'pass');
    expect(h.phase).toBe('over');
    expect(legalActions(h)).toEqual([]);
    let p: RowsGame = thrown(
      { ...newRows(1, 1), sheets: [sheetWith([[9], [9], [0], [0]], 3)] },
      [1, 1],
      [1, 1, 1, 1],
    );
    p = act(act(p, 'pass'), 'pass');
    expect(p.phase).toBe('over');
    expect(p.sheets[0]!.penalties).toBe(4);
  });

  it('replays saved games', () => {
    let g = newRows(3, 7);
    for (let i = 0; i < 120 && g.phase !== 'over'; i++) g = act(g, plannerAction(g));
    expect(isValidRows(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidRows({ ...g, locked: [true, true, false, false] })).toBe(false);
    expect(isValidRows({ ...g, history: [...g.history, 'mark:9:9'] })).toBe(false);
  });
});

describe('Colour Rows players', () => {
  it('values sheets by crosses and the crosses still expected', () => {
    const g = newRows(1, 1);
    // A skip of four numbers is worth less than crossing the next number.
    expect(sheetValue(g, sheetWith([[0], [], [], []]))).toBeGreaterThan(
      sheetValue(g, sheetWith([[4], [], [], []])),
    );
    expect(sheetValue(g, sheetWith([[], [], [], []], 1))).toBeLessThan(
      sheetValue(g, sheetWith([[], [], [], []])),
    );
  });

  it('the planner outscores the careful player', () => {
    let wins = 0;
    for (let seed = 1; seed <= 60; seed++) {
      let g = newRows(2, seed);
      const me = seed & 1;
      while (g.phase !== 'over')
        g = act(g, decider(g) === me ? plannerAction(g) : carefulAction(g));
      if (sheetScore(g.sheets[me]!) > sheetScore(g.sheets[1 - me]!)) wins++;
    }
    expect(wins).toBeGreaterThan(45);
  });
});

describeAdapterContract(rowsEnv, {
  configs: [undefined, { players: 1 }, { players: 4 }],
  playouts: 2,
  maxSteps: 6000,
  illegalActions: (g) => ['jump', 'mark:0:13', 'roll'].filter((a) => !legalActions(g).includes(a)),
});
