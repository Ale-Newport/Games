/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Duel, DuelAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Duel>, DuelAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Duel>, DuelAction>['env'],
  agents: arcadeAgents(DEF, {
    duellist: {
      label: { en: 'Duellist', es: 'Duelista' },
      description: {
        en: 'Keeps out of the star’s grip, dodges torpedoes about to hit it by burning across their path, and otherwise aims where the rival will be when a torpedo arrives and fires when lined up.',
        es: 'Se mantiene lejos del tirón de la estrella, esquiva los torpedos que van a alcanzarle cruzando su trayectoria y, si no, apunta a donde estará el rival cuando llegue el torpedo y dispara al alinearse.',
      },
    },
    gunner: {
      label: { en: 'Gunner', es: 'Artillero' },
      description: {
        en: 'Turns towards the rival’s current position and fires; it only burns when the star is very close.',
        es: 'Gira hacia la posición actual del rival y dispara; solo enciende el motor si la estrella está muy cerca.',
      },
    },
  }),
};
export default bundle;
