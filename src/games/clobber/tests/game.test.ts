import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { clobberCodec, clobberEnv } from '../ai-adapter';
import {
  applyClobberAction,
  createClobberState,
  isValidClobberState,
  legalClobberActions,
  movesOf,
  type ClobberState,
} from '../engine';
import { CLOBBER_GAME } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(clobberEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 80,
  illegalActions: (s) =>
    ['0-2', '0-6', '0-0', '35-36', ''].filter((a) => !legalClobberActions(s).includes(a)),
});

describe('Clobber rules', () => {
  it('starts full in a checkerboard with 60 moves for each side', () => {
    const s = createClobberState();
    expect(s.board.filter((v) => v === 1)).toHaveLength(18);
    expect(s.board.filter((v) => v === 2)).toHaveLength(18);
    // Every orthogonal pair of neighbors differs in color: 2 · 6 · 5 = 60 pairs.
    expect(movesOf(s.board, 1)).toHaveLength(60);
    expect(movesOf(s.board, 2)).toHaveLength(60);
  });

  it('a stone moves only onto an adjacent enemy stone, which disappears', () => {
    const s = applyClobberAction(createClobberState(), '0-1');
    expect(s.board[0]).toBe(0);
    expect(s.board[1]).toBe(1);
    expect(s.board.filter(Boolean)).toHaveLength(35);
    expect(legalClobberActions(s)).not.toContain('6-0'); // onto an empty cell
  });

  it('the player without a capture loses', () => {
    const board = new Array<number>(36).fill(0);
    board[0] = 1;
    board[1] = 2;
    const s: ClobberState = { board, first: 0, toMove: 0, history: [], result: null };
    expect(applyClobberAction(s, '0-1').result).toEqual({ winner: 0 });
  });

  it('validates by replay and encodes moves uniquely', () => {
    const s = applyClobberAction(createClobberState(1), '1-0');
    expect(isValidClobberState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidClobberState({ ...s, board: createClobberState().board })).toBe(false);
    for (const a of ['0-1', '0-6', '7-1', '7-6', '35-29', '35-34'])
      expect(clobberCodec.decode(clobberCodec.encode(a))).toBe(a);
  });
});

describe('Clobber integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(clobberEnv, preset('easy'), preset('random'), {
      games: 8,
      seed: 9,
      maxSteps: 80,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(clobberEnv, preset('medium'), preset('easy'), {
      games: 8,
      seed: 9,
      maxSteps: 80,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = CLOBBER_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const first = legalClobberActions(m.round)[0]!;
    const played = { ...m, round: applyClobberAction(m.round, first) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
