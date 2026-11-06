import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { breakthroughCodec, breakthroughEnv } from '../ai-adapter';
import {
  applyBreakthroughAction,
  createBreakthroughState,
  legalBreakthroughActions,
  type BreakthroughState,
} from '../engine';
import { BREAKTHROUGH } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string[]) =>
  moves.reduce((s, a) => applyBreakthroughAction(s, a), createBreakthroughState());
const position = (white: number[], black: number[], toMove: 0 | 1 = 0): BreakthroughState => {
  const board = new Array<number>(64).fill(0);
  for (const p of white) board[p] = 1;
  for (const p of black) board[p] = 2;
  return { board, toMove, history: [], result: null };
};

describeAdapterContract(breakthroughEnv, {
  configs: [undefined],
  playouts: 20,
  maxSteps: 300,
  illegalActions: (s) =>
    ['48-32', '55-47', '8-0', '0-64', ''].filter((a) => !legalBreakthroughActions(s).includes(a)),
});

describe('Breakthrough rules', () => {
  it('opens with 22 moves: only the front row can step', () => {
    const moves = legalBreakthroughActions(createBreakthroughState());
    expect(moves).toHaveLength(22);
    expect(moves.every((a) => Number(a.split('-')[0]) >= 48 && Number(a.split('-')[0]) < 56)).toBe(
      true,
    );
  });

  it('captures diagonally but never straight ahead', () => {
    const s = position([36], [28, 27, 29], 0);
    const moves = legalBreakthroughActions(s);
    expect(moves).toEqual(['36-27', '36-29']);
    const after = applyBreakthroughAction(s, '36-27');
    expect(after.board[27]).toBe(1);
    expect(after.board[36]).toBe(0);
  });

  it('wins on the far row, by capturing everything, and never leaves a side without a move', () => {
    expect(applyBreakthroughAction(position([9], [63]), '9-1').result).toEqual({
      winner: 0,
      reason: 'home',
    });
    expect(applyBreakthroughAction(position([36, 63], [27]), '36-27').result).toEqual({
      winner: 0,
      reason: 'captured',
    });
    // A side with pawns always has a move: the most advanced one can step diagonally.
    expect(legalBreakthroughActions(position([8, 9, 62], [0], 1))).toEqual(['0-9']);
  });

  it('encodes each move to a unique index for both colors', () => {
    const s = play(['52-44', '11-19']);
    const actions = [...legalBreakthroughActions(s), '52-44', '11-19', '11-20'];
    for (const a of actions) expect(breakthroughCodec.decode(breakthroughCodec.encode(a))).toBe(a);
    expect(new Set(actions.map(breakthroughCodec.encode)).size).toBe(new Set(actions).size);
  });

  it('levels are ordered by strength (seeded)', () => {
    const easy = evaluateAgents(breakthroughEnv, preset('easy'), preset('random'), {
      games: 4,
      seed: 5,
      maxSteps: 300,
    }).agents[0];
    expect(easy.wins).toBeGreaterThanOrEqual(3);
    const medium = evaluateAgents(breakthroughEnv, preset('medium'), preset('easy'), {
      games: 4,
      seed: 5,
      maxSteps: 300,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 120_000);

  it('round-trips saves and rejects tampered games', () => {
    const cfg = BREAKTHROUGH.match;
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: applyBreakthroughAction(m.round, '52-44') };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const board = played.round.board.slice();
    board[36] = 1;
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, board } })).ok).toBe(
      false,
    );
  });
});
