import type { GameProps } from '../../core/game-engine/types';
import { RiichiTable } from './RiichiTable';

export function Game({ services }: GameProps) {
  return <RiichiTable services={services} />;
}
