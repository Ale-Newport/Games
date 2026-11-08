/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Strike, StrikeAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Strike>, StrikeAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Strike>, StrikeAction>['env'],
  agents: arcadeAgents(DEF, {
    ace: {
      label: { en: 'Ace', es: 'As' },
      description: {
        en: 'Tries each of its nine moves for the next third of a second against the bullets and enemies in flight, keeps the one that stays clearest, lines up under its target, and bombs when nothing is clear.',
        es: 'Prueba cada uno de sus nueve movimientos durante el siguiente tercio de segundo frente a las balas y los enemigos, se queda con el más despejado, se alinea bajo su objetivo y lanza una bomba si no hay salida.',
      },
    },
    sweeper: {
      label: { en: 'Sweeper', es: 'Barredor' },
      description: {
        en: 'Keeps low and slides under the nearest enemy, never dodging.',
        es: 'Se queda abajo y se coloca bajo el enemigo más cercano, sin esquivar nunca.',
      },
    },
  }),
};
export default bundle;
