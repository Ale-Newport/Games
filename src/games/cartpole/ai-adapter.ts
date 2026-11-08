/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Cart, CartAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Cart>, CartAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Cart>, CartAction>['env'],
  agents: arcadeAgents(DEF, {
    balancer: {
      label: { en: 'Balancer', es: 'Equilibrista' },
      description: {
        en: 'A fixed linear controller: pushes the way the pole’s lean and swing point, plus a little of the cart’s offset and speed to stay near the middle.',
        es: 'Un controlador lineal fijo: empuja hacia donde apuntan la inclinación y el giro del palo, más un poco de la posición y la velocidad del carro para quedarse cerca del centro.',
      },
    },
    leaner: {
      label: { en: 'Leaner', es: 'Ingenuo' },
      description: {
        en: 'Pushes the way the pole leans and nothing else — it keeps the pole up for a while but drifts off the rail.',
        es: 'Empuja hacia donde se inclina el palo y nada más: lo mantiene un rato, pero acaba saliéndose del raíl.',
      },
    },
  }),
};
export default bundle;
