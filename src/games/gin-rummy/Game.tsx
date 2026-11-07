import type { GameProps } from '../../core/game-engine/types';
import { GinGame } from './GinGame';

export function Game({ services }: GameProps) {
  return <GinGame services={services} />;
}
