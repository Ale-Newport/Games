import type { GameProps } from '../../core/game-engine/types';
import { CaptionGame } from './CaptionGame';
import { roundScores, totals, type BattleState } from './engine';

export function captionAchievements(s: BattleState, unlock: (id: string) => void) {
  unlock('first-battle');
  const humans = s.players.flatMap((p, i) => (p.bot ? [] : [i]));
  const sc = totals(s);
  const best = Math.max(...sc);
  if (humans.some((i) => sc[i] === best)) unlock('champion');
  for (const r of s.history) {
    const rs = roundScores(r);
    for (const h of humans) {
      const others = r.ratings.filter((_, i) => i !== h).map((row) => row[h]);
      if (others.length && others.every((v) => v === 5)) unlock('five-stars');
      if (rs[h] === Math.max(...rs)) unlock('round-winner');
    }
  }
}

export function Game({ services }: GameProps) {
  return <CaptionGame services={services} onFinish={captionAchievements} />;
}
