import type { GameProps } from '../../core/game-engine/types';
import { CategoryGame } from './CategoryGame';
import { humanIndexes, scoreRound, winners, type CLState } from './engine';

export function categoryAchievements(s: CLState, unlock: (id: string) => void) {
  const humans = humanIndexes(s);
  const w = winners(s);
  if (s.settings.bots > 0 && w.some((i) => humans.includes(i))) {
    unlock('first-win');
    if (s.settings.skill === 'hard') unlock('beat-sharp');
  }
  if (humans.length > 1) unlock('table');
  s.rounds.forEach((r, ri) => {
    const scored = scoreRound(s, ri);
    for (const h of humans) {
      const row = scored[h]!;
      if (r.categories.length === 12 && row.every((x) => x.points > 0)) unlock('full-list');
      if (row.some((x) => x.points >= 3)) unlock('alliterator');
      if (
        ['Q', 'X', 'Z', 'Ñ', 'K', 'Y'].includes(r.letter) &&
        row.filter((x) => x.points > 0).length >= 6
      )
        unlock('hard-letter');
    }
  });
}

export function Game({ services }: GameProps) {
  return <CategoryGame services={services} onFinish={categoryAchievements} />;
}
