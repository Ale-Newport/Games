import type { GameProps } from '../../core/game-engine/types';
import { SlidingGame } from '../shared/sliding/SlidingGame';
import { SPECS } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return <SlidingGame services={services} specs={SPECS} strings={STRINGS} speedMs={120_000} />;
}
