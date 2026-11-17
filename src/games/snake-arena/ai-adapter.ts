/** The AI environment: one life per episode (config `{ options: { bots, level } }`), one steering action per 1/30 s step; the other snakes are part of the environment. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { SNAKES } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Arena, SnakeAction } from './sim';

export const env = arcadeEnv(SNAKES, RULES_VERSION, RULESET_ID, 30 * 60 * 20);

export const bundle: AiBundle<ArcadeRun<Arena>, SnakeAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Arena>, SnakeAction>['env'],
  agents: arcadeAgents(SNAKES, {
    hunter: {
      label: { en: 'Hunter', es: 'Cazadora' },
      description: {
        en: 'Eats, dodges along safe arcs and cuts in front of smaller snakes.',
        es: 'Come, esquiva por trayectorias seguras y se cruza delante de serpientes más pequeñas.',
      },
    },
    forager: {
      label: { en: 'Forager', es: 'Recolectora' },
      description: {
        en: 'Looks only a short way ahead and just eats.',
        es: 'Mira poco por delante y solo come.',
      },
    },
  }),
};
export default bundle;
