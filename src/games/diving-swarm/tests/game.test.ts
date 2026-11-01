import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import {
  FLIERS,
  flierPos,
  newSwarm,
  pilotPolicy,
  PLAYER_Y,
  stepSwarm,
  type Swarm,
  type SwarmAction,
} from '../sim';

describe('Diving Swarm simulation', () => {
  it('starts with 36 fliers swaying in formation', () => {
    let s = newSwarm(1);
    expect(s.fliers).toHaveLength(FLIERS);
    const x0 = flierPos(s, s.fliers[0]!).x;
    for (let i = 0; i < 10; i++) s = stepSwarm(s, 'idle');
    expect(flierPos(s, s.fliers[0]!).x).not.toBe(x0);
  });

  it('sends divers that loop out and come down', () => {
    let s = newSwarm(2);
    for (let i = 0; i < 400 && !s.fliers.some((f) => f.dive && f.dive.t > 80); i++)
      s = stepSwarm(s, 'idle');
    const d = s.fliers.find((f) => f.dive && f.dive.t > 80)!;
    expect(d.dive!.y).toBeGreaterThan(100);
  });

  it('a missile downs a flier, worth more when diving', () => {
    const s0 = newSwarm(3);
    const target = s0.fliers[s0.fliers.length - 1]!;
    const p = flierPos(s0, target);
    const s: Swarm = { ...s0, missile: { x: p.x, y: p.y + 4 } };
    const t = stepSwarm(s, 'idle');
    expect(t.fliers[t.fliers.length - 1]!.alive).toBe(false);
    expect(t.score).toBe(30);
    const diving: Swarm = {
      ...s0,
      fliers: s0.fliers.map((f, i) =>
        i === 10 ? { ...f, dive: { t: 70, x: 100, y: 300, side: 1, aimX: 100, shots: 2 } } : f,
      ),
      missile: { x: 100, y: 315 },
    };
    expect(stepSwarm(diving, 'idle').score).toBe(80);
  });

  it('a bullet costs a ship', () => {
    const s0 = newSwarm(4);
    const s: Swarm = { ...s0, bullets: [{ x: s0.player, y: PLAYER_Y - 6, vx: 0 }] };
    const t = stepSwarm(s, 'idle');
    expect(t.lives).toBe(2);
    expect(t.dying).toBeGreaterThan(0);
  });

  it('the pilot scores and clears swarms', () => {
    let s = newSwarm(5);
    while (!s.over && s.steps < 60 * 180) s = stepSwarm(s, pilotPolicy(s));
    expect(s.score).toBeGreaterThan(1000);
  });
});

describeAdapterContract(env, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 30000,
  illegalActions: () => ['jump', 'up'] as unknown as SwarmAction[],
});
