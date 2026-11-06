/** Two-player shell definition builder for Reversi (#010, #011). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import { countDiscs, passAction, type ReversiRules, type ReversiState } from './engine';
import { reversiTwoPlayerRules } from './environment';
import { DiscIcon, createReversiBoard, squareName } from './ReversiBoard';
import { REVERSI_STRINGS } from './i18n';

const CLACK: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.25, lowpass: 2400 },
  { wave: 'triangle', freq: 300, freqEnd: 240, duration: 0.07, gain: 0.12 },
];
const FLIPS: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.22, lowpass: 2400 },
  { wave: 'noise', freq: 0, duration: 0.03, delay: 0.07, gain: 0.14, lowpass: 3200 },
  { wave: 'noise', freq: 0, duration: 0.03, delay: 0.13, gain: 0.1, lowpass: 3800 },
];
const PASS: SoundSpec = [{ wave: 'sine', freq: 330, freqEnd: 260, duration: 0.2, gain: 0.15 }];

export interface ReversiGameOptions {
  rules: ReversiRules;
  env: GameEnvironment<ReversiState, number>;
  agents: AgentPreset<ReversiState, number>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  onRoundEnd?: (event: RoundEndEvent<ReversiState>) => void;
}

export function createReversiDefinition(
  o: ReversiGameOptions,
): TwoPlayerGameDefinition<ReversiState, number> {
  const n = o.rules.size;
  const pass = passAction(o.rules);
  return {
    match: {
      rules: reversiTwoPlayerRules(o.rules),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // Black always moves first; players choose a color.
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...REVERSI_STRINGS.en, ...o.strings.en },
      es: { ...REVERSI_STRINGS.es, ...o.strings.es },
    },
    Board: createReversiBoard(o.rules),
    SeatIcon: DiscIcon,
    badge: `${n}×${n}`,
    hintAgent: o.hintAgent,
    describeAction: (before, a, after, t) => {
      const seat = t(`seat.${before.toMove}`);
      return a === pass
        ? t('announce.pass', { seat })
        : t('announce.place', { seat, square: squareName(a, n), n: after.lastFlipped.length });
    },
    actionSound: (after, a) => (a === pass ? PASS : after.lastFlipped.length >= 3 ? FLIPS : CLACK),
    statusInfo: (s, t) => {
      const [b, w] = countDiscs(s.board);
      return s.result ? null : t('info.discs', { b, w });
    },
    describeResult: (s, t) => {
      const [b, w] = countDiscs(s.board);
      return t('result.discs', { b, w });
    },
    onRoundEnd: o.onRoundEnd,
  };
}
