import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import { SOCCER } from '../definition';
import { CY, PX0, PX1, PY0, PY1, newSoccer, stepSoccer, type SoccerAction } from '../sim';

describe('Disc Soccer rules', () => {
  it('keeps the non-kicking team out of the centre circle and its opponents’ half at kick-off', () => {
    let s = newSoccer(4, 3, 'medium', 3, 3);
    s = { ...s, kickoff: 0 };
    const blue = s.players.findIndex((p) => p.team === 1);
    for (let i = 0; i < 120; i++)
      s = stepSoccer(s, s.players.map((_, k) => (k === blue ? 'l' : 'idle')) as SoccerAction[]);
    const b = s.players[blue]!;
    expect(b.x).toBeGreaterThanOrEqual((PX0 + PX1) / 2);
    expect(Math.hypot(b.x - (PX0 + PX1) / 2, b.y - CY)).toBeGreaterThanOrEqual(70);
  });

  it('keeps every disc inside the arena and the ball in play', () => {
    let s = newSoccer(9, 2, 'hard', 3, 3);
    for (let i = 0; i < 3000; i++) s = SOCCER.step(s, i % 200 < 100 ? 'ulk' : 'drk');
    for (const p of s.players) {
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(PY1 + PY0);
    }
    expect(s.ball.y).toBeGreaterThan(PY0 - 1);
    expect(s.ball.y).toBeLessThan(PY1 + 1);
  });

  it('maps held controls to actions', () => {
    const s = newSoccer(1, 1, 'easy', 3, 3);
    expect(SOCCER.control(s, new Set(), null)).toBe('idle');
    expect(SOCCER.control(s, new Set(['up', 'right'] as const), null)).toBe('ur');
    expect(SOCCER.control(s, new Set(['down', 'fire'] as const), null)).toBe('dk');
    expect(SOCCER.control(s, new Set(['alt'] as const), null)).toBe('k');
    expect(SOCCER.control(s, new Set(['left', 'right'] as const), null)).toBe('idle');
  });

  it('records the result as goal difference with the mode', () => {
    const s = { ...newSoccer(1, 2, 'hard', 3, 3), score: [3, 1] as [number, number] };
    expect(SOCCER.result(s, { size: '2', level: 'hard' })).toMatchObject({
      outcome: 'win',
      score: 2,
      mode: '2v2-hard',
    });
  });
});

describeAdapterContract(env, {
  configs: [undefined, { options: { size: '1', level: 'easy', length: '3' } }],
  playouts: 2,
  maxSteps: 60 * 60 * 12 + 1,
  illegalActions: () => ['jump', 'x'] as unknown as SoccerAction[],
});
