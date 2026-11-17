import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { COLS, ROWS, type Blocks, type Cell } from '../../shared/blocks/sim';
import { env } from '../ai-adapter';
import { DUEL } from '../definition';
import {
  addGarbage,
  attackFor,
  BLITZ_STEPS,
  marginFactor,
  newDuel,
  stepDuel,
  waiting,
  type Duel,
} from '../duel';

/** Four rows full but for column 0 over a bottom row with a hole elsewhere, and a vertical I over column 0. */
function quadReady(b: Blocks): Blocks {
  const board: (Cell | null)[] = [...b.board];
  for (let y = ROWS - 5; y < ROWS - 1; y++)
    for (let x = 1; x < COLS; x++) board[y * COLS + x] = 'G';
  for (let x = 0; x < COLS; x++) if (x !== 5) board[(ROWS - 1) * COLS + x] = 'G';
  return { ...b, board, piece: { kind: 'I', r: 1, x: -2, y: 0 }, prev: '' };
}

describe('Stack Duel attack table', () => {
  it('sends lines by clear type with back-to-back, combo and all-clear bonuses', () => {
    expect([1, 2, 3, 4].map((n) => attackFor(n, false, false, 0, false))).toEqual([0, 1, 2, 4]);
    expect([1, 2, 3].map((n) => attackFor(n, true, false, 0, false))).toEqual([2, 4, 6]);
    expect(attackFor(4, false, true, 0, false)).toBe(5);
    expect(attackFor(1, false, false, 4, false)).toBe(1);
    expect(attackFor(2, false, false, 0, true)).toBe(11);
    expect(marginFactor(60 * 60)).toBe(1);
    expect(marginFactor(90 * 60)).toBeCloseTo(1.1);
    expect(marginFactor(150 * 60)).toBeCloseTo(1.3);
  });

  it('a quad sends four rows of garbage, cancelling waiting garbage first', () => {
    let d = newDuel(1, 'versus', 'easy', 1);
    d = { ...d, boards: [quadReady(d.boards[0]), d.boards[1]] };
    d = stepDuel(d, 'H');
    expect(d.sent[0]).toBe(4);
    expect(waiting(d, 1)).toBe(4);
    expect(d.clears[0]?.parts).toEqual(['quad']);

    let c = newDuel(1, 'versus', 'easy', 1);
    c = {
      ...c,
      boards: [quadReady(c.boards[0]), c.boards[1]],
      incoming: [[{ lines: 3, hole: 2, ready: 0 }], []],
    };
    c = stepDuel(c, 'H');
    expect(waiting(c, 0)).toBe(0);
    expect(waiting(c, 1)).toBe(1);
  });

  it('garbage that has arrived comes up from the bottom when a piece locks without clearing', () => {
    let d = newDuel(2, 'versus', 'easy', 1);
    d = { ...d, incoming: [[{ lines: 10, hole: 3, ready: 0 }], []] };
    d = stepDuel(d, 'H');
    const board = d.boards[0].board;
    // Capped at eight rows, all with the hole in column 3.
    for (let y = ROWS - 8; y < ROWS; y++) {
      expect(board[y * COLS + 3]).toBeNull();
      expect(board.slice(y * COLS, (y + 1) * COLS).filter((c) => c === 'G')).toHaveLength(9);
    }
    expect(waiting(d, 0)).toBe(2);
    expect(d.events).toContain('garbage');
  });

  it('an all clear adds ten lines', () => {
    let d = newDuel(1, 'versus', 'easy', 1);
    const b = d.boards[0];
    const board: (Cell | null)[] = [...b.board];
    for (let y = ROWS - 4; y < ROWS; y++) for (let x = 1; x < COLS; x++) board[y * COLS + x] = 'G';
    d = {
      ...d,
      boards: [{ ...b, board, piece: { kind: 'I', r: 1, x: -2, y: 0 }, prev: '' }, d.boards[1]],
    };
    d = stepDuel(d, 'H');
    expect(d.sent[0]).toBe(14);
    expect(d.clears[0]?.parts).toEqual(['quad', 'allclear']);
    expect(d.allClears).toBe(1);
  });

  it('garbage pushing blocks out of the top tops the player out', () => {
    const b = newDuel(3, 'versus', 'easy', 1).boards[0];
    const full: Blocks = { ...b, board: b.board.map((_, i) => (i % COLS === 0 ? 'G' : null)) };
    expect(addGarbage(full, [{ hole: 0 }]).over).toBe(true);
    expect(addGarbage(b, [{ hole: 0 }]).over).toBe(false);
  });

  it('the half turn rotates a piece by 180 degrees', () => {
    let d = newDuel(4, 'sprint', 'easy', 1);
    const r = d.boards[0].piece!.r;
    d = stepDuel(d, 'F');
    expect(d.boards[0].piece!.r).toBe((r + 2) % 4);
  });
});

