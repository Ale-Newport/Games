import type { GameProps } from '../../core/game-engine/types';
import { playerScore, progressUnits, type SurveyState } from '../shared/survey/engine';
import { SurveyGame, type SurveyDefinition } from '../shared/survey/SurveyGame';
import { POLARITY } from './rules';

/** Achievements are judged on player 0 in solo runs and on every player in a party. */
export function climbAchievements(s: SurveyState, unlock: (id: string) => void, streak: number) {
  unlock('first-climb');
  if (s.kind === 'party') unlock('party');
  if (s.kind === 'daily' && streak >= 3) unlock('streak-3');
  for (let p = 0; p < s.players; p++) {
    const km = progressUnits('common', playerScore(s, p));
    if (km >= 100) unlock('karman');
    if (km >= 400) unlock('station');
    if (km >= 600) unlock('orbit');
    if (s.answers.every((row) => row[p]?.band === 'a')) unlock('hive-mind');
  }
}

export const CLIMB: SurveyDefinition = { polarity: POLARITY, onFinish: climbAchievements };

export function Game({ services }: GameProps) {
  return <SurveyGame def={CLIMB} services={services} />;
}
