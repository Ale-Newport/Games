import type { GameProps } from '../../core/game-engine/types';
import { RoughGuessGame } from './RoughGuessGame';

export function Game(props: GameProps) {
  return <RoughGuessGame {...props} />;
}
