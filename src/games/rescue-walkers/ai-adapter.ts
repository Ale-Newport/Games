/** The AI environment: one game (six levels) per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Rescue, RescueAction } from './sim';

/** A 30-minute limit ends games that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Rescue>, RescueAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Rescue>, RescueAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'At the start of each level it searches (a beam search over one skill at a time, played out with the real rules) for the orders that bring the most wanderers home, then hands each skill out at its moment.',
        es: 'Al empezar cada nivel busca (una búsqueda en haz que añade una habilidad cada vez y la prueba con las reglas reales) las órdenes que llevan a casa a más caminantes, y luego da cada habilidad en su momento.',
      },
    },
    idle: {
      label: { en: 'Onlooker', es: 'Espectador' },
      description: {
        en: 'Hands out nothing, to show what each level does on its own.',
        es: 'No reparte nada, para ver qué pasa en cada nivel por sí solo.',
      },
    },
  }),
};
export default bundle;
