import type { GameProps } from '../../core/game-engine/types';
import { CountryShapeGame } from './CountryShapeGame';
import type { ShapeState } from './engine';

export function shapeAchievements(
  s: ShapeState,
  unlock: (id: string) => void,
  daily: Record<string, number>,
) {
  if (s.status === 'won') {
    unlock('first-shape');
    if (s.guesses.length === 1) unlock('first-try');
  }
  if (s.capital === 'right' && s.flag === 'right' && s.status === 'won') unlock('three-stars');
  if (Object.values(daily).filter((n) => n > 0).length >= 7) unlock('week');
}

export function Game({ services }: GameProps) {
  return <CountryShapeGame services={services} onFinish={shapeAchievements} />;
}
