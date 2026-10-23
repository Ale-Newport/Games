import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { fanoronaCodec, fanoronaEnv } from '../ai-adapter';
import {
  applyFanoronaAction,
  createFanoronaState,
  isValidFanoronaState,
  legalFanoronaActions,
  step,
  type FanoronaState,
} from '../engine';
import { FANORONA } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describeAdapterContract(fanoronaEnv, {
  configs: [undefined],
  playouts: 12,
  maxSteps: 400,
  illegalActions: (s) =>
    ['0-1', 'stop', '22-22', '31-22X', ''].filter((a) => !legalFanoronaActions(s).includes(a)),
});

const empty = (): FanoronaState => ({
  ...createFanoronaState(),
  board: new Array<number>(45).fill(0),
});

describe('Fanorona rules', () => {
  it('starts with 22 pieces each and the center empty; every opening move captures', () => {
    const s = createFanoronaState();
    expect(s.board.filter((v) => v === 1)).toHaveLength(22);
    expect(s.board.filter((v) => v === 2)).toHaveLength(22);
    expect(s.board[22]).toBe(0);
    const moves = legalFanoronaActions(s);
    expect(moves.every((a) => /[AW]$/.test(a))).toBe(true);
    expect(moves).toContain('31-22A');
  });

  it('draws lines only from strong points', () => {
    expect(step(22, 4)).toBe(12); // e3 (strong) has diagonals
    expect(step(21, 4)).toBe(-1); // d3 (weak) has none
  });

  it('approach captures the whole line ahead; withdrawal the line behind', () => {
    const s = applyFanoronaAction(createFanoronaState(), '31-22A');
    expect(s.board[13]).toBe(0);
    expect(s.board[4]).toBe(0);
    const w = empty();
    w.board[20] = 1; // c3
    w.board[19] = 2; // b3
    w.board[18] = 2; // a3
    w.board[40] = 2;
    // Moving c3 → d3 away from b3 captures b3 and a3.
    expect(legalFanoronaActions(w)).toContain('20-21W');
    const after = applyFanoronaAction(w, '20-21W');
    expect(after.board.slice(18, 22)).toEqual([0, 0, 0, 1]);
  });

  it('chains captures with the same piece, never repeating a direction, until stopped', () => {
    const s = empty();
    s.board[20] = 1; // c3
    s.board[22] = 2; // e3, approached by c3 → d3
    s.board[3] = 2; // d5, approached by d3 → d4 (a different direction)
    s.board[44] = 2;
    const first = applyFanoronaAction(s, '20-21A');
    expect(first.chain?.at).toBe(21);
    expect(first.toMove).toBe(0);
    const moves = legalFanoronaActions(first);
    expect(moves).toContain('21-12A');
    expect(moves).toContain('stop');
    expect(moves.some((a) => a.startsWith('21-22'))).toBe(false); // same direction again
    const stopped = applyFanoronaAction(first, 'stop');
    expect(stopped.toMove).toBe(1);
    expect(stopped.movers).toEqual([0, 0]);
  });

  it('validates by replay and encodes moves uniquely', () => {
    const s = applyFanoronaAction(createFanoronaState(), '31-22A');
    expect(isValidFanoronaState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidFanoronaState({ ...s, board: createFanoronaState().board })).toBe(false);
    for (const a of ['31-22A', '20-21W', '22-12A', '0-1', 'stop'])
      expect(fanoronaCodec.decode(fanoronaCodec.encode(a))).toBe(a);
  });
});

describe('Fanorona integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(fanoronaEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(fanoronaEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = FANORONA.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyFanoronaAction(m.round, '31-22A') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
