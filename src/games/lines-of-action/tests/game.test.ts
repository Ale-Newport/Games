import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS, evaluateLoa } from '../ai';
import { linesOfActionEnv, loaCodec } from '../ai-adapter';
import {
  applyLoaAction,
  createLoaState,
  groups,
  isValidLoaState,
  legalLoaActions,
  loaTargets,
  replayLoa,
  type LoaState,
} from '../engine';
import { LINES_OF_ACTION_GAME } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const sq = (x: number, y: number) => y * 8 + x;
const at = (board: number[], toMove: 0 | 1 = 0): LoaState => ({
  board,
  toMove,
  history: [],
  result: null,
});

describe('Lines of Action engine', () => {
  it('starts with twelve a side and the 36 standard opening moves', () => {
    const s = createLoaState();
    expect(s.board.filter((x) => x === 1)).toHaveLength(12);
    expect(s.board.filter((x) => x === 2)).toHaveLength(12);
    expect(legalLoaActions(s)).toHaveLength(36);
    // b8: two pieces in its column, six in its row (jumping its own), two on a diagonal.
    expect(loaTargets(s.board, sq(1, 0)).sort((a, b) => a - b)).toEqual([7, 17, 19]);
  });

  it('cannot jump the opponent and captures by landing', () => {
    const b = new Array<number>(64).fill(0);
    b[sq(0, 0)] = 1;
    b[sq(1, 0)] = 2; // three on the row: a8 must move 3 but b8 is an enemy in the way
    b[sq(3, 0)] = 1;
    expect(loaTargets(b, sq(0, 0))).not.toContain(sq(3, 0));
    const c = new Array<number>(64).fill(0);
    c[sq(0, 4)] = 1;
    c[sq(2, 4)] = 2; // two on the row: a4 moves 2 and lands on c4
    c[sq(7, 7)] = 1;
    c[sq(6, 0)] = 2;
    const after = applyLoaAction(at(c), `${sq(0, 4)}-${sq(2, 4)}`);
    expect(after.board[sq(2, 4)]).toBe(1);
    expect(after.board.filter((x) => x === 2)).toHaveLength(1);
    // White's lone piece is a single group: White wins.
    expect(after.result).toEqual({ winner: 1, reason: 'connected' });
  });

  it('gives the win to the mover when both sides connect', () => {
    const b = new Array<number>(64).fill(0);
    b[sq(3, 3)] = 1;
    b[sq(5, 3)] = 1;
    b[sq(4, 5)] = 2;
    b[sq(4, 6)] = 2;
    // The diagonal through f5 holds only that piece, so it steps one square to e4, joining d5 —
    // and White's two pieces were already a single group.
    expect(loaTargets(b, sq(5, 3))).toContain(sq(4, 4));
    const after = applyLoaAction(at(b), `${sq(5, 3)}-${sq(4, 4)}`);
    expect(groups(after.board, 0)).toBe(1);
    expect(groups(after.board, 1)).toBe(1);
    expect(after.result).toEqual({ winner: 0, reason: 'connected' });
  });

  it('validates by replay and codes moves', () => {
    let s = createLoaState();
    for (let i = 0; i < 8; i++) s = applyLoaAction(s, legalLoaActions(s)[i % 5]!);
    expect(replayLoa(s.history)).toEqual(s);
    expect(isValidLoaState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidLoaState({ ...s, toMove: 1 - s.toMove })).toBe(false);
    expect(loaCodec.decode(loaCodec.encode('1-17'))).toBe('1-17');
    expect(evaluateLoa(createLoaState(), 0)).toBeCloseTo(0);
  });
});

describeAdapterContract(linesOfActionEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 320,
  illegalActions: (s) => ['0-0', '1-2', 'x', ''].filter((a) => !legalLoaActions(s).includes(a)),
});

describe('Lines of Action integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(linesOfActionEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 320,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(linesOfActionEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 320,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('Black moves first and saves round-trip', () => {
    const cfg = LINES_OF_ACTION_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyLoaAction(m.round, '1-17') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...played.round, board: played.round.board.map((x) => (x === 2 ? 0 : x)) };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
