import type { GameProps } from '../../core/game-engine/types';
import { puzzleById, type StrandsState } from './engine';
import { StrandsGame } from './StrandsGame';

export function strandsAchievements(
  s: StrandsState,
  unlock: (id: string) => void,
  results: Record<string, number>,
) {
  if (s.status !== 'won') return;
  unlock('first-solve');
  if (s.hintsUsed === 0) unlock('no-hints');
  if (s.log[0]?.word === puzzleById(s.puzzleId).spangram) unlock('spangram-first');
  if (Object.keys(results).length >= 10) unlock('ten');
}

export function Game({ services }: GameProps) {
  return <StrandsGame services={services} onFinish={strandsAchievements} />;
}
