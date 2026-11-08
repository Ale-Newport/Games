/** The AI environment: one game per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { BubbleAction, Bubbles } from './sim';

/** A 30-minute limit ends games that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Bubbles>, BubbleAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Bubbles>, BubbleAction>['env'],
  agents: arcadeAgents(DEF, {
    aimer: {
      label: { en: 'Aimer', es: 'Tiradora' },
      description: {
        en: 'Tries all 65 angles, bank shots included, for the bubble in the cannon and the next one, and fires the shot that pops (and drops) the most; failing that, it builds on its own colour as high as it can.',
        es: 'Prueba los 65 ángulos, rebotes incluidos, con la burbuja del cañón y con la siguiente, y dispara lo que más explota (y hace caer); si no, la pone junto a su color lo más arriba posible.',
      },
    },
    sprayer: {
      label: { en: 'Sprayer', es: 'Ametralladora' },
      description: {
        en: 'Fires straight at the nearest bubble of its colour, without thinking about what is in the way.',
        es: 'Dispara en línea recta a la burbuja más cercana de su color, sin pensar en lo que hay en medio.',
      },
    },
  }),
};
export default bundle;
