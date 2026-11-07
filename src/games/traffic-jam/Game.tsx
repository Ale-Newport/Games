import type { GameProps } from '../../core/game-engine/types';
import { JamGame } from './JamGame';

export function Game({ services }: GameProps) {
  return <JamGame services={services} />;
}
