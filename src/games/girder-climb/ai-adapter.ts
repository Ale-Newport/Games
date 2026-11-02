/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { GirderAction, Girders } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Girders>, GirderAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Girders>, GirderAction>['env'],
  agents: arcadeAgents(DEF, {
    climber: {
      label: { en: 'Climber', es: 'Escalador' },
      description: {
        en: 'Heads for the nearest whole ladder, jumps drums rolling at it, waits while a ladder is busy and steps aside from drums dropping from above.',
        es: 'Va a la escalera entera más cercana, salta los bidones que ruedan hacia él, espera si la escalera está ocupada y se aparta de los que caen desde arriba.',
      },
    },
    walker: {
      label: { en: 'Walker', es: 'Paseante' },
      description: {
        en: 'Takes the same route but never jumps or waits.',
        es: 'Sigue la misma ruta, pero nunca salta ni espera.',
      },
    },
  }),
};
export default bundle;
