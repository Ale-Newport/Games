import type { GameProps } from '../../core/game-engine/types';
import { KakuroGame } from './KakuroGame';

export function Game({ services }: GameProps) {
  return <KakuroGame services={services} />;
}
