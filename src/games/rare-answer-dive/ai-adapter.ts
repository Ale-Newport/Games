import type { AiBundle } from '../../ai/protocols/bundle';
import type { SurveyAction, SurveyState } from '../shared/survey/engine';
import { createSurveyEnv, surveyPresets } from '../shared/survey/environment';
import { POLARITY, RULES_VERSION, RULESET_ID } from './rules';

export const env = createSurveyEnv(POLARITY, {
  id: 'rare-answer-dive',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
});

export const AGENT_PRESETS = surveyPresets();

export const bundle: AiBundle<SurveyState, SurveyAction> = {
  env: env as unknown as AiBundle<SurveyState, SurveyAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
