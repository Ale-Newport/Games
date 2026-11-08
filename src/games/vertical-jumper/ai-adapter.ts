/** The AI environment: one climb per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Climb, ClimbAction } from './sim';

/** A 30-minute limit ends climbs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Climb>, ClimbAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Climb>, ClimbAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificadora' },
      description: {
        en: 'Tries holding left, right or nothing — or one and then another — until the next bounce, and steers for the highest safe bounce, never one that leaves no way up past a sprite.',
        es: 'Prueba a mantener izquierda, derecha o nada —o una cosa y luego otra— hasta el siguiente rebote y va al rebote seguro más alto, nunca a uno que no deje paso junto a un duende.',
      },
    },
    drifter: {
      label: { en: 'Drifter', es: 'Despistada' },
      description: {
        en: 'Steers straight for the nearest cloud above where she last bounced, ignoring sprites and drifting clouds.',
        es: 'Va directa a la nube más cercana por encima de su último rebote, sin fijarse en los duendes ni en las nubes que se mueven.',
      },
    },
  }),
};
export default bundle;
