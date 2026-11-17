import type { GameProps } from '../../core/game-engine/types';
import { ranking, type SketchState } from './engine';
import { SketchGame } from './SketchGame';

export function sketchAchievements(s: SketchState, unlock: (id: string) => void) {
  unlock('first-game');
  if (ranking(s)[0] === 0) unlock('winner');
  if (s.players.length >= 8 && ranking(s)[0] === 0) unlock('full-room');
}

export function Game({ services }: GameProps) {
  return <SketchGame services={services} onFinish={sketchAchievements} />;
}
