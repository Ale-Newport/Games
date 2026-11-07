import type { GameProps } from '../../core/game-engine/types';
import { MemoryTable } from './MemoryTable';

export function Game({ services }: GameProps) {
  return <MemoryTable services={services} />;
}
