import type { GameProps } from '../../core/game-engine/types';
import { HeartsGame } from './HeartsGame';

export function Game({ services }: GameProps) {
  return <HeartsGame services={services} />;
}
