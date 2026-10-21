/** Two-player shell definition builder for Hex (#028–#029). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import { SWAP, canSwap, type HexState } from './engine';
import { hexTwoPlayerRules } from './environment';
import { HEX_STRINGS } from './i18n';
import { cellName, createHexBoard } from './HexBoard';
import { HexSeatIcon } from './HexSeatIcon';

const CLICK: Record<0 | 1, SoundSpec> = {
  0: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.2, lowpass: 2400 },
    { wave: 'triangle', freq: 520, freqEnd: 400, duration: 0.07, gain: 0.12 },
  ],
  1: [
    { wave: 'noise', freq: 0, duration: 0.04, gain: 0.2, lowpass: 3000 },
    { wave: 'triangle', freq: 620, freqEnd: 480, duration: 0.07, gain: 0.12 },
  ],
};
const SWAP_SOUND: SoundSpec = [
  { wave: 'sine', freq: 500, freqEnd: 700, duration: 0.12, gain: 0.12 },
  { wave: 'sine', freq: 700, freqEnd: 500, duration: 0.12, delay: 0.1, gain: 0.12 },
];

export interface HexGameOptions {
  size: number;
  env: GameEnvironment<HexState, number>;
  agents: AgentPreset<HexState, number>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  onRoundEnd?: (event: RoundEndEvent<HexState>) => void;
}

export function createHexDefinition(o: HexGameOptions): TwoPlayerGameDefinition<HexState, number> {
  return {
    match: {
      rules: hexTwoPlayerRules(o.size),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // Red always starts; the swap rule balances the first-move advantage.
      fixedFirstSeat: 0,
      timeControls: [
        { id: '3+2', initialMs: 3 * 60_000, incrementMs: 2_000 },
        { id: '5+5', initialMs: 5 * 60_000, incrementMs: 5_000 },
      ],
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...HEX_STRINGS.en, ...o.strings.en },
      es: { ...HEX_STRINGS.es, ...o.strings.es },
    },
    Board: createHexBoard(o.size),
    SeatIcon: HexSeatIcon,
    badge: `${o.size}×${o.size}`,
    wideLayout: o.size >= 11,
    hintAgent: o.hintAgent,
    resignable: true,
    drawless: true,
    describeAction: (before, a, _after, t) =>
      a === SWAP
        ? t('announce.swap')
        : t('announce.stone', { seat: t(`seat.${before.toMove}`), cell: cellName(a, o.size) }),
    actionSound: (_after, a, mover) => (a === SWAP ? SWAP_SOUND : CLICK[mover]),
    statusInfo: (s, t) => (s.result ? null : t(canSwap(s) ? 'info.swap' : 'info.goal')),
    describeResult: (s, t) =>
      s.result
        ? t('result.connected', { seat: t(`seat.${s.result.winner}`), n: s.result.path.length })
        : null,
    onRoundEnd: o.onRoundEnd,
  };
}
