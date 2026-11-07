import type { GameProps } from '../../core/game-engine/types';
import { BonesTable } from '../shared/bones/BonesTable';
import { ALL_FIVES, act, newBones, type BonesGame } from '../shared/bones/engine';
import { STRINGS } from './i18n';

/** The most seat 0 scored with a single play, found by replaying the game. */
function bestPlay(g: BonesGame): number {
  let s = newBones(ALL_FIVES, g.players, g.seed);
  let best = 0;
  for (const a of g.history) {
    const mover = s.turn;
    s = act(s, a);
    const ev = s.event;
    if (mover !== 0 || !ev) continue;
    if (ev.kind === 'fives') best = Math.max(best, ev.points);
    else if (a.startsWith('play:')) best = Math.max(best, ev.fives);
  }
  return best;
}

function onGameEnd(g: BonesGame, level: 'easy' | 'hard', unlock: (id: string) => void) {
  if (bestPlay(g) >= 20) unlock('twenty');
  if (g.winner !== 0) return;
  unlock('first');
  if (level === 'hard') unlock('hard');
  if (g.players === 4) unlock('four');
}

export function Game({ services }: GameProps) {
  return (
    <BonesTable
      services={services}
      rules={ALL_FIVES}
      prefix="af"
      strings={STRINGS}
      onGameEnd={onGameEnd}
    />
  );
}
