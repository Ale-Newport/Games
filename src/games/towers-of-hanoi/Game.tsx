import type { GameProps } from '../../core/game-engine/types';
import { HanoiGame } from './HanoiGame';

export function Game({ services }: GameProps) {
  return <HanoiGame services={services} />;
}
