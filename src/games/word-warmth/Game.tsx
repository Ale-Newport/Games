import type { GameProps } from '../../core/game-engine/types';
import type { WarmState } from './engine';
import { WordWarmthGame } from './WordWarmthGame';

export function warmthAchievements(
  s: WarmState,
  unlock: (id: string) => void,
  daily: Record<string, number>,
) {
  if (s.guesses.some((g) => g.near !== null)) unlock('warming-up');
  if (s.status !== 'won') return;
  unlock('first-solve');
  if (s.guesses.length <= 25) unlock('quick');
  if (s.guesses.length <= 10) unlock('psychic');
  if (Object.values(daily).filter((n) => n > 0).length >= 7) unlock('week');
}

export function Game({ services }: GameProps) {
  return <WordWarmthGame services={services} onFinish={warmthAchievements} />;
}
