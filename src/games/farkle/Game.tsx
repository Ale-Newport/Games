import type { GameProps } from '../../core/game-engine/types';
import { FarkleTable } from './FarkleTable';

export function Game({ services }: GameProps) {
  return <FarkleTable services={services} />;
}
