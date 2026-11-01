import type { GameProps } from '../../core/game-engine/types';
import { NavalTable } from './NavalTable';

export function Game({ services }: GameProps) {
  return <NavalTable services={services} />;
}
