/** The simulation side for the AI environment. */
import type { ArcadeSim } from '../shared/arcade/environment';
import {
  ACTIONS,
  controlsOf,
  courier,
  HZ,
  isRide,
  newRide,
  score,
  stepRide,
  type Mode,
  type Ride,
} from './sim';

export const SIM: ArcadeSim<Ride, string> = {
  id: 'painted-night-ride',
  hz: HZ,
  actions: ACTIONS,
  options: [
    {
      id: 'mode',
      label: 'menu.mode',
      values: ['starlight', 'constellation', 'free'],
      initial: 'starlight',
    },
  ],
  init: (seed, o) => newRide(seed, (o.mode ?? 'starlight') as Mode),
  step: (r, a) => stepRide(r, controlsOf(a)),
  over: (r) => r.over,
  score,
  result: (r, o) => ({
    outcome: 'complete',
    score: score(r),
    timeMs: Math.round((r.t / HZ) * 1000),
    mode: o.mode ?? 'starlight',
  }),
  validate: isRide,
  policies: { courier },
};
