import type { GameProps } from '../../core/game-engine/types';
import { BackgammonGame } from './BackgammonGame';

export function Game({ services }: GameProps) {
  return <BackgammonGame services={services} />;
}
