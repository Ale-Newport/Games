/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import type { MazeAction, MazeGame } from '../shared/maze/sim';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<MazeGame>, MazeAction> = {
  env: env as unknown as AiBundle<ArcadeRun<MazeGame>, MazeAction>['env'],
  agents: arcadeAgents(DEF, {
    runner: {
      label: { en: 'Runner', es: 'Corredor' },
      description: {
        en: 'At each junction weighs how soon each way reaches food (and blue sentinels) against how close the hunting sentinels could get.',
        es: 'En cada cruce sopesa lo pronto que cada camino llega a la comida (y a los centinelas azules) frente a lo cerca que podrían llegar los centinelas cazadores.',
      },
    },
    grazer: {
      label: { en: 'Grazer', es: 'Pastador' },
      description: {
        en: 'Heads for the nearest seed and ignores the sentinels.',
        es: 'Va a la semilla más cercana e ignora a los centinelas.',
      },
    },
  }),
};
export default bundle;
