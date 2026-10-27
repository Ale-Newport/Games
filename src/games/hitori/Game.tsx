import type { GameProps } from '../../core/game-engine/types';
import { HitoriGame } from './HitoriGame';

export function Game({ services }: GameProps) {
  return <HitoriGame services={services} />;
}
