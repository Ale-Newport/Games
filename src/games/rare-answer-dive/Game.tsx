import type { GameProps } from '../../core/game-engine/types';
import { playerScore, progressUnits, type SurveyState } from '../shared/survey/engine';
import { SurveyGame, type SurveyDefinition } from '../shared/survey/SurveyGame';
import { POLARITY } from './rules';

/** Achievements are judged on player 0 in solo runs and on every player in a party. */
export function diveAchievements(s: SurveyState, unlock: (id: string) => void, streak: number) {
  unlock('first-dive');
  if (s.kind === 'party') unlock('party');
  if (s.kind === 'daily' && streak >= 3) unlock('streak-3');
  for (let p = 0; p < s.players; p++) {
    const depth = progressUnits('rare', playerScore(s, p));
    const bands = s.answers.map((row) => row[p]?.band ?? null);
    if (bands.includes('f')) unlock('pearl');
    if (depth >= 3800) unlock('titanic');
    if (depth >= 6000) unlock('hadal');
    if (bands.every((b) => b !== null && b !== 'a' && b !== 'b')) unlock('no-bait');
  }
}

export const DIVE: SurveyDefinition = { polarity: POLARITY, onFinish: diveAchievements };

export function Game({ services }: GameProps) {
  return <SurveyGame def={DIVE} services={services} />;
}
