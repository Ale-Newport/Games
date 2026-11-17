/** The AI environment: one match per episode (config `{ options: { mode, bot, rounds } }`), one set of held keys per 1/60 s step on your well; the opponent is the built-in bot. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DUEL } from './definition';
import type { Duel } from './duel';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const env = arcadeEnv(DUEL, RULES_VERSION, RULESET_ID, 60 * 60 * 15);

export const bundle: AiBundle<ArcadeRun<Duel>, string> = {
  env: env as unknown as AiBundle<ArcadeRun<Duel>, string>['env'],
  agents: arcadeAgents(DUEL, {
    bot: {
      label: { en: 'Expert stacker', es: 'Apilador experto' },
      description: {
        en: 'Builds around one well for multi-line attacks and switches to survival when the stack gets high.',
        es: 'Construye alrededor de un pozo para atacar con varias líneas y pasa a sobrevivir cuando la pila sube.',
      },
    },
  }),
};
export default bundle;
