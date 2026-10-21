import type { GameProps } from '../../core/game-engine/types';
import { createGoDefinition } from '../shared/go/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { go9Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { RULES, feats } from './rules';

export const GO_9 = createGoDefinition({
  rules: RULES,
  env: go9Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'medium',
  timeControls: [
    { id: '5+5', initialMs: 5 * 60_000, incrementMs: 5_000 },
    { id: '10+10', initialMs: 10 * 60_000, incrementMs: 10_000 },
  ],
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    const f = feats(round, setup.humanSeat);
    if (f.captured >= 10) unlock('big-capture');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (f.margin >= 10) unlock('by-ten');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={GO_9} services={services} />;
}
