import type { GameProps } from '../../core/game-engine/types';
import { BullsGame } from './BullsGame';

export function Game({ services }: GameProps) {
  return <BullsGame services={services} />;
}
