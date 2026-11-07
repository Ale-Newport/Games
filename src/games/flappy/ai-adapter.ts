/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { FlapAction, Flight } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Flight>, FlapAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Flight>, FlapAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Every four steps it tries every pattern of flaps over the next 40 steps against the stacks in view, and keeps the one that stays clearest of the rock.',
        es: 'Cada cuatro pasos prueba todas las combinaciones de aleteos de los 40 pasos siguientes frente a los farallones a la vista y se queda con la que más se aleja de la roca.',
      },
    },
    tracker: {
      label: { en: 'Tracker', es: 'Seguidor' },
      description: {
        en: 'Flaps whenever it sinks below a point a little under the next gap’s middle.',
        es: 'Aletea cada vez que baja de un punto algo por debajo del centro del siguiente hueco.',
      },
    },
  }),
};
export default bundle;
