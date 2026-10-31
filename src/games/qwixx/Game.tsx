import type { GameProps } from '../../core/game-engine/types';
import { RowsTable } from './RowsTable';

export function Game({ services }: GameProps) {
  return <RowsTable services={services} />;
}
