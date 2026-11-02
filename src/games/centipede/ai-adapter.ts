/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Guard, GuardAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Guard>, GuardAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Guard>, GuardAction>['env'],
  agents: arcadeAgents(DEF, {
    gunner: {
      label: { en: 'Gunner', es: 'Artillero' },
      description: {
        en: 'Keeps squirting, slides under the column the lowest segment will reach next and steps away from the beetle, acorns and segments in the patch.',
        es: 'Riega sin parar, se coloca bajo la columna a la que llegará el segmento más bajo y se aparta del escarabajo, las bellotas y los segmentos de su parcela.',
      },
    },
    sprinkler: {
      label: { en: 'Sprinkler', es: 'Aspersor' },
      description: {
        en: 'Squirts non-stop and only drifts under the lowest segment; it never dodges.',
        es: 'Riega sin parar y solo se desplaza bajo el segmento más bajo; nunca esquiva.',
      },
    },
  }),
};
export default bundle;
