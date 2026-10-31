/** The AI environment: a whole game to the target per episode, 2–4 seats (config `{ players }`, 2 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import type { BonesGame } from '../shared/bones/engine';
import { DRAW } from '../shared/bones/engine';
import { BONES_AGENTS, bonesEnv } from '../shared/bones/environment';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const env = bonesEnv('draw-dominoes', RULES_VERSION, RULESET_ID, DRAW);

export const bundle: AiBundle<BonesGame, string> = {
  env: env as unknown as AiBundle<BonesGame, string>['env'],
  agents: BONES_AGENTS,
};
export default bundle;
