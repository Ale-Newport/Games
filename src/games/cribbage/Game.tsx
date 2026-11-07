import type { GameProps } from '../../core/game-engine/types';
import { CribbageGame } from './CribbageGame';

export function Game({ services }: GameProps) {
  return <CribbageGame services={services} />;
}
