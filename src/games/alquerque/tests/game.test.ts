import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { alquerqueCodec, alquerqueEnv } from '../ai-adapter';
import {
  applyAlquerqueAction,
  createAlquerqueState,
  isValidAlquerqueState,
  legalAlquerqueActions,
  type AlquerqueState,
} from '../engine';
import { ALQUERQUE } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const position = (white: number[], black: number[], toMove: 0 | 1 = 0): AlquerqueState => {
  const board = new Array<number>(25).fill(0);
  for (const p of white) board[p] = 1;
  for (const p of black) board[p] = 2;
  return { ...createAlquerqueState(), board, toMove, keys: [] };
};

describeAdapterContract(alquerqueEnv, {
  configs: [undefined],
  playouts: 15,
  maxSteps: 300,
  illegalActions: (s) =>
    ['0-1', '12-12', '24-0', 'x', ''].filter((a) => !legalAlquerqueActions(s).includes(a)),
});

describe('Alquerque rules', () => {
  it('starts with 12 each and only the center empty; the opening moves fill it', () => {
    const s = createAlquerqueState();
    expect(s.board.filter((x) => x === 1)).toHaveLength(12);
    expect(s.board.filter((x) => x === 2)).toHaveLength(12);
    expect(s.board[12]).toBe(0);
    expect(legalAlquerqueActions(s).every((a) => a.endsWith('-12'))).toBe(true);
  });

  it('steps never retreat, but captures may go backward', () => {
    const s = position([12], [7, 2], 0);
    // Forward capture over c4 (7) is blocked by c5; sideways and forward steps only.
    expect(legalAlquerqueActions(s)).not.toContain('12-17');
    const back = position([12], [17], 0);
    expect(legalAlquerqueActions(back)).toEqual(['12-22']);
  });

  it('captures are compulsory and chains must continue', () => {
    const s = position([20], [15, 5, 24], 0);
    expect(legalAlquerqueActions(s)).toEqual(['20-10']);
    const first = applyAlquerqueAction(s, '20-10');
    expect(first.chain).toBe(10);
    expect(first.toMove).toBe(0);
    expect(legalAlquerqueActions(first)).toEqual(['10-0']);
    const second = applyAlquerqueAction(first, '10-0');
    expect(second.board.filter((x) => x === 2)).toEqual([2]);
    expect(second.toMove).toBe(1);
  });

  it('validates by replay and encodes moves uniquely', () => {
    const s = applyAlquerqueAction(
      createAlquerqueState(),
      legalAlquerqueActions(createAlquerqueState())[0]!,
    );
    expect(isValidAlquerqueState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidAlquerqueState({ ...s, board: createAlquerqueState().board })).toBe(false);
    for (const a of ['18-12', '20-10', '0-24'])
      expect(alquerqueCodec.decode(alquerqueCodec.encode(a))).toBe(a);
  });
});

describe('Alquerque integration', () => {
  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(alquerqueEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(alquerqueEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = ALQUERQUE.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = {
      ...m,
      round: applyAlquerqueAction(m.round, legalAlquerqueActions(m.round)[0]!),
    };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.map(() => 1);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
