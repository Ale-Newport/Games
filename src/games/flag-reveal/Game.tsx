import type { GameProps } from '../../core/game-engine/types';
import type { FlagState } from './engine';
import { FlagRevealGame } from './FlagRevealGame';

export function flagAchievements(
  s: FlagState,
  unlock: (id: string) => void,
  daily: Record<string, number>,
) {
  if (s.status !== 'won') return;
  unlock('first-flag');
  if (s.guesses.length === 1) unlock('blind');
  if (s.guesses.length <= 3) unlock('quick');
  if (Object.values(daily).filter((n) => n > 0).length >= 7) unlock('week');
}

export function Game({ services }: GameProps) {
  return <FlagRevealGame services={services} onFinish={flagAchievements} />;
}
