import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { CLUBS, DIAMONDS, HEARTS, SPADES, makeCard as c } from '../../shared/cards/cards';
import { AGENT_PRESETS, freeCellKey, solveFreeCell } from '../ai';
import { freeCellEnv } from '../ai-adapter';
import { FREECELL as def } from '../definition';
import {
  applyFreeCellMove,
  dealFreeCell,
  isValidFreeCellState,
  isLegalFreeCellMove,
  legalFreeCellMoves,
  maxRun,
  replayFreeCell,
  safeAutoMove,
  type FreeCellState,
} from '../engine';

const suit = (s: 0 | 1 | 2 | 3, upTo = 13) => Array.from({ length: upTo }, (_, i) => c(s, i + 1));
const blank = (over: Partial<FreeCellState>): FreeCellState => ({
  seed: 1,
  columns: [[], [], [], [], [], [], [], []],
  cells: [-1, -1, -1, -1],
  foundations: [[], [], [], []],
  history: [],
  result: null,
  ...over,
});

describe('FreeCell engine', () => {
  it('deals every card face up into 7, 7, 7, 7, 6, 6, 6, 6', () => {
    const s = dealFreeCell(9);
    expect(s.columns.map((p) => p.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
    expect(new Set(s.columns.flat()).size).toBe(52);
    expect(dealFreeCell(9)).toEqual(s);
  });

  it('limits runs by free cells and empty columns', () => {
    const s = blank({ columns: [[c(SPADES, 9)], [], [], [], [], [], [], []] });
    // 4 free cells, 6 empty columns besides the target: (4 + 1) · 2^6.
    expect(maxRun(s, true)).toBe(5 * 64);
    const full = blank({
      cells: [1, 2, 3, -1],
      columns: [[5], [6], [7], [8], [9], [10], [11], [12]],
    });
    expect(maxRun(full, false)).toBe(2);
  });

  it('moves runs only when there is room for them', () => {
    const others = [
      [c(SPADES, 2)],
      [c(CLUBS, 2)],
      [c(HEARTS, 3)],
      [c(DIAMONDS, 3)],
      [c(SPADES, 4)],
      [c(CLUBS, 4)],
    ];
    // Q♥ J♣ 10♦ onto the K♣.
    const s = blank({
      columns: [
        [c(CLUBS, 5), c(HEARTS, 12), c(CLUBS, 11), c(DIAMONDS, 10)],
        [c(CLUBS, 13)],
        ...others,
      ],
    });
    expect(legalFreeCellMoves(s)).toContain('c0:1>c1');
    const tight = { ...s, cells: [c(HEARTS, 1), c(HEARTS, 2), c(DIAMONDS, 1), c(DIAMONDS, 2)] };
    expect(maxRun(tight, false)).toBe(1);
    expect(legalFreeCellMoves(tight)).not.toContain('c0:1>c1');
  });

  it('parks cards in free cells and plays them back', () => {
    const s = blank({
      columns: [[c(SPADES, 9)], [c(HEARTS, 10)], [c(CLUBS, 2)], [], [], [], [], []],
    });
    expect(legalFreeCellMoves(s).filter((m) => m.startsWith('c0>r'))).toEqual([
      'c0>r0',
      'c0>r1',
      'c0>r2',
      'c0>r3',
    ]);
    const parked = applyFreeCellMove(s, 'c0>r2');
    expect(parked.cells).toEqual([-1, -1, c(SPADES, 9), -1]);
    expect(legalFreeCellMoves(parked)).toContain('r2>c1');
    expect(applyFreeCellMove(parked, 'r2>c1').columns[1]).toEqual([c(HEARTS, 10), c(SPADES, 9)]);
  });

  it('sends only safe cards home automatically, and wins', () => {
    const s = blank({
      foundations: [suit(SPADES, 2), suit(HEARTS, 1), [], []],
      columns: [[c(SPADES, 3)], [c(DIAMONDS, 1)], [], [], [], [], [], []],
    });
    expect(safeAutoMove(s)).toBe('c1>f2'); // the ace first; the 3♠ waits for the red twos
    const nearly = blank({
      foundations: [suit(SPADES), suit(HEARTS), suit(DIAMONDS), suit(CLUBS, 12)],
      cells: [c(CLUBS, 13), -1, -1, -1],
    });
    expect(applyFreeCellMove(nearly, 'r0>f3').result).toBe('won');
  });

  it('loses when no move is left', () => {
    const stuck = blank({
      cells: [c(HEARTS, 9), c(HEARTS, 7), c(HEARTS, 5), c(HEARTS, 3)],
      columns: [
        [c(SPADES, 9), c(DIAMONDS, 9)],
        [c(SPADES, 7), c(DIAMONDS, 7)],
        [c(SPADES, 5), c(DIAMONDS, 5)],
        [c(SPADES, 3), c(DIAMONDS, 3)],
        [c(CLUBS, 9), c(HEARTS, 13)],
        [c(CLUBS, 7), c(DIAMONDS, 13)],
        [c(CLUBS, 5), c(HEARTS, 11)],
        [c(CLUBS, 3), c(DIAMONDS, 12)],
      ],
    });
    expect(legalFreeCellMoves(stuck)).toEqual([]);
  });

  it('agrees with the full move list when checking a single move', () => {
    const every: string[] = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 4; j++) every.push(`c${i}>f${j}`, `c${i}>r${j}`, `r${j}>c${i}`);
      for (let j = 0; j < 8; j++) for (let k = 0; k < 20; k++) every.push(`c${i}:${k}>c${j}`);
    }
    for (let r = 0; r < 4; r++) for (let j = 0; j < 4; j++) every.push(`r${r}>f${j}`);
    for (const seed of [1, 2, 3]) {
      let s = dealFreeCell(seed);
      for (let step = 0; step < 150 && !s.result; step++) {
        const legal = legalFreeCellMoves(s).sort();
        expect(every.filter((m) => isLegalFreeCellMove(s, m)).sort()).toEqual(legal);
        s = applyFreeCellMove(s, legal[(step * 5) % legal.length]!);
      }
    }
  });

  it('always ends: random play stops by the move cap at the latest', async () => {
    const { Rng } = await import('../../../core/game-engine/random');
    const rng = new Rng(3);
    let s = dealFreeCell(1);
    while (!s.result) s = applyFreeCellMove(s, rng.pick(legalFreeCellMoves(s)));
    expect(s.history.length).toBeLessThanOrEqual(1000);
  });

  it('validates saves by replay', () => {
    let s = dealFreeCell(4);
    for (let i = 0; i < 10; i++) s = applyFreeCellMove(s, legalFreeCellMoves(s)[i % 3]!);
    expect(replayFreeCell(4, s.history)).toEqual(s);
    expect(isValidFreeCellState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidFreeCellState({ ...s, cells: [0, -1, -1, -1] })).toBe(false);
    expect(() => applyFreeCellMove(s, 'r0>r1')).toThrow();
  });
});

