import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS, evaluateAmazons, queenDistances, reachCounts } from '../ai';
import { amazonsCodec, amazonsEnv } from '../ai-adapter';
import {
  ARROW,
  applyAmazonsAction,
  cellName,
  createAmazonsState,
  isValidAmazonsState,
  legalAmazonsActions,
  queenTargets,
  replayAmazons,
  type AmazonsState,
} from '../engine';
import { AMAZONS_GAME } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const at = (board: number[], toMove: 0 | 1 = 0): AmazonsState => ({
  board,
  toMove,
  first: 0,
  history: [],
  result: null,
});

describe('Amazons engine', () => {
  it('sets up four amazons a side with 2176 opening turns', () => {
    const s = createAmazonsState();
    const cells = (v: number) => s.board.flatMap((x, c) => (x === v ? [cellName(c)] : [])).sort();
    expect(cells(1)).toEqual(['a4', 'd1', 'g1', 'j4']);
    expect(cells(2)).toEqual(['a7', 'd10', 'g10', 'j7']);
    expect(legalAmazonsActions(s)).toHaveLength(2176);
  });

  it('moves like a queen, never through anything, and may shoot back where it came from', () => {
    const s = createAmazonsState();
    const d1 = 93;
    const targets = queenTargets(s.board, d1);
    expect(targets).toContain(3 + 10 * 1); // d9, the square just below Black's d10
    expect(targets).not.toContain(3); // d10 itself is occupied
    const after = applyAmazonsAction(s, `${d1}-83-${d1}`);
    expect(after.board[83]).toBe(1);
    expect(after.board[d1]).toBe(ARROW);
    expect(after.toMove).toBe(1);
    expect(() => applyAmazonsAction(after, '93-83-73')).toThrow();
  });

  it('ends when the side to move has no amazon able to move', () => {
    const b = new Array<number>(100).fill(ARROW);
    b[0] = 2; // Black boxed in a corner
    b[55] = 1;
    b[56] = 0;
    b[57] = 0;
    const end = applyAmazonsAction(at(b), '55-56-57');
    expect(end.result).toEqual({ winner: 0, reason: 'stuck' });
    expect(legalAmazonsActions(end)).toEqual([]);
  });

  it('validates by replay from the opener and codes every turn uniquely', () => {
    let s = createAmazonsState(1);
    for (let i = 0; i < 6; i++) s = applyAmazonsAction(s, legalAmazonsActions(s)[i * 37]!);
    expect(replayAmazons(s.history, 1)).toEqual(s);
    expect(isValidAmazonsState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidAmazonsState({ ...s, first: 0 })).toBe(false);
    const codes = new Set(legalAmazonsActions(s).map(amazonsCodec.encode));
    expect(codes.size).toBe(legalAmazonsActions(s).length);
    expect(amazonsCodec.decode(amazonsCodec.encode('93-83-73'))).toBe('93-83-73');
  });
});

describe('Amazons evaluation', () => {
  it('measures queen distances and territory symmetrically', () => {
    const s = createAmazonsState();
    const d = queenDistances(s.board, 0);
    expect(d[93]).toBe(0);
    expect(d[83]).toBe(1);
    const [a, b] = reachCounts(s.board);
    expect(a).toBe(b);
    expect(evaluateAmazons(s, 0)).toBeCloseTo(-evaluateAmazons(s, 1));
  });
});

describeAdapterContract(amazonsEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 100,
  illegalActions: (s) =>
    ['0-0-0', '93-93-93', 'x', ''].filter((a) => !legalAmazonsActions(s).includes(a)),
});

describe('Amazons integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(amazonsEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 9,
      maxSteps: 100,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(amazonsEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 9,
      maxSteps: 100,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('alternates the opener and saves round-trip', () => {
    const cfg = AMAZONS_GAME.match;
    expect(cfg.fixedFirstSeat).toBeUndefined();
    expect(cfg.rules.create(1).toMove).toBe(1);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyAmazonsAction(m.round, legalAmazonsActions(m.round)[5]!) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...played.round, board: played.round.board.map((x) => (x === 3 ? 0 : x)) };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
