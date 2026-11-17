import type { GameProps } from '../../core/game-engine/types';
import { CodeWordsGame } from './CodeWordsGame';
import { remaining, type CodeState } from './engine';

export function codeAchievements(
  s: CodeState,
  role: 'operative' | 'spymaster' | 'watch',
  unlock: (id: string) => void,
) {
  if (s.winner !== 'red') return;
  unlock(role === 'spymaster' ? 'spymaster-win' : 'operative-win');
  if (remaining(s, 'blue') >= 5) unlock('rout');
  const redClues = s.log.filter((e) => e.kind === 'clue' && e.clue.team === 'red').length;
  if (redClues <= 4) unlock('four-clues');
}

export function Game({ services }: GameProps) {
  return <CodeWordsGame services={services} onFinish={codeAchievements} />;
}
