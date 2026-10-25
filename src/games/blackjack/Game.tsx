import type { GameProps } from '../../core/game-engine/types';
import { BlackjackGame } from './BlackjackGame';

export function Game({ services }: GameProps) {
  return <BlackjackGame services={services} />;
}
