import type { GameProps } from '../../core/game-engine/types';
import { EquationGame } from './EquationGame';

export function Game(props: GameProps) {
  return <EquationGame {...props} />;
}
