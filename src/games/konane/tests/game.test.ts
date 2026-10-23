import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { konaneCodec, konaneEnv } from '../ai-adapter';
import {
  applyKonaneAction,
  createKonaneState,
  isValidKonaneState,
  legalKonaneActions,
  type KonaneState,
} from '../engine';
import { KONANE_GAME } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyKonaneAction(s, a), createKonaneState());

describeAdapterContract(konaneEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 60,
  illegalActions: (s) =>
    ['x1', '0-1', '0-2', '14-15', ''].filter((a) => !legalKonaneActions(s).includes(a)),
});

describe('Konane rules', () => {
  it('opens with a black removal (middle or corner), then a white one next to the hole', () => {
    expect(legalKonaneActions(createKonaneState())).toEqual(['x14', 'x21', 'x0', 'x35']);
    const s = play(['x14']);
    expect(legalKonaneActions(s).sort()).toEqual(['x13', 'x15', 'x20', 'x8'].sort());
  });

  it('jumps over one enemy stone, or several in a straight line', () => {
    const s = play(['x14', 'x15']);
    // Black stones jump over a white neighbor of the hole at c4; d4's neighbors are black.
    expect(legalKonaneActions(s).sort()).toEqual(['12-14', '2-14', '26-14'].sort());
    const after = applyKonaneAction(s, '12-14');
    expect(after.board[13]).toBe(0);
    expect(after.board[12]).toBe(0);
    expect(after.board[14]).toBe(1);
    // A double jump along a row.
    const board = new Array<number>(36).fill(0);
    board[0] = 1;
    board[1] = 2;
    board[3] = 2;
    board[30] = 2;
    const line: KonaneState = { board, toMove: 0, history: ['x14', 'x15'], result: null };
    expect(legalKonaneActions(line).sort()).toEqual(['0-2', '0-4']);
    const doubled = applyKonaneAction(line, '0-4');
    expect(doubled.board.slice(0, 5)).toEqual([0, 0, 0, 0, 1]);
    // White's last stone cannot jump: Black wins.
    expect(doubled.result).toEqual({ winner: 0 });
  });

  it('validates by replay and encodes moves uniquely', () => {
    const s = play(['x14', 'x15', '12-14']);
    expect(isValidKonaneState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidKonaneState({ ...s, toMove: 0 })).toBe(false);
    for (const a of ['x0', 'x35', '12-14', '2-14', '0-4', '0-24', '35-23', '35-11'])
      expect(konaneCodec.decode(konaneCodec.encode(a))).toBe(a);
  });
});

describe('Konane integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(konaneEnv, preset('easy'), preset('random'), {
      games: 8,
      seed: 9,
      maxSteps: 60,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(konaneEnv, preset('medium'), preset('easy'), {
      games: 8,
      seed: 9,
      maxSteps: 60,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = KONANE_GAME.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyKonaneAction(m.round, 'x14') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
