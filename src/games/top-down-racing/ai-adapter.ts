/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Race, RaceAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Race>, RaceAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Race>, RaceAction>['env'],
  agents: arcadeAgents(DEF, {
    driver: {
      label: { en: 'Driver', es: 'Piloto' },
      description: {
        en: 'Aims at a point on the racing line further ahead the faster it goes, slows for the bends it sees coming (more boldly than the computer rivals) and swings out to pass a car close in front.',
        es: 'Apunta a un punto de la trazada más lejano cuanto más rápido va, frena para las curvas que ve venir (con más arrojo que los rivales del ordenador) y se abre para adelantar a un coche que tiene delante.',
      },
    },
    cautious: {
      label: { en: 'Cautious', es: 'Prudente' },
      description: {
        en: 'The same driving, but taking every bend far more slowly.',
        es: 'La misma conducción, pero tomando cada curva mucho más despacio.',
      },
    },
  }),
};
export default bundle;
