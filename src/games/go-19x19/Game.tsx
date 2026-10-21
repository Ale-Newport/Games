import type { GameProps } from '../../core/game-engine/types';
import { createGoDefinition } from '../shared/go/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { go19Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { RULES, feats } from './rules';

export const GO_19 = createGoDefinition({
  rules: RULES,
  env: go19Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['hard', 'medium'],
  hintAgent: 'medium',
  timeControls: [
    { id: '20+15', initialMs: 20 * 60_000, incrementMs: 15_000 },
    { id: '30+20', initialMs: 30 * 60_000, incrementMs: 20_000 },
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
  return <TwoPlayerGame def={GO_19} services={services} />;
}
