import type { GameProps } from '../../core/game-engine/types';
import { ShapersTable } from './ShapersTable';

export function Game({ services }: GameProps) {
  return <ShapersTable services={services} />;
}
