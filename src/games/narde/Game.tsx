import type { GameProps } from '../../core/game-engine/types';
import { NardeGame } from './NardeGame';

export function Game({ services }: GameProps) {
  return <NardeGame services={services} />;
}