describe('FreeCell solver', () => {
  it('treats reordered columns and cells as the same position', () => {
    const s = dealFreeCell(3);
    const swapped = { ...s, columns: [s.columns[1]!, s.columns[0]!, ...s.columns.slice(2)] };
    expect(freeCellKey(swapped)).toBe(freeCellKey(s));
  });

  it('solves seeded deals completely', () => {
    for (const seed of [1, 2, 3]) {
      const found = solveFreeCell(dealFreeCell(seed), 60_000);
      expect(found.won).toBe(true);
      let s = dealFreeCell(seed);
      for (const m of found.path) s = applyFreeCellMove(s, m);
      expect(s.result).toBe('won');
    }
  });

  it('solves more deals than the greedy player', () => {
    const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
    const report = evaluateAgents(freeCellEnv, preset('solver'), preset('greedy'), {
      games: 4,
      seed: 10,
      maxSteps: 1100,
    });
    expect(report.agents[0].wins).toBe(4);
    expect(report.agents[0].wins).toBeGreaterThan(report.agents[1].wins);
  }, 120_000);
});

describe('FreeCell definition', () => {
  it('maps taps and drops to moves and finishes sorted deals', () => {
    let s = dealFreeCell(2);
    s = applyFreeCellMove(s, safeAutoMove(s)!);
    expect(def.moveTo(s, { pile: 'c0', index: 6 }, 'c5')).toBe('c0:6>c5');
    expect(def.autoMove(s, { pile: 'c0', index: 6 })).toBe('c0:6>c5');
    expect(def.moveTo(s, { pile: 'c0', index: 6 }, 'r3')).toBe('c0>r3');
    expect(def.canPick(s, { pile: 'c0', index: 2 })).toBe(false); // not a sequence
    expect(
      def
        .piles(s)
        .map((p) => p.id)
        .slice(0, 8),
    ).toEqual(['r0', 'r1', 'r2', 'r3', 'f0', 'f1', 'f2', 'f3']);
    const sorted = blank({
      foundations: [suit(SPADES, 10), suit(HEARTS, 10), suit(DIAMONDS, 10), suit(CLUBS, 10)],
      columns: [
        [c(SPADES, 13), c(SPADES, 12), c(SPADES, 11)],
        [c(HEARTS, 13), c(HEARTS, 12), c(HEARTS, 11)],
        [c(DIAMONDS, 13), c(DIAMONDS, 12), c(DIAMONDS, 11)],
        [c(CLUBS, 13), c(CLUBS, 12), c(CLUBS, 11)],
        [],
        [],
        [],
        [],
      ],
    });
    let steps = 0;
    for (let m = def.finishMove(sorted); m; m = def.finishMove(sorted)) {
      Object.assign(sorted, def.apply(sorted, m));
      steps++;
    }
    expect(steps).toBe(12);
    expect(sorted.result).toBe('won');
  });
});

describeAdapterContract(freeCellEnv, {
  configs: [undefined],
  playouts: 3,
  // Random games often cycle cards between cells and columns up to the move cap; the cap itself
  // is tested above, so the contract's playouts are kept short.
  maxSteps: 300,
  allowTruncation: true,
  illegalActions: (s) =>
    ['r0>r1', 'c9>f0', 'x', ''].filter((a) => !legalFreeCellMoves(s).includes(a)),
});
