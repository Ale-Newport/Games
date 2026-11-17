import type { AiBundle } from '../../ai/protocols/bundle';
import type { QuizState } from '../shared/quiz/engine';
import { createQuizEnv, quizPresets, type QuizAction } from '../shared/quiz/environment';
import { QUIZZES } from './quizzes';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const env = createQuizEnv(QUIZZES, {
  id: 'world-quiz',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const AGENT_PRESETS = quizPresets(QUIZZES);

export const bundle: AiBundle<QuizState, QuizAction> = {
  env: env as unknown as AiBundle<QuizState, QuizAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
