import type { GameProps } from '../../core/game-engine/types';
import { PegGame } from './PegGame';

export function Game({ services }: GameProps) {
  return <PegGame services={services} />;
}
