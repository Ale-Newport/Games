import type { GameProps } from '../../core/game-engine/types';
import { SokobanGame } from './SokobanGame';

export function Game({ services }: GameProps) {
  return <SokobanGame services={services} />;
}
