import type { GameProps } from '../../core/game-engine/types';
import { BombGame } from './BombGame';
import type { BombState } from './engine';

export function bombAchievements(s: BombState, unlock: (id: string) => void) {
  if (s.winner === 0) {
    unlock('survivor');
    if (s.players.length >= 6) unlock('big-room');
    if (s.difficulty === 'hard') unlock('hard-win');
  }
}

export function Game({ services }: GameProps) {
  return <BombGame services={services} onFinish={bombAchievements} />;
}
