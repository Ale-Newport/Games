import type { GameProps } from '../../core/game-engine/types';
import { IslesTable } from './IslesTable';

export function Game({ services }: GameProps) {
  return <IslesTable services={services} />;
}
