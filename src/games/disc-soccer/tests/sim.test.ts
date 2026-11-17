import { describe, expect, it } from 'vitest';
import {
  BALL_R,
  CY,
  PX1,
  newSoccer,
  soccerOver,
  stepSoccer,
  stepWithBots,
  winner,
  type Soccer,
} from '../sim';

const idle = (s: Soccer) => s.players.map(() => 'idle' as const);

describe('Disc Soccer physics', () => {
  it('accelerates players, damps them and lets the ball roll', () => {
    let s = newSoccer(1, 1, 'medium', 3, 3);
    const x0 = s.players[0]!.x;
    for (let i = 0; i < 30; i++) s = stepSoccer(s, ['r', 'idle']);
    expect(s.players[0]!.x).toBeGreaterThan(x0 + 20);
    const v = s.players[0]!.vx;
    for (let i = 0; i < 30; i++) s = stepSoccer(s, idle(s));
    expect(s.players[0]!.vx).toBeLessThan(v);
  });

  it('kicks the ball away and scores between the posts', () => {
    let s = newSoccer(2, 1, 'medium', 3, 3);
    s = {
      ...s,
      kickoff: null,
      ball: { x: PX1 - 40, y: CY, vx: 0, vy: 0 },
      players: s.players.map((p, i) =>
        i === 0
          ? { ...p, x: PX1 - 40 - 15 - BALL_R - 2, y: CY, vx: 0, vy: 0 }
          : { ...p, x: 100, y: 100 },
      ),
    };
    s = stepSoccer(s, ['k', 'idle']);
    expect(s.ball.vx).toBeGreaterThan(3);
    for (let i = 0; i < 60 && s.score[0] === 0; i++) s = stepSoccer(s, ['idle', 'idle']);
    expect(s.score).toEqual([1, 0]);
    expect(s.goalsBy[0]).toBe(1);
    expect(s.pause).toBeGreaterThan(0);
  });

  it('plays whole bot matches to a result', () => {
    let goals = 0;
    for (let seed = 1; seed <= 3; seed++) {
      let s = newSoccer(seed, 2, 'hard', 3, 3);
      for (let i = 0; i < 60 * 60 * 6 && !soccerOver(s); i++) s = stepWithBots(s, 'idle');
      goals += s.score[0] + s.score[1];
      expect(soccerOver(s) || s.overtime).toBe(true);
      if (soccerOver(s)) expect(winner(s)).not.toBeNull();
    }
    expect(goals).toBeGreaterThan(0);
  }, 60_000);
});
