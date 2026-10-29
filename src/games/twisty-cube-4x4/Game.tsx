import type { GameProps } from '../../core/game-engine/types';
import { CubeGame } from '../shared/cube/CubeGame';
import { SPECS, solve } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <CubeGame services={services} specs={SPECS} solve={solve} strings={STRINGS} speedMs={900_000} />
  );
}
