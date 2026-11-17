import type { GameProps } from '../../core/game-engine/types';
import type { GroupsState } from './engine';
import { WordGroupsGame } from './WordGroupsGame';

export function groupsAchievements(
  s: GroupsState,
  unlock: (id: string) => void,
  results: Record<string, 'won' | 'lost'>,
) {
  if (s.status !== 'won') return;
  unlock('first-solve');
  if (s.mistakes === 0) unlock('flawless');
  if (s.solved[0] === 3) unlock('purple-first');
  if (s.solved.join('') === '3210') unlock('reverse-rainbow');
  if (Object.values(results).filter((r) => r === 'won').length >= 10) unlock('ten');
}

export function Game({ services }: GameProps) {
  return <WordGroupsGame services={services} onFinish={groupsAchievements} />;
}
