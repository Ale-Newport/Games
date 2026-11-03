/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Run, RunAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Run>, RunAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Run>, RunAction>['env'],
  agents: arcadeAgents(DEF, {
    runner: {
      label: { en: 'Runner', es: 'Corredora' },
      description: {
        en: 'Looks a second ahead and tries waiting, a short, medium or full jump, or a slide — now and then once more later — keeping the plan that survives longest and picks up coins on the way.',
        es: 'Mira un segundo por delante y prueba esperar, un salto corto, medio o completo, o deslizarse —ahora y otra vez más tarde— y se queda con el plan que más aguanta y que coge monedas por el camino.',
      },
    },
    hopper: {
      label: { en: 'Hopper', es: 'Saltarina' },
      description: {
        en: 'Takes a full jump whenever a gap, a higher roof or anything in the way comes near; it never slides.',
        es: 'Da un salto completo cada vez que se acerca un hueco, un tejado más alto o algo en el camino; nunca se desliza.',
      },
    },
  }),
};
export default bundle;
