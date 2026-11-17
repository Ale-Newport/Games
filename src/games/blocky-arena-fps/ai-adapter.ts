/** The AI environment: one match per episode (config `{ options: { map, loadout, bots, level, length } }`), one discrete action (move, turn, look, fire) per 1/60 s step; the bots are part of the environment. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { SIM } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Match } from './sim';

export const env = arcadeEnv(SIM, RULES_VERSION, RULESET_ID, 60 * 60 * 7);

export const bundle: AiBundle<ArcadeRun<Match>, string> = {
  env: env as unknown as AiBundle<ArcadeRun<Match>, string>['env'],
  agents: arcadeAgents(SIM, {
    soldier: {
      label: { en: 'Soldier', es: 'Soldado' },
      description: {
        en: 'The hard bot brain on your seat: roams by A*, reacts, tracks and fires (quantized to the discrete actions).',
        es: 'El cerebro del bot difícil en tu puesto: patrulla con A*, reacciona, sigue al objetivo y dispara (con las acciones discretas).',
      },
    },
  }),
};
export default bundle;
