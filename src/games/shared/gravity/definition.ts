/** Builds the two-player shell definition for a gravity game (#005, #006). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import type { GravityRules, GravityState } from './engine';
import { gravityTwoPlayerRules } from './environment';
import { DiscIcon, createGravityBoard } from './GravityBoard';
import { GRAVITY_STRINGS } from './i18n';

const DROP: Record<0 | 1, SoundSpec> = {
  0: [
    { wave: 'sine', freq: 180, freqEnd: 90, duration: 0.16, gain: 0.35 },
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 1200 },
  ],
  1: [
    { wave: 'sine', freq: 220, freqEnd: 110, duration: 0.16, gain: 0.35 },
    { wave: 'noise', freq: 0, duration: 0.05, gain: 0.08, lowpass: 1500 },
  ],
};

export interface GravityGameOptions {
  rules: GravityRules;
  env: GameEnvironment<GravityState, number>;
  agents: AgentPreset<GravityState, number>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  onRoundEnd?: (event: RoundEndEvent<GravityState>) => void;
}

export function createGravityDefinition(
  o: GravityGameOptions,
): TwoPlayerGameDefinition<GravityState, number> {
  return {
    match: {
      rules: gravityTwoPlayerRules(o.rules),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...GRAVITY_STRINGS.en, ...o.strings.en },
      es: { ...GRAVITY_STRINGS.es, ...o.strings.es },
    },
    Board: createGravityBoard(o.rules),
    SeatIcon: DiscIcon,
    badge: `${o.rules.cols}×${o.rules.rows}`,
    hintAgent: o.hintAgent,
    describeAction: (_before, col, after, t) => {
      const mover = after.history.length % 2 === 1 ? after.firstPlayer : 1 - after.firstPlayer;
      return t('announce.drop', { seat: t(`seat.${mover}`), n: col + 1 });
    },
    actionSound: (_after, _col, mover) => DROP[mover],
    onRoundEnd: o.onRoundEnd,
  };
}
