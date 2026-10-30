import type { GameProps } from '../../core/game-engine/types';
import { SnakesTable } from './SnakesTable';

export function Game({ services }: GameProps) {
  return <SnakesTable services={services} />;
}
