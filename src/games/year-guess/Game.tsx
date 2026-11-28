import type { GameProps } from '../../core/game-engine/types';
import { YearGuessGame } from './YearGuessGame';

export function Game(props: GameProps) {
  return <YearGuessGame {...props} />;
}
