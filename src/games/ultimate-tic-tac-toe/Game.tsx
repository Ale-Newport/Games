import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import type { MatchConfig } from '../shared/two-player/match';
import { SHELL_SOUNDS } from '../shared/two-player/sounds';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { utttEnv } from './ai-adapter';
import type { UtttState } from './engine';
import { STRINGS } from './i18n';
import { UTTT_RULES, wonFromBehind, wonOnGlobalDiagonal } from './rules';
import { UtttBoard } from './UtttBoard';

const CAPTURE: SoundSpec = [
  { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.2 },
  { wave: 'triangle', freq: 990, duration: 0.18, delay: 0.08, gain: 0.2 },
];

export const MATCH_CONFIG: MatchConfig<UtttState, number> = {
  rules: UTTT_RULES,
  difficulties: DIFFICULTIES,
  agentIds: AGENT_PRESETS.map((a) => a.id),
  defaultDifficulty: 'medium',
  defaultWatch: ['hard', 'medium'],
};

export const ULTIMATE: TwoPlayerGameDefinition<UtttState, number> = {
  match: MATCH_CONFIG,
  env: utttEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: UtttBoard,
  badge: '9×9',
  hintAgent: 'hard',
  describeAction: (before, index, after, t) => {
    const mark = after.cells[index] === 1 ? 'X' : 'O';
    const b = Math.floor(index / 9);
    const c = index % 9;
    const parts = [
      t('announce.move', { mark, n: b + 1, row: Math.floor(c / 3) + 1, col: (c % 3) + 1 }),
    ];
    if (before.boards[b] === 0 && after.boards[b] !== 0 && after.boards[b] !== 3)
      parts.push(t('announce.captured', { mark, n: b + 1 }));
    if (!after.result)
      parts.push(
        after.forced >= 0 ? t('announce.next', { n: after.forced + 1 }) : t('announce.free'),
      );
    return parts.join(' ');
  },
  actionSound: (after, index, mover) => {
    const b = Math.floor(index / 9);
    if (after.boards[b] === (mover === 0 ? 1 : 2)) return CAPTURE;
    return mover === 0 ? SHELL_SOUNDS.placeX : SHELL_SOUNDS.placeO;
  },
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty === 'medium') unlock('beat-medium');
      if (setup.difficulty === 'hard') unlock('beat-hard');
    }
    if (setup.mode === 'local') unlock('hot-seat');
    if (humanWon && wonOnGlobalDiagonal(round)) unlock('diagonal-boards');
    if (humanWon && wonFromBehind(round)) unlock('comeback');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={ULTIMATE} services={services} />;
}
