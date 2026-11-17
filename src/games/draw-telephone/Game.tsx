import type { GameProps } from '../../core/game-engine/types';
import type { TelephoneState } from './engine';
import { TelephoneGame } from './TelephoneGame';

export function telephoneAchievements(s: TelephoneState, unlock: (id: string) => void) {
  unlock('first-album');
  if (s.players.filter((p) => !p.bot).length >= 3) unlock('party');
  if (s.players.length >= 8) unlock('long-line');
}

export function Game({ services }: GameProps) {
  return <TelephoneGame services={services} onFinish={telephoneAchievements} />;
}
