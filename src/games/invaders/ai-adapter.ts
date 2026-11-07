/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { INVADERS } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { InvAction, Invaders } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(INVADERS, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Invaders>, InvAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Invaders>, InvAction>['env'],
  agents: arcadeAgents(INVADERS, {
    gunner: {
      label: { en: 'Gunner', es: 'Artillero' },
      description: {
        en: 'Dodges falling bombs, lines up under the nearest column and fires when something is above.',
        es: 'Esquiva las bombas, se coloca bajo la columna más cercana y dispara si hay algo encima.',
      },
    },
    sweeper: {
      label: { en: 'Sweeper', es: 'Barrendero' },
      description: {
        en: 'Sweeps side to side, firing whenever it can.',
        es: 'Barre de lado a lado disparando siempre que puede.',
      },
    },
  }),
};
export default bundle;
