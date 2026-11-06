import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { ataxxCodec, ataxxEnv } from '../ai-adapter';
import {
  RING1,
  RING2,
  applyAtaxxAction,
  countsOf,
  createAtaxxState,
  legalAtaxxActions,
  type AtaxxState,
} from '../engine';
import { ATAXX } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyAtaxxAction(s, a), createAtaxxState());

describeAdapterContract(ataxxEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 400,
  illegalActions: (s) =>
    ['+0', '0-49', 'pass', '24-24', ''].filter((a) => !legalAtaxxActions(s).includes(a)),
});

describe('Ataxx rules', () => {
  it('has 8 neighbors and 16 jump cells in the middle, fewer in a corner', () => {
    expect(RING1[24]).toHaveLength(8);
    expect(RING2[24]).toHaveLength(16);
    expect(RING1[0]).toHaveLength(3);
    expect(RING2[0]).toHaveLength(5);
    expect(legalAtaxxActions(createAtaxxState())).toHaveLength(16); // 2 corners × (3 clones + 5 jumps)
  });

  it('clones keep the origin, jumps leave it, and neighbors convert', () => {
    const s = play(['+8', '6-18', '8-10']);
    expect(s.board[0]).toBe(1);
    expect(s.board[8]).toBe(0); // jumped away
    expect(s.board[10]).toBe(1);
    expect(s.board[18]).toBe(1); // converted
    expect(s.board[6]).toBe(0);
    expect(countsOf(s.board)).toEqual([4, 1]);
  });

  it('passes only without a move and ends when a side is wiped out', () => {
    const board = new Array<number>(49).fill(2);
    board[0] = 1;
    board[48] = 0;
    const stuck: AtaxxState = { board, toMove: 0, history: [], keys: [], result: null };
    expect(legalAtaxxActions(stuck)).toEqual(['pass']);
    // Blue is down to one piece; Red hunts it and the game ends as soon as it falls.
    let s = play(['+8', '6-18', '8-10']);
    expect(countsOf(s.board)[1]).toBe(1);
    while (!s.result) {
      const moves = legalAtaxxActions(s);
      const kill = moves.find((a) => countsOf(applyAtaxxAction(s, a).board)[1] === 0);
      s = applyAtaxxAction(s, kill ?? moves[0]!);
    }
    expect(s.result).toMatchObject({ kind: 'win', winner: 0 });
    expect(countsOf(s.board)[1]).toBe(0);
  });

  it('encodes clones, jumps and pass to unique indices', () => {
    for (const a of ['+0', '+48', '0-16', '48-32', 'pass'])
      expect(ataxxCodec.decode(ataxxCodec.encode(a))).toBe(a);
    expect(new Set(['+16', '0-16', '16-0', 'pass'].map(ataxxCodec.encode)).size).toBe(4);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(ataxxEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 5,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(ataxxEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 5,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = ATAXX.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyAtaxxAction(m.round, '+8') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.slice();
    board[24] = 1;
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
