import type { GameProps } from '../../core/game-engine/types';
import { NonogramGame } from './NonogramGame';

export function Game({ services }: GameProps) {
  return <NonogramGame services={services} />;
}
