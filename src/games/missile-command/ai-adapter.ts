/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Shield, ShieldAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Shield>, ShieldAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Shield>, ShieldAction>['env'],
  agents: arcadeAgents(DEF, {
    defender: {
      label: { en: 'Defender', es: 'Defensor' },
      description: {
        en: 'Takes the rocket that will strike soonest and is not yet covered, works out where it will be when an interceptor gets there, and fires at that point; rockets aimed at ruined cities come last.',
        es: 'Elige el cohete que antes impactará y aún no está cubierto, calcula dónde estará cuando llegue un interceptor y dispara a ese punto; los que van a ciudades ya en ruinas, al final.',
      },
    },
    sniper: {
      label: { en: 'Sniper', es: 'Francotirador' },
      description: {
        en: 'Fires straight at the lowest rocket’s current position, once a second.',
        es: 'Dispara una vez por segundo a la posición actual del cohete más bajo.',
      },
    },
  }),
};
export default bundle;
