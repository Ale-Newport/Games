/** The AI environment: one life per episode (config `{ options: { bots, level } }`), one steering action per 1/30 s step; the other cells are part of the environment. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { CELLS } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Dish } from './sim';

export const env = arcadeEnv(CELLS, RULES_VERSION, RULESET_ID, 30 * 60 * 20);

export const bundle: AiBundle<ArcadeRun<Dish>, string> = {
  env: env as unknown as AiBundle<ArcadeRun<Dish>, string>['env'],
  agents: arcadeAgents(CELLS, {
    hunter: {
      label: { en: 'Hunter', es: 'Cazadora' },
      description: {
        en: 'Flees bigger cells early, chases smaller ones and splits to catch them.',
        es: 'Huye pronto de las células grandes, persigue a las pequeñas y se divide para atraparlas.',
      },
    },
    grazer: {
      label: { en: 'Grazer', es: 'Pastora' },
      description: {
        en: 'Eats pellets and runs from danger close by.',
        es: 'Come bolitas y huye del peligro cercano.',
      },
    },
  }),
};
export default bundle;
