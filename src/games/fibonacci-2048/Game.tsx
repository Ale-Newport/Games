import type { GameProps } from '../../core/game-engine/types';
import { MergeGame } from '../shared/merge/MergeGame';
import { LEVELS, rank } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return <MergeGame services={services} levels={LEVELS} rank={rank} strings={STRINGS} />;
}
