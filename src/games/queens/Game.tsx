import type { GameProps } from '../../core/game-engine/types';
import { QueensGame } from './QueensGame';

export function Game({ services }: GameProps) {
  return <QueensGame services={services} />;
}
