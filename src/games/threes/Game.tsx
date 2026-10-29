import type { GameProps } from '../../core/game-engine/types';
import { TriosGame } from './TriosGame';

export function Game({ services }: GameProps) {
  return <TriosGame services={services} />;
}
