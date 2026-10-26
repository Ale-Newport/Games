import type { GameProps } from '../../core/game-engine/types';
import { EuchreGame } from './EuchreGame';

export function Game({ services }: GameProps) {
  return <EuchreGame services={services} />;
}
