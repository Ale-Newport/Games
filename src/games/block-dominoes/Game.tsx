import type { GameProps } from '../../core/game-engine/types';
import { BonesTable } from '../shared/bones/BonesTable';
import { BLOCK, type BonesGame } from '../shared/bones/engine';
import { STRINGS } from './i18n';

function onGameEnd(g: BonesGame, level: 'easy' | 'hard', unlock: (id: string) => void) {
  if (g.winner !== 0) return;
  unlock('first');
  if (level === 'hard') unlock('hard');
  if (g.players === 4) unlock('four');
  if (g.scores.every((s, p) => p === 0 || s === 0)) unlock('shutout');
}

export function Game({ services }: GameProps) {
  return (
    <BonesTable
      services={services}
      rules={BLOCK}
      prefix="bd"
      strings={STRINGS}
      onGameEnd={onGameEnd}
    />
  );
}
