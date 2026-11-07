/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { ROCKS } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { RockAction, Rocks } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(ROCKS, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Rocks>, RockAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Rocks>, RockAction>['env'],
  agents: arcadeAgents(ROCKS, {
    pilot: {
      label: { en: 'Pilot', es: 'Piloto' },
      description: {
        en: 'Leads its shots on the nearest threat, thrusts out of collisions and jumps only when cornered.',
        es: 'Adelanta los disparos a la amenaza más cercana, acelera para evitar choques y salta solo si está acorralado.',
      },
    },
    turret: {
      label: { en: 'Turret', es: 'Torreta' },
      description: { en: 'Spins in place and fires.', es: 'Gira en el sitio y dispara.' },
    },
  }),
};
export default bundle;
