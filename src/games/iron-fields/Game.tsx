import type { GameProps } from '../../core/game-engine/types';
import { IronTable } from './IronTable';

export function Game({ services }: GameProps) {
  return <IronTable services={services} />;
}
