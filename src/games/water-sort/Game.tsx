import type { GameProps } from '../../core/game-engine/types';
import { SortGame } from '../shared/sorting/SortGame';
import { SPECS, rulesFor } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <SortGame services={services} specs={SPECS} rules={rulesFor} look="water" strings={STRINGS} />
  );
}
