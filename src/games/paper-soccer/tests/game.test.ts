import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { evaluateAgents } from '../../../ai/evaluation/evaluate';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import { defaultSetup, matchSaveSpec, newMatch } from '../../shared/two-player/match';
import { AGENT_PRESETS, evaluatePaperSoccer } from '../ai';
import { paperSoccerEnv } from '../ai-adapter';
import {
  DX,
  DY,
  applyPaperSoccerAction,
  canMove,
  createPaperSoccerState,
  isValidPaperSoccerState,
  legalPaperSoccerActions,
  pointAt,
  pointX,
  pointY,
  replayPaperSoccer,
} from '../engine';
import { PAPER_SOCCER_GAME } from '../Game';

const preset = (id: string) => AGENT_PRESETS.find((a) => a.id === id)!.create();
const play = (moves: string) => replayPaperSoccer(moves.split(''));

describe('Paper Soccer engine', () => {
  it('starts in the middle with eight lines to draw', () => {
    const s = createPaperSoccerState();
    expect([pointX(s.ball), pointY(s.ball)]).toEqual([4, 5]);
    expect(legalPaperSoccerActions(s)).toHaveLength(8);
  });

  it('never redraws a line and passes the turn on fresh points', () => {
    const s = play('0');
    expect(s.toMove).toBe(1);
    expect(legalPaperSoccerActions(s)).not.toContain('4'); // straight back down the same line
  });

  it('bounces off used points and the border', () => {
    // Orange up, Teal right, Orange back down-left onto the used center point: Orange goes again.
    const s = play('025');
    expect(s.ball).toBe(pointAt(4, 5));
    expect(s.toMove).toBe(0);
    expect(s.movers).toEqual([0, 1, 0]);
    // Walking to the side line bounces too.
    const side = play('6666');
    expect(pointX(side.ball)).toBe(0);
    expect(side.toMove).toBe(side.movers[side.movers.length - 1]);
    expect(canMove(side.edges, side.ball, 0)).toBe(false); // along the side line
    expect(canMove(side.edges, side.ball, 4)).toBe(false);
  });

  it('scores goals, own goals included', () => {
    // Six straight lines up: the sixth, by Teal, puts the ball in the top goal.
    const s = play('000000');
    expect(s.result).toEqual({ winner: 0, reason: 'own-goal' });
    // Not straight in from a post: the goal's side is a border.
    const post = pointAt(3, 0);
    expect(canMove(new Array<number>(13 * 9 * 8).fill(0), post, 0)).toBe(false);
    expect(canMove(new Array<number>(13 * 9 * 8).fill(0), post, 1)).toBe(true);
  });

  it('loses a player who is left without a line', () => {
    // Every line out of b9 is drawn except toward the a10 corner, whose only exit is that line.
    const s = createPaperSoccerState();
    const from = pointAt(1, 1);
    const edges = s.edges.slice();
    for (let d = 0; d < 7; d++) {
      const to = pointAt(1 + DX[d]!, 1 + DY[d]!);
      edges[from * 8 + d] = 1;
      edges[to * 8 + ((d + 4) % 8)] = 1;
    }
    const trapped = { ...s, ball: from, edges };
    const end = applyPaperSoccerAction(trapped, '7');
    expect(end.result).toEqual({ winner: 1, reason: 'stuck' });
  });

  it('validates by replay and scores the field symmetrically', () => {
    const s = play('0123');
    expect(isValidPaperSoccerState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidPaperSoccerState({ ...s, ball: pointAt(4, 5) })).toBe(false);
    const start = createPaperSoccerState();
    expect(evaluatePaperSoccer(start, 0)).toBeCloseTo(-evaluatePaperSoccer(start, 1));
    expect(evaluatePaperSoccer(play('00'), 0)).toBeGreaterThan(evaluatePaperSoccer(start, 0));
  });
});

describeAdapterContract(paperSoccerEnv, {
  configs: [undefined],
  playouts: 8,
  maxSteps: 400,
  illegalActions: (s) =>
    ['8', '-1', 'x', ''].filter((a) => !legalPaperSoccerActions(s).includes(a)),
});

describe('Paper Soccer integration', () => {
  it('Easy beats Random and Medium beats Easy (seeded)', () => {
    const easy = evaluateAgents(paperSoccerEnv, preset('easy'), preset('random'), {
      games: 6,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(easy.wins).toBeGreaterThan(easy.losses);
    const medium = evaluateAgents(paperSoccerEnv, preset('medium'), preset('easy'), {
      games: 6,
      seed: 9,
      maxSteps: 400,
    }).agents[0];
    expect(medium.wins).toBeGreaterThan(medium.losses);
  }, 180_000);

  it('Orange kicks off, bounces keep the turn, and saves round-trip', () => {
    const cfg = PAPER_SOCCER_GAME.match;
    expect(cfg.fixedFirstSeat).toBe(0);
    const bounced = play('025');
    expect(cfg.rules.moverOfPly(bounced, 2)).toBe(0);
    const spec = matchSaveSpec(cfg);
    const m = newMatch(cfg, defaultSetup(cfg, 'Ana'));
    const played = { ...m, round: bounced };
    expect(unwrap(spec, JSON.parse(JSON.stringify(wrap(spec, played)))).ok).toBe(true);
    const tampered = { ...bounced, toMove: 1 as const };
    expect(unwrap(spec, wrap(spec, { ...played, round: tampered })).ok).toBe(false);
  });
});
