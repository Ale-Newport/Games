import type { GameProps } from '../../core/game-engine/types';
import type { GlobeState } from './engine';
import { GlobeGame } from './GlobeGame';

export function globeAchievements(
  s: GlobeState,
  unlock: (id: string) => void,
  daily: Record<string, number>,
) {
  if (s.status !== 'won') return;
  unlock('first-find');
  if (s.guesses.length <= 5) unlock('five');
  if (s.guesses.length <= 3) unlock('three');
  if (Object.values(daily).filter((n) => n > 0).length >= 7) unlock('week');
}

export function Game({ services }: GameProps) {
  return <GlobeGame services={services} onFinish={globeAchievements} />;
}
