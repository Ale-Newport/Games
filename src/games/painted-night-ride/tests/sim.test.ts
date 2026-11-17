import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';
import {
  controlsOf,
  courier,
  DELIVER_R,
  heightAt,
  newRide,
  NONE,
  ORBS,
  score,
  STEEPLE,
  stepRide,
  WORLD_R,
  type Controls,
  type Ride,
} from '../sim';

const go = (r: Ride, c: Partial<Controls>, n: number) => {
  let x = r;
  for (let i = 0; i < n; i++) x = stepRide(x, { ...NONE, ...c });
  return x;
};

describe('Painted Night Ride riding', () => {
  it('pedalling speeds up, braking stops, steering turns, the ground carries you', () => {
    const r = newRide(1, 'starlight');
    const fast = go(r, { pedal: true }, 90);
    expect(fast.speed).toBeGreaterThan(5);
    expect(fast.z).toBeLessThan(r.z);
    expect(fast.y).toBeCloseTo(heightAt(fast.world, fast.x, fast.z), 5);
    expect(go(fast, { brake: true }, 60).speed).toBeLessThan(1);
    expect(go(fast, { pedal: true, steer: 1 }, 30).yaw).toBeLessThan(fast.yaw);
  });

  it('a leap leaves the ground and lands; a full spin scores, half a spin is a tumble', () => {
    const r = go(newRide(2, 'starlight'), { pedal: true }, 30);
    let j = stepRide(r, { ...NONE, leap: true });
    expect(j.ground).toBe(false);
    expect(j.events).toContain('leap');
    let peak = 0;
    let spin = j;
    while (!spin.ground) {
      spin = stepRide(spin, { ...NONE, trick: true });
      peak = Math.max(peak, spin.y - heightAt(spin.world, spin.x, spin.z));
    }
    expect(peak).toBeGreaterThan(1.4);
    expect(spin.tricks + (spin.dazed > 0 ? 1 : 0)).toBe(1);
    j = stepRide(r, { ...NONE, leap: true });
    for (let i = 0; i < 25; i++) j = stepRide(j, { ...NONE, trick: i < 25 });
    while (!j.ground) j = stepRide(j, NONE);
    expect(j.events.includes('bail') || j.tricks === 1).toBe(true);
  });

  it('walking is slower; houses and the rim stop you', () => {
    let r = newRide(3, 'starlight');
    r = stepRide(r, { ...NONE, walk: true });
    expect(r.walking).toBe(true);
    expect(go(r, { pedal: true }, 200).speed).toBeLessThanOrEqual(4);
    const far = { ...r, walking: false, x: WORLD_R - 1, z: 0, yaw: -Math.PI / 2, speed: 14 };
    const out = go(far, { pedal: true }, 30);
    expect(Math.hypot(out.x, out.z)).toBeLessThanOrEqual(WORLD_R + 1e-6);
    const [hx, hz, hr] = r.world.obstacles[0]!;
    const into = go(
      { ...r, walking: false, x: hx, z: hz + hr + 4, yaw: 0, speed: 10 },
      { pedal: true },
      60,
    );
    expect(Math.hypot(into.x - hx, into.z - hz)).toBeGreaterThanOrEqual(hr);
  });

  it('orbs are picked up nearby and delivered at the steeple', () => {
    const r = newRide(4, 'starlight');
    const low = r.orbs.find((o) => o.y - heightAt(r.world, o.x, o.z) < 2)!;
    let x = stepRide(
      { ...r, x: low.x, z: low.z + 1, y: heightAt(r.world, low.x, low.z + 1) },
      NONE,
    );
    expect(x.carried).toBe(1);
    expect(x.events).toContain('orb');
    x = stepRide({ ...x, x: STEEPLE[0] + DELIVER_R - 1, z: STEEPLE[1] }, NONE);
    expect(x.delivered).toBe(1);
    expect(x.carried).toBe(0);
    expect(score(x)).toBe(500);
  });

  it('the courier finishes both goal modes', () => {
    for (const mode of ['starlight', 'constellation'] as const) {
      let r = newRide(5, mode);
      while (!r.over && r.t < 60 * 60 * 10) r = stepRide(r, controlsOf(courier(r)));
      expect(r.over, mode).toBe(true);
      expect(r.delivered).toBe(ORBS[mode]);
    }
  }, 60_000);
});

describeAdapterContract(env, {
  configs: [{ options: { mode: 'starlight' } }],
  playouts: 1,
  maxSteps: 60 * 60 * 15 + 1,
});
