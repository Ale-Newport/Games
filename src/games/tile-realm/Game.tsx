import type { GameProps } from '../../core/game-engine/types';
import { RealmTable } from './RealmTable';

export function Game({ services }: GameProps) {
  return <RealmTable services={services} />;
}
