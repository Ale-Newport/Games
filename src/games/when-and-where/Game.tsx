import type { GameProps } from '../../core/game-engine/types';
import { WhenWhereGame } from './WhenWhereGame';

export function Game(props: GameProps) {
  return <WhenWhereGame {...props} />;
}
