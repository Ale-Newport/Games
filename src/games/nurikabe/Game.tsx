import type { GameProps } from '../../core/game-engine/types';
import { NurikabeGame } from './NurikabeGame';

export function Game({ services }: GameProps) {
  return <NurikabeGame services={services} />;
}
