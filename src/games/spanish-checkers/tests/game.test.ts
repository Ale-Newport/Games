import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { EpsilonAgent } from '../../../ai/agents/random-agent';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { Rng } from '../../../core/game-engine/random';
import {
  applyMove,
  initialState,
  isKing,
  legalMoves,
  positionKey,
  type DraughtsState,
  type Piece,
} from '../../shared/draughts/engine';
import { AGENT_PRESETS } from '../ai';
import { spanishEnv } from '../ai-adapter';
import { SPANISH_CHECKERS } from '../Game';
import { VARIANT, capturedAKing } from '../rules';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const sq = (r: number, c: number) => r * 8 + c;

describeAdapterContract(spanishEnv, {
  configs: [undefined],
  playouts: 40,
  maxSteps: 1000,
  illegalActions: () => [[1, 0], [], [70]],
});

describe('Spanish checkers integration', () => {
  it('White moves first; kings fly and capture at a distance in this variant', () => {
    expect(SPANISH_CHECKERS.match.fixedFirstSeat).toBe(0);
    const board = new Array<Piece>(64).fill(0);
    board[sq(7, 1)] = 2; // white king (parity 0: 7+1 even)
    board[sq(4, 4)] = 3; // black man on the long diagonal
    const s: DraughtsState = {
      board,
      toMove: 0,
      history: [],
      noProgress: 0,
      recent: [],
      endgamePlies: 0,
      result: null,
    };
    s.recent = [positionKey(s)];
    const moves = legalMoves(VARIANT, s);
    expect(moves.map((m) => m.join('-')).sort()).toEqual(
      [
        [sq(7, 1), sq(3, 5)],
        [sq(7, 1), sq(2, 6)],
        [sq(7, 1), sq(1, 7)],
      ]
        .map((m) => m.join('-'))
        .sort(),
    );
  });

  it('detects capturing an enemy king (cross-checked on random games)', () => {
    const rng = new Rng(14);
    for (let g = 0; g < 12; g++) {
      let s = initialState(VARIANT);
      let expected = false;
      while (!s.result && s.history.length < 300) {
        const mover = s.toMove;
        const enemyKings = (st: DraughtsState) =>
          st.board.filter((p) => isKing(p) && (p === 2 ? 0 : 1) !== mover).length;
        const before = enemyKings(s);
        s = applyMove(VARIANT, s, rng.pick(legalMoves(VARIANT, s)));
        if (mover === 0 && enemyKings(s) < before) expected = true;
      }
      expect(capturedAKing(s, 0)).toBe(expected);
    }
  });

  it('levels are ordered by strength (seeded)', () => {
    const medium = evaluateAgents(
      spanishEnv,
      new EpsilonAgent(preset('medium'), 0.05),
      preset('easy'),
      { games: 6, seed: 1, maxSteps: 400 },
    ).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 60_000);
});
