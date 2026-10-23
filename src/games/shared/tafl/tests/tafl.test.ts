import { describe, expect, it } from 'vitest';
import {
  HNEFATAFL,
  TABLUT,
  applyTaflAction,
  createTaflState,
  destinations,
  kingCaptured,
  legalTaflActions,
  type TaflState,
  type TaflVariant,
} from '../engine';
import { taflCodec } from '../environment';

const blank = (v: TaflVariant, pieces: Record<number, number>, toMove: 0 | 1 = 0): TaflState => {
  const board = new Array<number>(v.size * v.size).fill(0);
  for (const [p, piece] of Object.entries(pieces)) board[Number(p)] = piece;
  return { board, toMove, history: [], keys: [], result: null };
};

describe('tafl engine', () => {
  it('sets up 24 + 12 + king on 11×11 and 16 + 8 + king on 9×9', () => {
    const h = createTaflState(HNEFATAFL).board;
    expect([
      h.filter((x) => x === 1).length,
      h.filter((x) => x === 2).length,
      h.indexOf(3),
    ]).toEqual([24, 12, 60]);
    const t = createTaflState(TABLUT).board;
    expect([
      t.filter((x) => x === 1).length,
      t.filter((x) => x === 2).length,
      t.indexOf(3),
    ]).toEqual([16, 8, 40]);
  });

  it('moves like a rook; only the king may stop on the throne or corners', () => {
    const s = blank(HNEFATAFL, { 55: 1, 0: 0 });
    const dests = destinations(HNEFATAFL, s.board, 55); // f6, row 5 col 0
    expect(dests).toContain(56);
    expect(dests).not.toContain(0); // corner via the column
    const row = blank(HNEFATAFL, { 56: 1 });
    // Along row 5 an attacker passes over the empty throne (60) but cannot stop on it.
    expect(destinations(HNEFATAFL, row.board, 56)).toContain(61);
    expect(destinations(HNEFATAFL, row.board, 56)).not.toContain(60);
    const king = blank(HNEFATAFL, { 11: 3 });
    expect(destinations(HNEFATAFL, king.board, 11)).toContain(0);
  });

  it('captures by sandwich, against hostile squares, but not by moving between two enemies', () => {
    // Attacker moves to sandwich a defender against another attacker.
    const s = blank(HNEFATAFL, { 34: 1, 36: 2, 37: 1, 120: 3 });
    expect(applyTaflAction(HNEFATAFL, s, '34-35').board[36]).toBe(0);
    // Against a corner.
    const c = blank(HNEFATAFL, { 1: 2, 13: 1, 120: 3 });
    expect(applyTaflAction(HNEFATAFL, c, '13-2').board[1]).toBe(0);
    // A defender stepping between two attackers survives.
    const safe = blank(HNEFATAFL, { 34: 1, 36: 1, 46: 2, 120: 3 }, 1);
    expect(applyTaflAction(HNEFATAFL, safe, '46-35').board[35]).toBe(2);
  });

  it('Hnefatafl: the king falls only when closed in on four sides, and wins in a corner', () => {
    const k = 24; // c9, with an attacker on f9 ready to slide in
    const ring = blank(HNEFATAFL, {
      [k]: 3,
      [k - 11]: 1,
      [k + 11]: 1,
      [k - 1]: 1,
      [k + 1]: 0,
      [k + 3]: 1,
    });
    expect(kingCaptured(HNEFATAFL, ring.board, k)).toBe(false);
    const done = applyTaflAction(HNEFATAFL, ring, `${k + 3}-${k + 1}`);
    expect(done.result).toEqual({ winner: 0, reason: 'king' });
    const run = blank(HNEFATAFL, { 5: 3, 60: 1 }, 1);
    expect(applyTaflAction(HNEFATAFL, run, '5-0').result).toEqual({ winner: 1, reason: 'escape' });
  });

  it('Tablut: away from the throne two attackers capture the king; any edge square is an escape', () => {
    const s = blank(TABLUT, { 20: 3, 19: 1, 23: 1 });
    expect(applyTaflAction(TABLUT, s, '23-21').result).toEqual({ winner: 0, reason: 'king' });
    const edge = blank(TABLUT, { 20: 3, 70: 1 }, 1);
    expect(applyTaflAction(TABLUT, edge, '20-2').result).toEqual({ winner: 1, reason: 'escape' });
  });

  it('opens with legal attacker moves and encodes them', () => {
    const moves = legalTaflActions(HNEFATAFL, createTaflState(HNEFATAFL));
    expect(moves.length).toBeGreaterThan(80);
    const codec = taflCodec(HNEFATAFL);
    for (const a of moves.slice(0, 20)) expect(codec.decode(codec.encode(a))).toBe(a);
  });
});
