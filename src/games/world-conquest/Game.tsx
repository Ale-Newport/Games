import type { GameProps } from '../../core/game-engine/types';
import { WorldTable } from './WorldTable';

export function Game({ services }: GameProps) {
  return <WorldTable services={services} />;
}
