/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { LanceAction, Lances } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Lances>, LanceAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Lances>, LanceAction>['env'],
  agents: arcadeAgents(DEF, {
    lancer: {
      label: { en: 'Lancer', es: 'Justador' },
      description: {
        en: 'Flies to a point a little above the nearest rival (or to a lying egg), the short way round, never sinking near the lava; when a rival is higher and close it turns away and climbs first.',
        es: 'Vuela a un punto algo por encima del rival más cercano (o a un huevo), por el camino más corto, sin bajar cerca de la lava; si un rival está más alto y cerca, se aparta y sube primero.',
      },
    },
    glider: {
      label: { en: 'Glider', es: 'Planeador' },
      description: {
        en: 'Holds a middle height and drifts towards a rival, whatever its height.',
        es: 'Mantiene una altura media y se acerca a un rival, esté a la altura que esté.',
      },
    },
  }),
};
export default bundle;
