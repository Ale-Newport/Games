import type { GameProps } from '../../core/game-engine/types';
import { FishGame } from './FishGame';

export function Game({ services }: GameProps) {
  return <FishGame services={services} />;
}
