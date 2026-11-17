import type { GameProps } from '../../core/game-engine/types';
import { PasswordGame } from './PasswordGame';

export function Game(props: GameProps) {
  return <PasswordGame {...props} />;
}
