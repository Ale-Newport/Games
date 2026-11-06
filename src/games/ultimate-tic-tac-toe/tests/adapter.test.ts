import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { matchSaveSpec, newMatch, defaultSetup } from '../../shared/two-player/match';
import { AGENT_PRESETS } from '../ai';
import { utttEnv } from '../ai-adapter';
import { createState, legalMoves, play, replay } from '../engine';
import { MATCH_CONFIG } from '../Game';
import { wonFromBehind, wonOnGlobalDiagonal } from '../rules';

describeAdapterContract(utttEnv, {
  configs: [undefined, { firstPlayer: 1 }],
  playouts: 60,
  illegalActions: (s) => {
    const legal = new Set(legalMoves(s));
    const illegal = [-1, 81, ...s.history];
    for (let i = 0; i < 81 && illegal.length < 8; i++)
      if (!legal.has(i) && !s.history.includes(i)) illegal.push(i);
    return illegal;
  },
});

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();

describe('Ultimate Tic-Tac-Toe adapter, AI and saves', () => {
  it('encodes a [4,9,9] observation with a legal-move mask', () => {
    const s = play(createState(), 4 * 9 + 2);
    const tensor = utttEnv.getObservationTensor!(s, 1);
    expect(tensor.shape).toEqual([4, 9, 9]);
    const mask = tensor.data.slice(162, 243);
    expect(mask.filter((v) => v === 1)).toHaveLength(9);
  });

  it('agents beat weaker agents (seeded, reproducible)', () => {
    const easyVsRandom = evaluateAgents(utttEnv, preset('easy'), preset('random'), {
      games: 20,
      seed: 3,
    }).agents[0];
    expect(easyVsRandom.wins).toBeGreaterThan(easyVsRandom.losses * 3);
    const mediumVsEasy = evaluateAgents(utttEnv, preset('medium'), preset('easy'), {
      games: 10,
      seed: 3,
    }).agents[0];
    expect(mediumVsEasy.wins).toBeGreaterThan(mediumVsEasy.losses);
  }, 60_000);

  it('Hard (MCTS) finds an immediate game-winning move', () => {
    // X holds boards 0 and 1 and can take board 2 (cells 0,1 of board 2 already X) by playing cell 2.
    let s = createState();
    const xBoards = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
    ];
    // Build the position directly (unit test of agent behavior, not of move legality history).
    for (const [b, c] of xBoards) s.cells[b! * 9 + c!] = 1;
    s.boards[0] = 1;
    s.boards[1] = 1;
    for (const i of [3 * 9 + 0, 3 * 9 + 4, 5 * 9 + 8, 6 * 9 + 3, 7 * 9 + 1, 8 * 9 + 5, 4 * 9 + 7])
      s.cells[i] = 2;
    s = { ...s, forced: 2, toMove: 0, history: [] };
    const choice = preset('hard').selectAction(utttEnv, s, 0, { rng: new Rng(1) });
    expect(choice).toBe(2 * 9 + 2);
  });

  it('detects diagonal and comeback wins', () => {
    const s = replay([]);
    expect(wonOnGlobalDiagonal(s)).toBe(false);
    expect(wonFromBehind(s)).toBe(false);
  });

  it('round-trips match saves and rejects tampered rounds', () => {
    const spec = matchSaveSpec(MATCH_CONFIG);
    const m = newMatch(MATCH_CONFIG, defaultSetup(MATCH_CONFIG, 'Ana'));
    const played = { ...m, round: play(play(m.round, 40), 36) };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    expect(unwrap(spec, wrap(spec, { ...played, round: { ...played.round, forced: 2 } })).ok).toBe(
      false,
    );
  });
});
