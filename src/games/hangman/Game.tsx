import type { GameProps } from '../../core/game-engine/types';
import { HangmanGame } from './HangmanGame';

export function Game({ services }: GameProps) {
  return <HangmanGame services={services} />;
}
