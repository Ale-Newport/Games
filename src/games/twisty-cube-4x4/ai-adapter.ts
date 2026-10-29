/** The AI environment: one scramble per episode (config `{ level }`), solved or out of turns. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createCubeEnv, cubeAgents } from '../shared/cube/ai';
import type { CubeState } from '../shared/cube/play';
import { SPECS, solve } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const SOLVER = {
  en: 'Undoes the scramble and the turns made so far (simplified).',
  es: 'Deshace la mezcla y los giros hechos (simplificados).',
};

export const cube4Env = createCubeEnv('twisty-cube-4x4', RULESET_ID, RULES_VERSION, SPECS);

export const bundle: AiBundle<CubeState, string> = {
  env: cube4Env as unknown as AiBundle<CubeState, string>['env'],
  agents: cubeAgents(solve, SOLVER),
};
export default bundle;
