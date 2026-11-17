import type { GameProps } from '../../core/game-engine/types';
import type { RankState } from './engine';
import { WordRankGame } from './WordRankGame';

export function rankAchievements(
  s: RankState,
  unlock: (id: string) => void,
  daily: Record<string, number>,
) {
  if (s.status !== 'won') return;
  unlock('first-find');
  if (s.hints === 0) unlock('no-hints');
  if (s.guesses.length <= 15) unlock('quick');
  if (s.guesses.length === 1) unlock('telepath');
  const wins = Object.values(daily).filter((n) => n > 0).length;
  if (wins >= 7) unlock('week');
}

export function Game({ services }: GameProps) {
  return <WordRankGame services={services} onFinish={rankAchievements} />;
}
