import { describe, expect, it } from 'vitest';
import {
  applyJumpRaceAction,
  createJumpRaceState,
  destinations,
  isValidJumpRaceState,
  jumpPath,
  legalJumpRaceActions,
  reachable,
  replayJumpRace,
  squareGeometry,
  starGeometry,
  type JumpRaceState,
  type JumpRaceVariant,
} from '../engine';
import { evaluateJumpRace, jumpRaceCodec } from '../environment';

const halma: JumpRaceVariant = {
  id: 'halma',
  shape: 'square',
  geometry: squareGeometry(16, 5),
  plyLimit: 600,
};
const star: JumpRaceVariant = { id: 'cc', shape: 'star', geometry: starGeometry(), plyLimit: 400 };
const sq = (x: number, y: number) => y * 16 + x;
const emptyBoard = (v: JumpRaceVariant) => new Array<number>(v.geometry.xy.length).fill(0);
const at = (board: number[], toMove: 0 | 1 = 0): JumpRaceState => ({
  board,
  toMove,
  first: 0,
  history: [],
  result: null,
});

describe('jump-race geometry', () => {
  it('builds the classic Halma camps of 19 in opposite corners', () => {
    const [c0, c1] = halma.geometry.camps;
    expect(c0).toHaveLength(19);
    expect(c1).toHaveLength(19);
    expect(c1).toContain(sq(0, 0));
    expect(c1).toContain(sq(4, 1));
    expect(c1).not.toContain(sq(5, 0));
    expect(c0).toContain(sq(15, 15));
  });

  it('builds the 121-hole star with points of ten', () => {
    const g = star.geometry;
    expect(g.xy).toHaveLength(121);
    expect(g.camps[0]).toHaveLength(10);
    expect(g.camps[1]).toHaveLength(10);
    // Six neighbors in the middle, two at a tip.
    const center = g.xy.findIndex((p) => Math.abs(p.x) < 1e-9 && Math.abs(p.y) < 1e-9);
    expect(g.neighbors.filter((d) => d[center]! >= 0)).toHaveLength(6);
    const tip = g.camps[1].find((c) => g.dist[0][c] === 0)!;
    expect(g.neighbors.filter((d) => d[tip]! >= 0)).toHaveLength(2);
  });

  it('makes the target camp the unique closest arrangement', () => {
    for (const v of [halma, star]) {
      const d = v.geometry.dist[0];
      const camp = new Set(v.geometry.camps[1]);
      const worstIn = Math.max(...[...camp].map((c) => d[c]!));
      const bestOut = Math.min(...d.filter((_, c) => !camp.has(c)));
      expect(bestOut).toBeGreaterThan(worstIn);
    }
  });
});

describe('jump-race moves', () => {
  it('steps in eight directions and chains jumps over either color', () => {
    const b = emptyBoard(halma);
    b[sq(5, 5)] = 1;
    b[sq(6, 5)] = 2; // jump east to (7,5)
    b[sq(7, 6)] = 1; // then south over (7,6) to (7,7)
    const r = reachable(halma, b, sq(5, 5));
    expect(r).toContain(sq(4, 4)); // a diagonal step
    expect(r).toContain(sq(7, 5));
    expect(r).toContain(sq(7, 7));
    expect(r).not.toContain(sq(6, 5));
    expect(jumpPath(halma, b, sq(5, 5), sq(7, 7))).toEqual([sq(5, 5), sq(7, 5), sq(7, 7)]);
  });

  it('keeps pieces that reached the far camp inside it', () => {
    const b = emptyBoard(halma);
    b[sq(2, 2)] = 1; // inside seat 0's target (top-left camp)
    b[sq(10, 10)] = 2;
    const s = at(b);
    const d = destinations(halma, s, sq(2, 2));
    expect(d.length).toBeGreaterThan(0);
    expect(d.every((c) => halma.geometry.camps[1].includes(c))).toBe(true);
    expect(d).not.toContain(sq(3, 3)); // x + y = 6 is outside the camp
  });

  it('wins when the far camp is full with at least one own piece', () => {
    const b = emptyBoard(halma);
    const camp = halma.geometry.camps[1];
    const hole = sq(4, 1);
    camp.forEach((c, i) => (b[c] = i < 3 ? 2 : 1)); // three blockers stayed home
    b[hole] = 0;
    // An own piece just outside the last hole steps in.
    const from = sq(5, 1);
    b[from] = 1;
    b[sq(12, 12)] = 2;
    const won = applyJumpRaceAction(halma, at(b), `${from}-${hole}`);
    expect(won.result).toEqual({ winner: 0, reason: 'camp' });
  });

  it('rejects illegal moves and validates by replay', () => {
    let s = createJumpRaceState(halma, 1);
    expect(s.toMove).toBe(1);
    expect(() => applyJumpRaceAction(halma, s, '0-200')).toThrow();
    for (let i = 0; i < 12; i++)
      s = applyJumpRaceAction(halma, s, legalJumpRaceActions(halma, s)[i]!);
    expect(replayJumpRace(halma, s.history, 1)).toEqual(s);
    expect(isValidJumpRaceState(halma, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidJumpRaceState(halma, { ...s, first: 0 })).toBe(false);
    expect(isValidJumpRaceState(halma, { ...s, board: s.board.map((x) => (x ? 1 : 0)) })).toBe(
      false,
    );
  });

  it('decides the move limit by the distance left', () => {
    const v = { ...halma, plyLimit: 1 };
    const s = applyJumpRaceAction(
      v,
      createJumpRaceState(v),
      legalJumpRaceActions(v, createJumpRaceState(v))[0]!,
    );
    expect(s.result?.reason).toBe('limit');
    expect(s.result?.winner).toBe(0);
  });

  it('codes moves and scores the race symmetrically', () => {
    const codec = jumpRaceCodec(star);
    expect(codec.decode(codec.encode('17-104'))).toBe('17-104');
    const s = createJumpRaceState(star);
    expect(evaluateJumpRace(star, s, 0)).toBeCloseTo(0);
    const ahead = applyJumpRaceAction(
      star,
      s,
      legalJumpRaceActions(star, s).find((a) => {
        const [f, t] = a.split('-').map(Number) as [number, number];
        return star.geometry.dist[0][t]! < star.geometry.dist[0][f]!;
      })!,
    );
    expect(evaluateJumpRace(star, ahead, 0)).toBeGreaterThan(0);
    expect(evaluateJumpRace(star, ahead, 1)).toBeLessThan(0);
  });
});
