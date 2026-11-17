/** The AI environment: one ride per episode (config `{ options: { mode } }`), one discrete control set per 1/60 s step. Reward: the score. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { SIM } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Ride } from './sim';

export const env = arcadeEnv(SIM, RULES_VERSION, RULESET_ID, 60 * 60 * 15);

export const bundle: AiBundle<ArcadeRun<Ride>, string> = {
  env: env as unknown as AiBundle<ArcadeRun<Ride>, string>['env'],
  agents: arcadeAgents(SIM, {
    courier: {
      label: { en: 'Courier', es: 'Mensajero' },
      description: {
        en: 'Rides to the nearest orb (leaping for high ones, steering round houses) and home to the steeple with four in the basket.',
        es: 'Va al orbe más cercano (saltando a por los altos y esquivando casas) y vuelve al campanario con cuatro en la cesta.',
      },
    },
  }),
};
export default bundle;
