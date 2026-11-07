import type { GameProps } from '../../core/game-engine/types';
import { WordGame } from './WordGame';

export function Game({ services }: GameProps) {
  return <WordGame services={services} />;
}