describe('Stack Duel matches', () => {
  it('a top-out loses the round; the match goes to the first to the target', () => {
    let d = newDuel(5, 'versus', 'medium', 2);
    const ko = (x: Duel, seat: 0 | 1): Duel => {
      const boards = [...x.boards] as Duel['boards'];
      boards[seat] = {
        ...boards[seat]!,
        board: boards[seat]!.board.map((_, i) => (i < 4 * COLS && i % COLS !== 0 ? 'G' : null)),
      };
      return {
        ...x,
        boards,
        incoming:
          seat === 0
            ? [[{ lines: 8, hole: 0, ready: 0 }], []]
            : [[], [{ lines: 8, hole: 0, ready: 0 }]],
      };
    };
    d = ko(d, 1);
    for (let i = 0; i < 400 && d.roundWinner === null; i++) d = stepDuel(d, 'idle');
    expect(d.roundWinner).toBe(0);
    expect(d.wins).toEqual([1, 0]);
    expect(d.over).toBe(false);
    for (let i = 0; i < 200 && d.round === 1; i++) d = stepDuel(d, 'idle');
    expect(d.round).toBe(2);
    expect(d.boards[0].board.every((c) => c === null)).toBe(true);
    d = ko(d, 1);
    for (let i = 0; i < 400 && !d.over; i++) d = stepDuel(d, 'idle');
    expect(d.over).toBe(true);
    expect(d.winner).toBe(0);
    expect(DUEL.result(d, {})).toMatchObject({ outcome: 'win', mode: 'versus-medium' });
  });

  it('blitz ends after two minutes; the bot plays sprint to 40 lines', () => {
    let d = newDuel(6, 'blitz', 'easy', 1);
    const play = DUEL.policies.bot!;
    for (let i = 0; i < BLITZ_STEPS + 5 && !d.over; i++) d = stepDuel(d, play(d));
    expect(d.over).toBe(true);
    expect(d.t).toBe(BLITZ_STEPS);
    expect(d.boards[0].lines).toBeGreaterThan(40);
    let s = newDuel(7, 'sprint', 'easy', 1);
    for (let i = 0; i < 60 * 60 * 3 && !s.over; i++) s = stepDuel(s, play(s));
    expect(s.boards[0].won).toBe(true);
    expect(DUEL.result(s, {})).toMatchObject({ outcome: 'complete', mode: 'sprint' });
  }, 60_000);

  it('the expert player beats the easy bot', () => {
    let d = newDuel(8, 'versus', 'easy', 1);
    const play = DUEL.policies.bot!;
    for (let i = 0; i < 60 * 60 * 6 && !d.over; i++) d = stepDuel(d, play(d));
    expect(d.winner).toBe(0);
    expect(d.sent[0]).toBeGreaterThan(0);
  }, 60_000);

  it('maps keys to actions', () => {
    const d = newDuel(1, 'versus', 'easy', 1);
    expect(DUEL.control(d, new Set(['left', 'up', 'fire'] as const), null)).toBe('LCH');
    expect(DUEL.control(d, new Set(['alt', 'hold'] as const), null)).toBe('FK');
    expect(DUEL.actions).toContain('LCH');
    expect(DUEL.actions).toContain('FK');
  });
});

describeAdapterContract(env, {
  configs: [undefined, { options: { mode: 'sprint' } }, { options: { mode: 'blitz' } }],
  playouts: 2,
  maxSteps: 60 * 60 * 15 + 1,
  illegalActions: () => ['jump', 'Q'],
});
